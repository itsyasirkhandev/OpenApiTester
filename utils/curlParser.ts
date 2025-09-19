
import { ApiRequest, HttpMethod, KeyValue, AuthType } from '../types';

const unquote = (str: string): string => {
    if ((str.startsWith("'") && str.endsWith("'")) || (str.startsWith('"') && str.endsWith('"'))) {
        return str.slice(1, -1);
    }
    return str;
};

// A more robust command splitter that respects single and double quotes,
// allowing for spaces and newlines within quoted arguments.
const splitCommand = (command: string): string[] => {
    const args: string[] = [];
    let currentArg = '';
    let inQuote: '"' | "'" | null = null;
    let i = 0;
    
    command = command.trim();

    while (i < command.length) {
        const char = command[i];

        if (inQuote) {
            // This is a simplified parser; it doesn't handle escaped quotes inside.
            if (char === inQuote) {
                inQuote = null;
            }
            currentArg += char;
        } else {
            if (char === "'" || char === '"') {
                inQuote = char;
                currentArg += char;
            } else if (/\s/.test(char)) {
                if (currentArg.length > 0) {
                    args.push(currentArg);
                    currentArg = '';
                }
            } else {
                currentArg += char;
            }
        }
        i++;
    }

    if (currentArg.length > 0) {
        args.push(currentArg);
    }

    return args;
};


export const parseCurlCommand = (curlString: string): Partial<ApiRequest> => {
    // Replace shell line continuations (`\ ` at the end of a line) with a space.
    const cleanedCommand = curlString.replace(/\s*\\\r?\n\s*/g, ' ');
    const args = splitCommand(cleanedCommand);

    if (args[0] !== 'curl') {
        throw new Error("Command must start with 'curl'.");
    }

    const request: Partial<ApiRequest> & { headers: KeyValue[] } = {
        headers: [],
        params: [],
    };
    
    let hasData = false;
    let explicitMethod = false;

    // A set of flags that take a value, to help identify the positional URL argument.
    const valueTakingFlags = new Set([
        '-X', '--request', 
        '-H', '--header', 
        '-d', '--data', '--data-raw', '--data-binary', 
        '-u', '--user', 
        '--url'
    ]);

    // First pass: Find the URL.
    let rawUrl = '';
    const urlFlagIndex = args.indexOf('--url');
    if (urlFlagIndex > -1 && args.length > urlFlagIndex + 1) {
        rawUrl = unquote(args[urlFlagIndex + 1]);
    } else {
        // Find the first positional argument that isn't a value for another flag.
        for (let i = 1; i < args.length; i++) {
            const arg = args[i];
            if (valueTakingFlags.has(arg)) {
                i++; // This is a flag, skip its value in the next iteration.
                continue;
            }
            if (!arg.startsWith('-')) {
                rawUrl = unquote(arg);
                break; // Found the positional URL.
            }
        }
    }
    
    if (!rawUrl) {
         throw new Error("Could not find a URL in the command.");
    }
    
    // Process the found URL to separate the base from query params.
    try {
        const url = new URL(rawUrl.startsWith('http') ? rawUrl : `http://${rawUrl}`);
        const params: KeyValue[] = [];
        url.searchParams.forEach((value, key) => {
            params.push({ id: crypto.randomUUID(), key, value, enabled: true });
        });
        request.params = params;
        request.url = url.origin + url.pathname;
    } catch (e) {
        // Handle URLs with template variables that might not be valid.
        const [baseUrl, queryString] = rawUrl.split('?');
        request.url = baseUrl;
        if (queryString) {
            try {
                const searchParams = new URLSearchParams(queryString);
                const params: KeyValue[] = [];
                searchParams.forEach((value, key) => {
                    params.push({ id: crypto.randomUUID(), key, value, enabled: true });
                });
                request.params = params;
            } catch (qsError) {
                // Could not parse query string, ignore.
            }
        }
    }


    // Second pass: Process all other arguments.
    for (let i = 1; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--url':
                i++; // Already processed, just skip the value.
                break;
            case '-X':
            case '--request':
                request.method = args[++i].toUpperCase() as HttpMethod;
                explicitMethod = true;
                break;

            case '-H':
            case '--header':
                const headerStr = unquote(args[++i]);
                const separatorIndex = headerStr.indexOf(':');
                if (separatorIndex === -1) continue;

                const key = headerStr.slice(0, separatorIndex).trim();
                const value = headerStr.slice(separatorIndex + 1).trim();

                request.headers.push({ id: crypto.randomUUID(), key, value, enabled: true });
                break;

            case '-d':
            case '--data':
            case '--data-raw':
            case '--data-binary':
                request.body = unquote(args[++i]);
                hasData = true;
                break;
            
            case '-u':
            case '--user':
                const credentials = unquote(args[++i]);
                const [username, ...passwordParts] = credentials.split(':');
                const password = passwordParts.join(':');
                request.auth = {
                    type: AuthType.BASIC,
                    basicUsername: username,
                    basicPassword: password
                };
                break;
        }
    }

    // Handle Auth from headers if not set by -u
    if (!request.auth || request.auth.type === AuthType.NONE) {
        const authHeader = request.headers.find(h => h.key.toLowerCase() === 'authorization');
        if (authHeader) {
            const [authType, token] = authHeader.value.split(' ');
            if (authType.toLowerCase() === 'bearer' && token) {
                request.auth = { type: AuthType.BEARER, bearerToken: token };
            } else if (authType.toLowerCase() === 'basic' && token) {
                try {
                    const decoded = atob(token);
                    const [username, ...passwordParts] = decoded.split(':');
                    const password = passwordParts.join(':');
                    request.auth = { type: AuthType.BASIC, basicUsername: username, basicPassword: password };
                } catch (e) {
                    console.error("Failed to decode Basic auth token.");
                }
            }
        }
    }


    if (!explicitMethod) {
        request.method = hasData ? HttpMethod.POST : HttpMethod.GET;
    }

    return request;
};
