import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ApiRequest } from '../types';
import { METHOD_COLORS } from '../constants';
import { PlusIcon, XIcon, PencilIcon, DocumentDuplicateIcon, ShareIcon, XCircleIcon, CheckIcon } from './icons';
import ContextMenu from './ContextMenu';

interface TabsBarProps {
    tabs: ApiRequest[];
    activeTabId: string | null;
    onSelectTab: (id: string) => void;
    onCloseTab: (id:string) => void;
    onNewTab: () => void;
    renamingTabId: string | null;
    setRenamingTabId: (id: string | null) => void;
    onRenameTab: (id: string, newName: string) => void;
    onDuplicateTab: (id: string) => void;
    onCloseOtherTabs: (id: string) => void;
    onCopyAsCurl: (id: string) => void;
}

const TabsBar: React.FC<TabsBarProps> = ({ 
    tabs, activeTabId, onSelectTab, onCloseTab, onNewTab, 
    renamingTabId, setRenamingTabId, onRenameTab,
    onDuplicateTab, onCloseOtherTabs, onCopyAsCurl
}) => {
    const isMac = useMemo(() => navigator.platform.toUpperCase().indexOf('MAC') >= 0, []);
    const newTabShortcut = isMac ? '⌘+N' : 'Ctrl+N';
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);
    const [copiedCurl, setCopiedCurl] = useState(false);
    const renameInputRef = useRef<HTMLInputElement>(null);


    const getTabDisplayName = (tab: ApiRequest) => {
        return tab.name || tab.url || 'New Request';
    };

    const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, tabId });
    };

    const closeContextMenu = () => {
        setContextMenu(null);
        setCopiedCurl(false);
    }

    useEffect(() => {
        if (renamingTabId && renameInputRef.current) {
            renameInputRef.current.focus();
            renameInputRef.current.select();
        }
    }, [renamingTabId]);

    return (
        <div className="flex items-center border-b border-slate-700/50 bg-slate-900/50 rounded-t-lg">
            <div className="flex-1 flex items-center overflow-x-auto">
                {tabs.map((tab) => {
                    const displayName = getTabDisplayName(tab);
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onSelectTab(tab.id)}
                            onContextMenu={(e) => handleContextMenu(e, tab.id)}
                            className={`
                                flex items-center space-x-2 px-3 py-2 border-r border-slate-700/50 max-w-[250px] group
                                whitespace-nowrap text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-indigo-500 shrink-0
                                ${activeTabId === tab.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60'}
                            `}
                            title={displayName}
                        >
                            <span className={`font-bold text-xs ${METHOD_COLORS[tab.method]}`}>{tab.method}</span>
                            {renamingTabId === tab.id ? (
                                <input
                                    ref={renameInputRef}
                                    type="text"
                                    defaultValue={tab.name || ''}
                                    placeholder={tab.url || "New Request"}
                                    className="bg-slate-700 text-sm p-0.5 rounded w-full focus:outline-none ring-1 ring-indigo-500 mx-1"
                                    onClick={(e) => e.stopPropagation()}
                                    onBlur={(e) => onRenameTab(tab.id, e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            onRenameTab(tab.id, e.currentTarget.value);
                                        } else if (e.key === 'Escape') {
                                            setRenamingTabId(null);
                                        }
                                    }}
                                />
                            ) : (
                                <span className="truncate">{displayName}</span>
                            )}
                            <div 
                                className="p-0.5 rounded-full hover:bg-slate-600"
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    onCloseTab(tab.id);
                                }}
                            >
                                <XIcon className={`w-3.5 h-3.5 ${activeTabId === tab.id ? 'text-slate-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                            </div>
                        </button>
                    );
                })}
                 <button
                    onClick={onNewTab}
                    className="p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors border-r border-slate-700/50"
                    title={`New Tab (${newTabShortcut})`}
                >
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>
             {contextMenu && (
                <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={closeContextMenu}>
                    <li role="none">
                        <button
                            onClick={() => {
                                setRenamingTabId(contextMenu.tabId);
                                closeContextMenu();
                            }}
                            className="w-full text-left flex items-center space-x-3 px-3 py-1.5 text-sm hover:bg-slate-700 rounded-md"
                            role="menuitem"
                        >
                            <PencilIcon className="w-4 h-4" />
                            <span>Rename Request</span>
                            <span className="ml-auto text-xs text-slate-500">R</span>
                        </button>
                    </li>
                    <li role="none">
                        <button
                            onClick={() => {
                                onDuplicateTab(contextMenu.tabId);
                                closeContextMenu();
                            }}
                            className="w-full text-left flex items-center space-x-3 px-3 py-1.5 text-sm hover:bg-slate-700 rounded-md"
                            role="menuitem"
                        >
                            <DocumentDuplicateIcon className="w-4 h-4" />
                            <span>Duplicate Tab</span>
                            <span className="ml-auto text-xs text-slate-500">D</span>
                        </button>
                    </li>
                    <li role="none">
                        <button
                            onClick={() => {
                                onCopyAsCurl(contextMenu.tabId);
                                setCopiedCurl(true);
                                setTimeout(() => closeContextMenu(), 1500);
                            }}
                            className="w-full text-left flex items-center space-x-3 px-3 py-1.5 text-sm hover:bg-slate-700 rounded-md"
                            role="menuitem"
                        >
                            {copiedCurl ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ShareIcon className="w-4 h-4" />}
                            <span>{copiedCurl ? 'Copied!' : 'Share tab request'}</span>
                            {!copiedCurl && <span className="ml-auto text-xs text-slate-500">S</span>}
                        </button>
                    </li>
                     <div className="h-px bg-slate-700 my-1 mx-1" role="separator" />
                    <li role="none">
                        <button
                            onClick={() => {
                                onCloseTab(contextMenu.tabId);
                                closeContextMenu();
                            }}
                            className="w-full text-left flex items-center space-x-3 px-3 py-1.5 text-sm hover:bg-slate-700 rounded-md"
                            role="menuitem"
                        >
                            <XIcon className="w-4 h-4" />
                            <span>Close Tab</span>
                            <span className="ml-auto text-xs text-slate-500">W</span>
                        </button>
                    </li>
                    <li role="none">
                        <button
                            onClick={() => {
                                onCloseOtherTabs(contextMenu.tabId);
                                closeContextMenu();
                            }}
                            className="w-full text-left flex items-center space-x-3 px-3 py-1.5 text-sm hover:bg-slate-700 rounded-md"
                            role="menuitem"
                        >
                            <XCircleIcon className="w-4 h-4" />
                            <span>Close other Tabs</span>
                            <span className="ml-auto text-xs text-slate-500">X</span>
                        </button>
                    </li>
                </ContextMenu>
            )}
        </div>
    );
};

export default TabsBar;