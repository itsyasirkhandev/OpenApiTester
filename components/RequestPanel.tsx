import React, { useState, useEffect, useMemo } from 'react';
import { ApiRequest, HttpMethod, KeyValue, AuthConfig, Environment, BodyType } from '../types';
import { HTTP_METHODS, METHOD_COLORS } from '../constants';
import KeyValueEditor from './KeyValueEditor';
import AuthorizationPanel from './AuthorizationPanel';
import { CodeBracketIcon, SendIcon, CommandLineIcon, CheckIcon } from './icons';
import CodeEditor from './CodeEditor';

interface RequestPanelProps {
    request: ApiRequest;
    setRequest: React.Dispatch<React.SetStateAction<ApiRequest>>;
    onSend: () => void;
    loading: boolean;
    environment: Environment;
    onGenerateCode: () => void;
    onImportCurl: () => void;
}


type Tab = 'Params' | 'Authorization' | 'Headers' | 'Body';

const RequestPanel: React.FC<RequestPanelProps> = ({ 
    request, setRequest, onSend, loading, environment, 
    onGenerateCode, onImportCurl,
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('Params');
    
    const isMac = useMemo(() => navigator.platform.toUpperCase().indexOf('MAC') >= 0, []);
    const sendShortcut = isMac ? '⌘+Enter' : 'Ctrl+Enter';


    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUrl = e.target.value;
        const [, queryString] = newUrl.split('?');
        
        const newParams: KeyValue[] = [];
        if (queryString !== undefined) {
            try {
                const searchParams = new URLSearchParams(queryString);
                searchParams.forEach((value, key) => {
                    newParams.push({ id: crypto.randomUUID(), key, value, enabled: true });
                });
            } catch {
                 // Silently fail on invalid query string during typing
            }
        }
        
        // Update the URL and the params from the parsed URL.
        // The URL in state will contain the full string, including query params.
        // The params in state are for the KeyValueEditor.
        setRequest(prev => ({
            ...prev,
            url: newUrl,
            params: newParams,
        }));
    };

    const handleAuthChange = (auth: AuthConfig) => {
        setRequest(prev => ({...prev, auth}));
    };
    
    const handleBodyTypeChange = (type: BodyType) => {
        setRequest(prev => ({ ...prev, bodyType: type }));
    };

    const bodyCount = useMemo(() => {
        const bodyType = request.bodyType || BodyType.RAW;
        if (bodyType === BodyType.RAW) {
            return request.body.trim().length > 0;
        }
        if (bodyType === BodyType.FORMDATA || bodyType === BodyType.URLENCODED) {
            return (request.formData || []).filter(i => i.enabled && i.key).length;
        }
        return false;
    }, [request.body, request.bodyType, request.formData]);

    const counts = {
        Params: request.params.filter(p => p.enabled && p.key).length,
        Headers: request.headers.filter(h => h.enabled && h.key).length,
        Body: bodyCount,
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 rounded-lg overflow-hidden">
            <div className="flex items-center p-2 border-b border-slate-800 gap-2">
                <div className={`flex items-stretch flex-1 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden transition-all focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500`}>
                    <select
                        value={request.method}
                        onChange={(e) => setRequest({ ...request, method: e.target.value as HttpMethod })}
                        className={`bg-slate-800 border-r border-slate-700 font-semibold focus:ring-0 focus:outline-none py-2 pl-3 pr-8 appearance-none ${METHOD_COLORS[request.method]}`}
                    >
                        {HTTP_METHODS.map(method => (
                            <option key={method} value={method} className="bg-slate-900 font-sans">{method}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="https://jsonplaceholder.typicode.com/posts"
                        value={request.url}
                        onChange={handleUrlChange}
                        className="flex-1 w-full bg-transparent px-3 py-2 text-slate-300 focus:ring-0 focus:outline-none text-base leading-tight"
                    />
                    <button onClick={onImportCurl} title="Import from cURL" className="px-3 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors border-l border-slate-700">
                        <CommandLineIcon className="w-5 h-5" />
                    </button>
                    <button onClick={onGenerateCode} title="Generate Code Snippet" className="px-3 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors border-l border-slate-700">
                        <CodeBracketIcon className="w-5 h-5" />
                    </button>
                </div>
                 <button
                    onClick={onSend}
                    disabled={loading || !request.url}
                    className="flex items-center space-x-2 bg-gradient-to-br from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 disabled:from-slate-600 disabled:to-slate-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500"
                    title={`Send Request (${sendShortcut})`}
                >
                    <SendIcon className="w-5 h-5"/>
                    <span className="hidden sm:inline">{loading ? 'Sending...' : 'Send'}</span>
                </button>
            </div>
            <div className="flex px-4 border-b border-slate-800">
                {(['Params', 'Authorization', 'Headers', 'Body'] as Tab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex items-center px-3 py-2 text-sm font-medium transition-colors focus:outline-none ${
                            activeTab === tab 
                            ? 'text-indigo-400 border-b-2 border-indigo-400' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <span>{tab}</span>
                        { tab === 'Body' && (typeof counts.Body === 'number' ? counts.Body > 0 : counts.Body) && (
                            <span className={`ml-2 text-xs font-mono rounded-full px-1.5 py-0.5 flex items-center justify-center ${activeTab === tab ? 'bg-indigo-500/30 text-indigo-200' : 'bg-slate-700 text-slate-300'}`}>
                                {typeof counts.Body === 'number' ? counts.Body : <CheckIcon className="w-3 h-3" />}
                            </span>
                        )}
                         { (tab === 'Params' || tab === 'Headers') && counts[tab] > 0 && (
                            <span className={`ml-2 text-xs font-mono rounded-full px-1.5 py-0.5 flex items-center justify-center ${activeTab === tab ? 'bg-indigo-500/30 text-indigo-200' : 'bg-slate-700 text-slate-300'}`}>
                                {counts[tab]}
                            </span>
                        )}
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'Params' && (
                    <div className="p-2">
                        <KeyValueEditor 
                            items={request.params} 
                            setItems={(updater) => setRequest(prev => ({...prev, params: typeof updater === 'function' ? updater(prev.params) : updater}))} 
                            keyPlaceholder="Query Param"
                            environment={environment}
                        />
                    </div>
                )}
                {activeTab === 'Authorization' && (
                    <AuthorizationPanel auth={request.auth} onChange={handleAuthChange} environment={environment} />
                )}
                {activeTab === 'Headers' && (
                    <div className="p-2">
                        <KeyValueEditor 
                            items={request.headers} 
                            setItems={(updater) => setRequest(prev => ({...prev, headers: typeof updater === 'function' ? updater(prev.headers) : updater}))}
                            keyPlaceholder="Header Name"
                            environment={environment}
                        />
                    </div>
                )}
                {activeTab === 'Body' && (
                     <div className="flex flex-col h-full">
                        <div className="p-2 flex items-center space-x-2 border-b border-slate-800">
                            {(Object.values(BodyType)).map(type => (
                                <button key={type} onClick={() => handleBodyTypeChange(type)}
                                    className={`px-2 py-0.5 text-xs rounded-md transition-colors capitalize ${request.bodyType === type || (!request.bodyType && type === BodyType.RAW) ? 'bg-indigo-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
                                >
                                    {type.replace('-', ' ')}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 overflow-auto">
                            {(!request.bodyType || request.bodyType === BodyType.RAW) && (
                                <div className="p-2 h-full">
                                    <CodeEditor
                                        value={request.body}
                                        onChange={(newBody) => setRequest({ ...request, body: newBody })}
                                        placeholder='{ "key": "value" }'
                                    />
                                </div>
                            )}
                            {(request.bodyType === BodyType.FORMDATA || request.bodyType === BodyType.URLENCODED) && (
                                <div className="p-2">
                                    <KeyValueEditor
                                        items={request.formData || []}
                                        setItems={(updater) => setRequest(prev => ({...prev, formData: typeof updater === 'function' ? updater(prev.formData || []) : updater}))} 
                                        keyPlaceholder="Field Name"
                                        environment={environment}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RequestPanel;