
import { HttpMethod } from './types';

export const HTTP_METHODS: HttpMethod[] = [
    HttpMethod.GET,
    HttpMethod.POST,
    HttpMethod.PUT,
    HttpMethod.PATCH,
    HttpMethod.DELETE,
    HttpMethod.HEAD,
    HttpMethod.OPTIONS,
];

export const METHOD_COLORS: Record<HttpMethod, string> = {
    [HttpMethod.GET]: 'text-cyan-400',
    [HttpMethod.POST]: 'text-green-400',
    [HttpMethod.PUT]: 'text-yellow-400',
    [HttpMethod.PATCH]: 'text-orange-400',
    [HttpMethod.DELETE]: 'text-red-400',
    [HttpMethod.HEAD]: 'text-purple-400',
    [HttpMethod.OPTIONS]: 'text-indigo-400',
};