import React, { useState } from 'react';
import { ApiRequest, HttpMethod, KeyValue } from '../types';
import { METHOD_COLORS } from '../constants';
import { GlobeAltIcon, HistoryIcon, TrashIcon, XIcon, RectangleStackIcon } from './icons';
import EnvironmentEditor from './EnvironmentEditor';

interface HistorySidebarProps {
    history: ApiRequest[];
    onSelectHistory: (request: ApiRequest) => void;
    onDeleteHistory: (id: string) => void;
    onClearHistory: () => void;
    environment: KeyValue[];
    setEnvironment: React.Dispatch<React.SetStateAction<KeyValue[]>>;
    onClose: () => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

type Tab = 'History' | 'Environment';

const HistorySidebar: React.FC<HistorySidebarProps> = ({ 
    history, onSelectHistory, onDeleteHistory, onClearHistory, 
    environment, setEnvironment, 
    onClose,
    isCollapsed,
    onToggleCollapse
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('History');

    const tabs: {id: Tab, name: string, icon: React.ReactNode}[] = [
        {id: 'History', name: 'History', icon: <HistoryIcon className="w-5 h-5" /> },
        {id: 'Environment', name: 'Environment', icon: <GlobeAltIcon className="w-5 h-5" /> },
    ];
    
    const handleTabClick = (tabId: Tab) => {
        setActiveTab(tabId);
        if (isCollapsed) {
            onToggleCollapse();
        }
    };
    
    if (isCollapsed) {
        return (
            <div className="w-14 bg-slate-900 flex flex-col h-full border-r border-slate-700/50">
                 {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        className={`flex items-center justify-center py-3 text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:bg-slate-850/50'}`}
                        title={tab.name}
                    >
                        {tab.icon}
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="w-80 bg-slate-900 flex flex-col h-full border-r border-slate-700/50">
            <div className="flex items-center border-b border-slate-700/50">
                <div className="flex-1">
                    <div className="flex">
                         {tabs.map(tab => (
                             <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center space-x-2 py-2 text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-slate-850 text-white' : 'text-slate-400 hover:bg-slate-850/50'}`}
                            >
                                {tab.icon}
                                <span>{tab.name}</span>
                            </button>
                         ))}
                    </div>
                </div>
                 <button onClick={onClose} className="p-3 text-slate-400 hover:text-white md:hidden" aria-label="Close sidebar">
                    <XIcon className="w-5 h-5"/>
                </button>
            </div>
            
            {activeTab === 'History' && (
                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-3 border-b border-slate-800 flex justify-between items-center">
                        <h2 className="text-base font-semibold">Requests</h2>
                        {history.length > 0 && (
                            <button onClick={onClearHistory} className="text-xs text-slate-400 hover:text-red-400 transition-colors">
                                Clear All
                            </button>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {history.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center p-4">Your request history will appear here.</p>
                        ) : (
                            <ul>
                                {history.slice().reverse().map(req => (
                                    <li key={req.id} className="border-b border-slate-800 group">
                                        <div className="flex items-center justify-between p-3 hover:bg-slate-850 cursor-pointer" onClick={() => onSelectHistory(req)}>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="flex items-baseline space-x-2">
                                                    <span className={`font-bold text-sm ${METHOD_COLORS[req.method]}`}>{req.method}</span>
                                                    <span className="truncate text-slate-300 text-sm">{req.name || req.url}</span>
                                                </div>
                                                 {req.name && <p className="text-xs text-slate-500 truncate">{req.url}</p>}
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteHistory(req.id); }}
                                                className="ml-2 p-1 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
            
            {activeTab === 'Environment' && (
                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-3 border-b border-slate-800">
                        <h2 className="text-base font-semibold">Global Variables</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        <EnvironmentEditor environment={environment} setEnvironment={setEnvironment} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistorySidebar;