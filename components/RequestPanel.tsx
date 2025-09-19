import React, { useState, useEffect, useMemo } from 'react';
import { ApiRequest, HttpMethod, KeyValue, AuthConfig, Environment } from '../types';
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
    const [isUrlFocused, setIsUrlFocused] = useState(false);
    
    const isMac = useMemo(() => navigator.platform.toUpperCase().indexOf('MAC') >= 0, []);
    const sendShortcut = isMac ? '⌘+Enter' : 'Ctrl+Enter';


    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUrl = e.target.value;
        const oldUrl = request.url;
        setRequest(prev => ({...prev, url: newUrl }));
        
        // Basic auto-param generation, avoiding excessive updates
        if (newUrl.includes('?') && !oldUrl.includes('?')) {
            try {
                const url = new URL(newUrl.startsWith('http') ? newUrl : `http://${newUrl}`);
                const newParams: KeyValue[] = [];
                url.searchParams.forEach((value, key) => {
                     if (!request.params.some(p => p.key === key)) {
                        newParams.push({ id: crypto.randomUUID(), key, value, enabled: true });
                     }
                });
                if (newParams.length > 0) {
                     setRequest(prev => ({ ...prev, params: [...prev.params, ...newParams] }));
                }
            } catch (e) {
                // Invalid URL during typing, ignore
            }
        }
    };
    
    // Update URL when params change
    useEffect(() => {
        if (!isUrlFocused) {
            try {
                const [baseUrl] = request.url.split('?');
                const params = new URLSearchParams();
                request.params.forEach(p => {
                    if (p.enabled && p.key) {
                        params.append(p.key, p.value);
                    }
                });
                const queryString = params.toString();
                setRequest(prev => ({
                    ...prev,
                    url: queryString ? `${baseUrl}?${queryString}` : baseUrl
                }));
            } catch(e) {
                console.error("Error updating URL from params", e);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [request.params, isUrlFocused]);


    const handleAuthChange = (auth: AuthConfig) => {
        setRequest(prev => ({...prev, auth}));
    };
    
    const counts = {
        Params: request.params.filter(p => p.enabled && p.key).length,
        Headers: request.headers.filter(h => h.enabled && h.key).length,
        Body: request.body.trim().length > 0
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
                        onFocus={() => setIsUrlFocused(true)}
                        onBlur={() => setIsUrlFocused(false)}
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
                        {/* Fix: Use type narrowing to safely check counts for different tabs. */}
                         {tab !== 'Authorization' && (((tab === 'Params' || tab === 'Headers') && counts[tab] > 0) || (tab === 'Body' && counts.Body)) && (
                            <span className={`ml-2 text-xs font-mono rounded-full px-1.5 py-0.5 flex items-center justify-center ${activeTab === tab ? 'bg-indigo-500/30 text-indigo-200' : 'bg-slate-700 text-slate-300'}`}>
                                {tab === 'Body' ? <CheckIcon className="w-3 h-3" /> : counts[tab]}
                            </span>
                        )}
                    </button>
                ))}
            </div>
            <div className="flex-1 p-2 overflow-y-auto">
                {activeTab === 'Params' && (
                    <KeyValueEditor 
                        items={request.params} 
                        setItems={(updater) => setRequest(prev => ({...prev, params: typeof updater === 'function' ? updater(prev.params) : updater}))} 
                        keyPlaceholder="Query Param"
                        environment={environment}
                    />
                )}
                {activeTab === 'Authorization' && (
                    <AuthorizationPanel auth={request.auth} onChange={handleAuthChange} environment={environment} />
                )}
                {activeTab === 'Headers' && (
                    <KeyValueEditor 
                        items={request.headers} 
                        setItems={(updater) => setRequest(prev => ({...prev, headers: typeof updater === 'function' ? updater(prev.headers) : updater}))}
                        keyPlaceholder="Header Name"
                        environment={environment}
                    />
                )}
                {activeTab === 'Body' && (
                    <CodeEditor
                        value={request.body}
                        onChange={(newBody) => setRequest({ ...request, body: newBody })}
                        placeholder='{ "key": "value" }'
                    />
                )}
            </div>
        </div>
    );
};

export default RequestPanel;