import { ApiRequest, Environment } from '../types';
import { getAuthHeader } from './auth';
import { substituteVariables } from './variables';

const shellEscape = (str: string) => {
    return `'${str.replace(/'/g, "'\\''")}'`;
};

export const generateCurlCommand = (request: ApiRequest, environment: Environment): string => {
    // Perform substitutions for all parts of the request
    const finalRequest: ApiRequest = {
        ...request,
        url: substituteVariables(request.url, environment),
        headers: request.headers.map(h => ({...h, value: substituteVariables(h.value, environment)})),
        body: substituteVariables(request.body, environment),
        auth: {
            ...request.auth,
            bearerToken: substituteVariables(request.auth.bearerToken || '', environment),
            basicUsername: substituteVariables(request.auth.basicUsername || '', environment),
            basicPassword: substituteVariables(request.auth.basicPassword || '', environment),
        }
    };

    let curl = `curl --request ${finalRequest.method} \\\n  --url ${shellEscape(finalRequest.url)}`;

    const headers = finalRequest.headers.filter(h => h.enabled && h.key);
    const authHeader = getAuthHeader(finalRequest.auth);
    
    // Add auth header if it's not already present
    if (authHeader && !headers.some(h => h.key.toLowerCase() === 'authorization')) {
        curl += ` \\\n  --header ${shellEscape(`Authorization: ${authHeader}`)}`;
    }
    
    for (const header of headers) {
        curl += ` \\\n  --header ${shellEscape(`${header.key}: ${header.value}`)}`;
    }

    if (finalRequest.body && (finalRequest.method === 'POST' || finalRequest.method === 'PUT' || finalRequest.method === 'PATCH')) {
        curl += ` \\\n  --data ${shellEscape(finalRequest.body)}`;
    }

    return curl;
};