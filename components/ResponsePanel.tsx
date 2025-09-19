import React, { useState } from 'react';
import { ApiResponse } from '../types';
import { SpinnerIcon } from './icons';
import JsonViewer from './JsonViewer';

interface ResponsePanelProps {
    response: ApiResponse | null;
    error: string | null;
    loading: boolean;
}

type Tab = 'Body' | 'Headers';
type BodyView = 'Pretty' | 'Raw' | 'Preview';

const ResponsePanel: React.FC<ResponsePanelProps> = ({ response, error, loading }) => {
    const [activeTab, setActiveTab] = useState<Tab>('Body');
    const [bodyView, setBodyView] = useState<BodyView>('Pretty');

    const getStatusBadgeClass = (status: number) => {
        if (status >= 200 && status < 300) return 'bg-green-500/20 text-green-300';
        if (status >= 300 && status < 400) return 'bg-yellow-500/20 text-yellow-300';
        if (status >= 400 && status < 500) return 'bg-orange-500/20 text-orange-400';
        if (status >= 500) return 'bg-red-500/20 text-red-400';
        return 'bg-slate-500/20 text-slate-300';
    };

    const renderBody = () => {
        if (!response?.data) return <div className="p-4 text-slate-500">Empty response body.</div>;
        
        const rawBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2);

        if (response.type === 'image' && response.url) {
             return (
                <div className="p-4 flex items-center justify-center bg-checkered-pattern h-full">
                    <img src={response.url} alt="API response" className="max-w-full max-h-full object-contain shadow-lg" />
                </div>
            )
        }
        
        if(bodyView === 'Preview' && response.type === 'html') {
            return <iframe srcDoc={rawBody} className="w-full h-full bg-white" sandbox="allow-scripts" />;
        }
        
        if (bodyView === 'Preview' && response.type !== 'html') {
             return <div className="p-4 text-slate-500">Preview is only available for HTML content.</div>
        }

        if(bodyView === 'Raw') {
             return <pre className="w-full h-full text-sm p-2"><code>{rawBody}</code></pre>;
        }

        // Pretty view
        if (response.type === 'json') {
             return <JsonViewer data={response.data} />;
        }
        
        // Fallback for other types like text, xml in pretty view
        return <pre className="w-full h-full text-sm p-2"><code>{rawBody}</code></pre>;
    }


    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-900 rounded-lg border border-slate-800 text-slate-400">
                <div className="flex flex-col items-center">
                    <SpinnerIcon className="animate-spin h-8 w-8 text-indigo-500" />
                    <span className="mt-2">Sending request...</span>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
             <div className="flex flex-col h-full bg-slate-900 rounded-lg border border-red-500/50 overflow-hidden">
                <div className="p-2 border-b border-red-500/50">
                    <h3 className="font-bold text-red-400">Error</h3>
                </div>
                <div className="p-4 font-mono text-sm text-red-300 overflow-auto">
                    {error}
                </div>
            </div>
        )
    }

    if (!response) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-900 rounded-lg border border-slate-800 text-slate-500">
                <span>Send a request to see the response here</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-2 border-b border-slate-800 text-sm">
                <div className="flex items-center gap-4">
                    <span className="font-medium text-slate-300">Status:</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(response.status)}`}>
                        {response.status} {response.statusText}
                    </span>
                </div>
                <div className="flex items-center gap-6 font-mono text-xs">
                     <span>Time: <span className="font-semibold text-indigo-300">{response.time}ms</span></span>
                     <span>Size: <span className="font-semibold text-indigo-300">{(response.size / 1024).toFixed(2)} KB</span></span>
                </div>
            </div>
             <div className="flex px-4 border-b border-slate-800 justify-between items-center">
                <div className="flex">
                    {(['Body', 'Headers'] as Tab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-2 text-sm font-medium transition-colors focus:outline-none ${
                                activeTab === tab 
                                ? 'text-indigo-400 border-b-2 border-indigo-400' 
                                : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                {activeTab === 'Body' && (
                    <div className="flex items-center space-x-1">
                         {(['Pretty', 'Raw', 'Preview'] as BodyView[]).map(view => (
                            <button key={view} onClick={() => setBodyView(view)}
                                className={`px-2 py-0.5 text-xs rounded-md transition-colors ${bodyView === view ? 'bg-indigo-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
                            >
                                {view}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex-1 overflow-auto bg-slate-800/50">
                {activeTab === 'Body' && (
                    <div className="w-full h-full">{renderBody()}</div>
                )}
                {activeTab === 'Headers' && (
                    <div className="space-y-1 text-sm font-mono p-4">
                        {Object.entries(response.headers).map(([key, value]) => (
                            <div key={key} className="grid grid-cols-[minmax(120px,auto),1fr] gap-2 items-baseline">
                                <span className="text-slate-400 break-all font-semibold">{key}:</span>
                                <span className="text-slate-200 break-all">{value}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResponsePanel;