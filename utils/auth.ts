import { AuthConfig, AuthType } from '../types';

export const getAuthHeader = (auth: AuthConfig): string | null => {
    switch (auth.type) {
        case AuthType.BEARER:
            return auth.bearerToken ? `Bearer ${auth.bearerToken}` : null;
        case AuthType.BASIC:
            if (auth.basicUsername || auth.basicPassword) {
                const credentials = `${auth.basicUsername || ''}:${auth.basicPassword || ''}`;
                return `Basic ${btoa(credentials)}`;
            }
            return null;
        default:
            return null;
    }
};