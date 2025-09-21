
import { ApiRequest, HttpMethod, KeyValue, AuthType, BodyType } from '../types';

const unquote = (str: string): string => {
    if (!str) return '';
    const firstChar = str[0];
    const lastChar = str[str.length - 1];

    if (str.length >= 2 && firstChar === lastChar && (firstChar === "'" || firstChar === '"')) {
        const inner = str.slice(1, -1);
        
        if (firstChar === "'") {
            // In single quotes, everything is literal.
            return inner;
        }

        if (firstChar === '"') {
            // In double quotes, unescape \" and \\.
            // This regex finds a backslash followed by either a quote or another backslash,
            // and replaces the two-character sequence with just the second character.
            return inner.replace(/\\(["\\])/g, '$1');
        }
    }
    
    return str;
};

const splitCommand = (command: string): string[] => {
    // This regex handles splitting by spaces, but respects quoted strings.
    // It's not perfect for all edge cases of escaped quotes within quotes, but good for most.
    const regex = /[^\s"']+|"([^"\\]*(\\.[^"\\]*)*)"|'([^'\\]*(\\.[^'\\]*)*)'/g;
    return command.match(regex) || [];
};


export const parseCurlCommand = (curlString: string): Partial<ApiRequest> => {
    const cleanedCommand = curlString.replace(/\s*\\\r?\n\s*/g, ' ').trim();
    if (!cleanedCommand.startsWith('curl')) {
        throw new Error("Command must start with 'curl'.");
    }
    
    const args = splitCommand(cleanedCommand);
    args.shift(); // remove 'curl'

    const request: Partial<ApiRequest> & { headers: KeyValue[]; params: KeyValue[]; formData: KeyValue[] } = {
        headers: [],
        params: [],
        formData: [],
        bodyType: BodyType.RAW,
    };
    
    let dataParts: {type: 'form' | 'data', value: string}[] = [];
    let explicitMethod: HttpMethod | undefined;

    const valueTakingFlags = new Set([
        '-X', '--request', '-H', '--header', '-d', '--data', '--data-raw',
        '-u', '--user', '--url', '--form', '--data-urlencode'
    ]);
    
    // Find URL first - it's usually the first argument that is not a flag or a value for a flag.
    let urlString: string | undefined;
    const urlFlagIndex = args.findIndex(arg => arg === '--url');
    if (urlFlagIndex !== -1 && args.length > urlFlagIndex + 1) {
        urlString = unquote(args[urlFlagIndex + 1]);
    } else {
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (valueTakingFlags.has(arg)) {
                i++; // skip next arg as it's a value for this flag
                continue;
            }
            if (!arg.startsWith('-')) {
                urlString = unquote(arg);
                break;
            }
        }
    }

    if (!urlString) throw new Error("Could not find a URL in the command.");

    try {
        const url = new URL(urlString.startsWith('http') ? urlString : `https:// ${urlString}`);
        request.url = url.origin + url.pathname;
        url.searchParams.forEach((value, key) => {
            request.params.push({ id: crypto.randomUUID(), key, value, enabled: true });
        });
    } catch(e) {
        const [baseUrl, query] = urlString.split('?');
        request.url = baseUrl;
        if (query) {
            const params = new URLSearchParams(query);
            params.forEach((value, key) => {
                request.params.push({ id: crypto.randomUUID(), key, value, enabled: true });
            });
        }
    }

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === urlString || unquote(arg) === urlString) continue;

        switch (arg) {
            case '-L': case '--location':
                break;
            case '-X': case '--request':
                explicitMethod = args[++i].toUpperCase() as HttpMethod;
                break;
            case '-H': case '--header':
                const headerStr = unquote(args[++i]);
                const separatorIndex = headerStr.indexOf(':');
                if (separatorIndex === -1) continue;
                const key = headerStr.slice(0, separatorIndex).trim();
                const value = headerStr.slice(separatorIndex + 1).trim();
                request.headers.push({ id: crypto.randomUUID(), key, value, enabled: true });
                break;
            case '--form':
                dataParts.push({ type: 'form', value: unquote(args[++i]) });
                break;
            case '-d': case '--data': case '--data-raw': case '--data-binary': case '--data-urlencode':
                dataParts.push({ type: 'data', value: unquote(args[++i]) });
                break;
            case '-u': case '--user':
                const credentials = unquote(args[++i]);
                const [username, ...passwordParts] = credentials.split(':');
                request.auth = {
                    type: AuthType.BASIC,
                    basicUsername: username,
                    basicPassword: passwordParts.join(':')
                };
                break;
            case '--url':
                i++; // already handled
                break;
        }
    }
    
    if (explicitMethod) request.method = explicitMethod;

    if (dataParts.length > 0) {
        if (!request.method) request.method = HttpMethod.POST;
        
        const hasForm = dataParts.some(p => p.type === 'form');
        if (hasForm) {
            request.bodyType = BodyType.FORMDATA;
            for (const part of dataParts) {
                const [key, ...valueParts] = part.value.split('=');
                const value = valueParts.join('=');
                if (value.startsWith('@')) {
                    request.formData.push({ id: crypto.randomUUID(), key, value: `File: ${value.substring(1)} (File uploads not yet supported)`, enabled: false });
                } else {
                    request.formData.push({ id: crypto.randomUUID(), key, value, enabled: true });
                }
            }
        } else {
            const contentTypeHeader = request.headers.find(h => h.key.toLowerCase() === 'content-type');
            if (contentTypeHeader && contentTypeHeader.value.toLowerCase().includes('application/json')) {
                request.bodyType = BodyType.RAW;
                request.body = dataParts.map(p => p.value).join('&');
            } else {
                request.bodyType = BodyType.URLENCODED;
                for (const part of dataParts) {
                    const pairs = part.value.split('&');
                    for (const pair of pairs) {
                         const [key, ...valueParts] = pair.split('=');
                         request.formData.push({ id: crypto.randomUUID(), key, value: valueParts.join('='), enabled: true });
                    }
                }
            }
        }
    }
    
    if (!request.method) request.method = HttpMethod.GET;

    if (!request.auth) {
        const authHeader = request.headers.find(h => h.key.toLowerCase() === 'authorization');
        if (authHeader) {
            const [authType, token] = authHeader.value.split(' ');
            if (authType.toLowerCase() === 'bearer' && token) {
                request.auth = { type: AuthType.BEARER, bearerToken: token };
            } else if (authType.toLowerCase() === 'basic' && token) {
                try {
                    const decoded = atob(token);
                    const [username, ...passwordParts] = decoded.split(':');
                    request.auth = { type: AuthType.BASIC, basicUsername: username, basicPassword: passwordParts.join(':') };
                } catch (e) { console.error("Failed to decode Basic auth token."); }
            }
        }
    }

    return request;
};
