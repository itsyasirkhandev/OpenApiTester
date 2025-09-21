// Fix: Removed self-import of HttpMethod that caused declaration conflicts.

export enum HttpMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    PATCH = 'PATCH',
    DELETE = 'DELETE',
    HEAD = 'HEAD',
    OPTIONS = 'OPTIONS',
}

export enum VariableType {
    AUTO = 'Auto',
    STRING = 'String',
    NUMBER = 'Number',
    BOOLEAN = 'Boolean',
    JSON = 'JSON',
}


export interface KeyValue {
    id: string;
    key: string;
    value: string;
    enabled: boolean;
    type?: VariableType;
}

export enum AuthType {
    NONE = 'None',
    BEARER = 'Bearer Token',
    BASIC = 'Basic Auth',
}

export interface AuthConfig {
    type: AuthType;
    bearerToken?: string;
    basicUsername?: string;
    basicPassword?: string;
}

export enum BodyType {
    RAW = 'raw',
    FORMDATA = 'form-data',
    URLENCODED = 'x-www-form-urlencoded',
}

export interface ApiRequest {
    id: string;
    url: string;
    method: HttpMethod;
    params: KeyValue[];
    headers: KeyValue[];
    body: string;
    auth: AuthConfig;
    name?: string;
    bodyType?: BodyType;
    formData?: KeyValue[];
}

export interface ApiResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: any;
    time: number;
    size: number;
    type: 'json' | 'html' | 'xml' | 'text' | 'image' | 'binary';
    url?: string; // For images
}

export type Environment = KeyValue[];

// Fix: Add CollectionItem and related types for Collections feature
interface BaseCollectionItem {
    id: string;
    name: string;
    parentId: string | null;
}

export interface CollectionFolder extends BaseCollectionItem {
    type: 'folder';
    children: CollectionItem[];
}

export interface CollectionRequestItem extends BaseCollectionItem {
    type: 'request';
    request: Omit<ApiRequest, 'id'>;
}

export type CollectionItem = CollectionFolder | CollectionRequestItem;