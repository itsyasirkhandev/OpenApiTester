import { ApiRequest, Environment, BodyType } from '../types';
import { getAuthHeader } from './auth';
import { substituteVariables } from './variables';

const shellEscape = (str: string) => {
    if (!str) return "''";
    return `'${str.replace(/'/g, "'\\''")}'`;
};

export const generateCurlCommand = (request: ApiRequest, environment: Environment): string => {
    // Perform substitutions for all parts of the request
    const finalRequest: ApiRequest = {
        ...request,
        url: substituteVariables(request.url, environment),
        headers: request.headers.map(h => ({...h, value: substituteVariables(h.value, environment)})),
        body: substituteVariables(request.body, environment),
        formData: (request.formData || []).map(kv => ({...kv, value: substituteVariables(kv.value, environment)})),
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
        if (finalRequest.bodyType === BodyType.FORMDATA && header.key.toLowerCase() === 'content-type') {
            continue; // cURL will set this for --form
        }
        curl += ` \\\n  --header ${shellEscape(`${header.key}: ${header.value}`)}`;
    }

    const bodyType = finalRequest.bodyType || BodyType.RAW;

    if (!['GET', 'HEAD'].includes(finalRequest.method)) {
        if (bodyType === BodyType.FORMDATA && finalRequest.formData) {
            for (const item of finalRequest.formData.filter(i => i.enabled && i.key)) {
                curl += ` \\\n  --form ${shellEscape(`${item.key}=${item.value}`)}`;
            }
        } else if (bodyType === BodyType.URLENCODED && finalRequest.formData) {
             const data = finalRequest.formData
                .filter(item => item.enabled && item.key)
                .map(item => `${encodeURIComponent(item.key)}=${encodeURIComponent(item.value)}`)
                .join('&');
            if (data) {
                curl += ` \\\n  --data ${shellEscape(data)}`;
            }
        } else if (finalRequest.body) {
            curl += ` \\\n  --data ${shellEscape(finalRequest.body)}`;
        }
    }

    return curl;
};