
import React, { useState, useCallback, useEffect, useMemo } from 'react';
// Fix: Add CollectionItem and CollectionRequest to imports
import { ApiRequest, ApiResponse, HttpMethod, AuthType, Environment } from './types';
import RequestPanel from './components/RequestPanel';
import ResponsePanel from './components/ResponsePanel';
import HistorySidebar from './components/HistorySidebar';
import CodeGenerationModal from './components/CodeGenerationModal';
import CurlImportModal from './components/CurlImportModal';
import TabsBar from './components/TabsBar';
import CommandPalette, { Command } from './components/CommandPalette';
import ResizablePanel from './components/ResizablePanel';
import { substituteVariables } from './utils/variables';
import { getAuthHeader } from './utils/auth';
import { MenuIcon, SendIcon, PlusIcon, TrashIcon, RectangleStackIcon, HistoryIcon, ChevronDoubleLeftIcon } from './components/icons';
import { generateCurlCommand } from './utils/codegen';

const createDefaultRequest = (): ApiRequest => ({
    id: crypto.randomUUID(),
    method: HttpMethod.GET,
    url: '',
    params: [],
    headers: [
        { id: crypto.randomUUID(), key: 'Content-Type', value: 'application/json', enabled: true }
    ],
    body: '',
    auth: { type: AuthType.NONE }
});

const usePersistentState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [state, setState] = useState<T>(() => {
        try {
            const storedValue = localStorage.getItem(key);
            if (storedValue) {
                 const parsed = JSON.parse(storedValue);
                 // Basic validation to prevent empty state on corrupted storage
                 if (Array.isArray(parsed) && parsed.length === 0 && key === 'api-crafter-tabs') {
                    return defaultValue;
                 }
                 if (parsed) return parsed;
            }
            return defaultValue;
        } catch {
            return defaultValue;
        }
    });

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(state));
    }, [key, state]);

    return [state, setState];
};

function App() {
    const [tabs, setTabs] = usePersistentState<ApiRequest[]>('api-crafter-tabs', [createDefaultRequest()]);
    const [activeTabId, setActiveTabId] = usePersistentState<string | null>('api-crafter-activeTabId', tabs.length > 0 ? tabs[0].id : null);
    
    const [responses, setResponses] = useState<Record<string, ApiResponse | null>>({});
    const [loadings, setLoadings] = useState<Record<string, boolean>>({});
    const [errors, setErrors] = useState<Record<string, string | null>>({});

    const [history, setHistory] = usePersistentState<ApiRequest[]>('api-crafter-history', []);
    const [environment, setEnvironment] = usePersistentState<Environment>('api-crafter-environment', []);
    const [panelSizes, setPanelSizes] = usePersistentState<number[]>('api-crafter-panel-sizes', [50, 50]);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = usePersistentState<boolean>('api-crafter-sidebar-collapsed', false);

    const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
    const [isCurlModalOpen, setIsCurlModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [renamingTabId, setRenamingTabId] = useState<string | null>(null);

    const isMac = useMemo(() => navigator.platform.toUpperCase().indexOf('MAC') >= 0, []);
    const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId) || null, [tabs, activeTabId]);
    const activeResponse = activeTabId ? responses[activeTabId] : null;
    const activeLoading = activeTabId ? !!loadings[activeTabId] : false;
    const activeError = activeTabId ? errors[activeTabId] : null;
    
    // Ensure there's always at least one tab and an active tab ID
    useEffect(() => {
        if (tabs.length === 0) {
            const newTab = createDefaultRequest();
            setTabs([newTab]);
            setActiveTabId(newTab.id);
        } else if (!activeTabId || !tabs.some(t => t.id === activeTabId)) {
            setActiveTabId(tabs[0].id);
        }
    }, [tabs, activeTabId, setTabs, setActiveTabId]);


    const setActiveTab = useCallback((updater: React.SetStateAction<ApiRequest>) => {
        if (!activeTabId) return;
        setTabs(prevTabs => prevTabs.map(tab => {
            if (tab.id === activeTabId) {
                const updatedTab = typeof updater === 'function' ? updater(tab) : updater;
                return updatedTab;
            }
            return tab;
        }));
    }, [activeTabId, setTabs]);

    const handleNewTab = useCallback(() => {
        const newTab = createDefaultRequest();
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
    }, [setTabs, setActiveTabId]);

    const handleCloseTab = useCallback((idToClose: string) => {
        const tabIndex = tabs.findIndex(t => t.id === idToClose);
        if (tabIndex === -1) return;

        if (idToClose === activeTabId) {
            const newActiveIndex = tabIndex > 0 ? tabIndex - 1 : 0;
            if (tabs.length > 1) {
                setActiveTabId(tabs[newActiveIndex].id);
            } else {
                setActiveTabId(null);
            }
        }

        setTabs(prev => prev.filter(t => t.id !== idToClose));
        setResponses(prev => { const next = {...prev}; delete next[idToClose]; return next; });
        setErrors(prev => { const next = {...prev}; delete next[idToClose]; return next; });
        setLoadings(prev => { const next = {...prev}; delete next[idToClose]; return next; });

    }, [tabs, activeTabId, setTabs, setActiveTabId]);
    
    const handleRenameTab = useCallback((id: string, newName: string) => {
        setTabs(prevTabs =>
            prevTabs.map(tab => (tab.id === id ? { ...tab, name: newName.trim() } : tab))
        );
        setRenamingTabId(null);
    }, [setTabs]);

    const handleDuplicateTab = useCallback((idToDuplicate: string) => {
        const tabToDuplicate = tabs.find(t => t.id === idToDuplicate);
        if (!tabToDuplicate) return;

        const newTab = {
            ...JSON.parse(JSON.stringify(tabToDuplicate)), // Deep copy
            id: crypto.randomUUID(),
            name: `${tabToDuplicate.name || tabToDuplicate.url || 'Request'} (Copy)`
        };

        const tabIndex = tabs.findIndex(t => t.id === idToDuplicate);
        const newTabs = [...tabs];
        newTabs.splice(tabIndex + 1, 0, newTab);

        setTabs(newTabs);
        setActiveTabId(newTab.id);
    }, [tabs, setTabs, setActiveTabId]);

    const handleCloseOtherTabs = useCallback((idToKeep: string) => {
        const tabToKeep = tabs.find(t => t.id === idToKeep);
        if (tabToKeep) {
            setTabs([tabToKeep]);
            setActiveTabId(idToKeep);
        }
    }, [tabs, setTabs, setActiveTabId]);
    
    const handleCopyAsCurl = useCallback((tabId: string) => {
        const tab = tabs.find(t => t.id === tabId);
        if (tab) {
            const curlCommand = generateCurlCommand(tab, environment);
            navigator.clipboard.writeText(curlCommand);
        }
    }, [tabs, environment]);

    const handleSendRequest = useCallback(async () => {
        if (!activeTab || !activeTabId) return;

        setLoadings(prev => ({...prev, [activeTabId]: true }));
        setResponses(prev => ({...prev, [activeTabId]: null }));
        setErrors(prev => ({...prev, [activeTabId]: null }));

        const startTime = Date.now();
        let responseUrl: string | undefined = undefined;

        try {
            const [baseUrl, ...queryParts] = activeTab.url.split('?');
            const queryStringFromUrl = queryParts.join('?');
            const finalBaseUrl = substituteVariables(baseUrl, environment);
            const finalParams = new URLSearchParams();
            if (queryStringFromUrl) {
                const urlParams = new URLSearchParams(queryStringFromUrl);
                urlParams.forEach((value, key) => finalParams.append(key, substituteVariables(value, environment)));
            }
            activeTab.params.filter(p => p.enabled && p.key).forEach(p => finalParams.set(p.key, substituteVariables(p.value, environment)));
            const finalQueryString = finalParams.toString();
            const finalUrlString = finalQueryString ? `${finalBaseUrl}?${finalQueryString}` : finalBaseUrl;
            const substitutedBody = substituteVariables(activeTab.body, environment);
            const finalBody = typeof substitutedBody === 'object' ? JSON.stringify(substitutedBody) : substitutedBody;

            const finalRequest: ApiRequest = {
                ...activeTab, url: finalUrlString,
                headers: activeTab.headers.map(h => ({...h, value: substituteVariables(h.value, environment)})),
                body: finalBody,
                auth: { ...activeTab.auth,
                    bearerToken: substituteVariables(activeTab.auth.bearerToken || '', environment),
                    basicUsername: substituteVariables(activeTab.auth.basicUsername || '', environment),
                    basicPassword: substituteVariables(activeTab.auth.basicPassword || '', environment),
                }
            };
            
            const headers = new Headers();
            finalRequest.headers.filter(h => h.enabled && h.key).forEach(h => headers.append(h.key, h.value));
            const authHeader = getAuthHeader(finalRequest.auth);
            if (authHeader) headers.append('Authorization', authHeader);

            const fetchOptions: RequestInit = { method: finalRequest.method, headers };
            if (!['GET', 'HEAD'].includes(finalRequest.method) && finalRequest.body) fetchOptions.body = finalRequest.body;

            const finalUrl = finalRequest.url;
            const res = await fetch(finalUrl, fetchOptions);
            const endTime = Date.now();

            const responseHeaders: Record<string, string> = {};
            res.headers.forEach((value, key) => { responseHeaders[key] = value; });
            const contentType = responseHeaders['content-type'] || '';
            let data: any; let size: number; let responseType: ApiResponse['type'] = 'text';

            if (contentType.includes('application/json')) {
                const text = await res.text();
                data = JSON.parse(text); size = new Blob([text]).size; responseType = 'json';
            } else if (contentType.startsWith('image/')) {
                const blob = await res.blob();
                data = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
                responseUrl = data;
                size = blob.size; responseType = 'image';
            } else {
                const text = await res.text();
                data = text; size = new Blob([text]).size;
                if (contentType.includes('text/html')) responseType = 'html';
                else if (contentType.includes('application/xml')) responseType = 'xml';
            }
            
            setResponses(prev => ({...prev, [activeTabId]: {
                status: res.status, statusText: res.statusText, headers: responseHeaders,
                data, time: endTime - startTime, size, type: responseType, url: responseUrl,
            }}));
            setHistory(prev => [activeTab, ...prev.filter(h => h.id !== activeTab.id)].slice(0, 50));
        } catch (err: any) {
            setErrors(prev => ({...prev, [activeTabId]: err.message || 'An unknown error occurred. This could be a CORS issue.' }));
        } finally {
            setLoadings(prev => ({...prev, [activeTabId]: false }));
        }
    }, [activeTab, activeTabId, environment, setHistory]);

    // Keyboard Shortcuts & Command Palette
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const modifier = isMac ? e.metaKey : e.ctrlKey;

            if (modifier && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(p => !p);
            }
            const activeEl = document.activeElement;
            const isInputFocused = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');
            if (isCodeModalOpen || isCurlModalOpen || isCommandPaletteOpen || (isInputFocused && e.key !== 'Enter')) return;

            if (modifier && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                handleNewTab();
            }
            if (modifier && e.key === 'Enter') {
                e.preventDefault();
                if(activeTab) handleSendRequest();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTab, handleNewTab, handleSendRequest, isCodeModalOpen, isCurlModalOpen, isCommandPaletteOpen]);

    const handleOpenRequestInTab = (requestToOpen: Omit<ApiRequest, 'id'>) => {
        const newTab = { ...createDefaultRequest(), ...requestToOpen, id: crypto.randomUUID() };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
        setIsSidebarOpen(false);
    };

    const handleDeleteHistory = (id: string) => setHistory(prev => prev.filter(h => h.id !== id));
    const handleClearHistory = () => setHistory([]);

    const handleCurlImport = (parsedRequest: Partial<ApiRequest>) => {
        const newTab = { ...createDefaultRequest(), ...parsedRequest, id: crypto.randomUUID() };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
        setIsCurlModalOpen(false);
    };

    const commands = useMemo<Command[]>(() => {
        const tabCommands = tabs.map(tab => ({
            id: `tab-${tab.id}`, name: `Switch to: ${tab.name || tab.url || 'New Request'}`,
            action: () => setActiveTabId(tab.id), icon: <RectangleStackIcon className="w-5 h-5"/>, section: 'Open Tabs',
        }));
        const generalCommands = [
             { id: 'send-request', name: 'Send Request', action: handleSendRequest, icon: <SendIcon className="w-5 h-5"/>, section: 'General' },
             { id: 'new-tab', name: 'New Tab', action: handleNewTab, icon: <PlusIcon className="w-5 h-5"/>, section: 'General' },
             { id: 'close-tab', name: 'Close Current Tab', action: () => activeTabId && handleCloseTab(activeTabId), icon: <TrashIcon className="w-5 h-5"/>, section: 'General' },
             { id: 'clear-history', name: 'Clear History', action: handleClearHistory, icon: <HistoryIcon className="w-5 h-5"/>, section: 'History' },
        ];
        return [...generalCommands.filter(c => c.action && activeTab), ...tabCommands];
    }, [tabs, activeTabId, handleSendRequest, handleNewTab, handleCloseTab, handleClearHistory, setActiveTabId]);


    return (
        <div className="flex h-screen font-sans bg-slate-950 text-slate-300 overflow-hidden">
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} aria-hidden="true"></div>
            )}
            <div className={`fixed top-0 left-0 h-full z-30 transition-transform transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:block hidden`}>
                <div className={`h-full transition-all duration-300 ${isSidebarCollapsed ? 'w-14' : 'w-80'}`}>
                    <HistorySidebar 
                        history={history} 
                        onSelectHistory={handleOpenRequestInTab}
                        onDeleteHistory={handleDeleteHistory}
                        onClearHistory={handleClearHistory}
                        environment={environment}
                        setEnvironment={setEnvironment}
                        onClose={() => setIsSidebarOpen(false)}
                        isCollapsed={isSidebarCollapsed}
                        onToggleCollapse={() => setIsSidebarCollapsed(p => !p)}
                    />
                </div>
            </div>
             {/* Mobile-only sidebar */}
            <div className={`fixed top-0 left-0 h-full z-30 transition-transform transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:hidden`}>
                 <HistorySidebar 
                    history={history} 
                    onSelectHistory={handleOpenRequestInTab}
                    onDeleteHistory={handleDeleteHistory}
                    onClearHistory={handleClearHistory}
                    environment={environment}
                    setEnvironment={setEnvironment}
                    onClose={() => setIsSidebarOpen(false)}
                    isCollapsed={false} // Always expanded on mobile overlay
                    onToggleCollapse={() => {}}
                />
            </div>
            
            <div className="hidden md:flex items-center justify-center bg-slate-900 border-r border-slate-700/50">
                <button 
                    onClick={() => setIsSidebarCollapsed(p => !p)} 
                    className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded-full transition-all"
                    title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    <ChevronDoubleLeftIcon className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : 'rotate-0'}`} />
                </button>
            </div>

            <main className="flex-1 flex flex-col p-4 gap-4 overflow-auto">
                <div className="flex items-start justify-between gap-4">
                     <div className="flex items-start gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="p-2 mt-1.5 text-slate-400 hover:text-white md:hidden" aria-label="Open history sidebar">
                            <MenuIcon className="w-6 h-6"/>
                        </button>
                    </div>
                     <div className="flex items-center h-full">
                        <button 
                            onClick={() => setIsCommandPaletteOpen(true)}
                            className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/50 border border-slate-700 rounded-md px-3 py-1.5 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                            title="Open Command Palette"
                        >
                            <span className="hidden sm:inline">Commands</span>
                            <div className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 text-xs font-semibold text-slate-300 bg-slate-700/80 border border-slate-600 rounded">{isMac ? '⌘' : 'Ctrl'}</kbd>
                                <kbd className="px-1.5 py-0.5 text-xs font-semibold text-slate-300 bg-slate-700/80 border border-slate-600 rounded">K</kbd>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-4 min-h-0">
                    <div className="flex flex-col flex-1 min-h-0 border border-slate-700/50 rounded-lg">
                        <TabsBar 
                            tabs={tabs}
                            activeTabId={activeTabId}
                            onSelectTab={setActiveTabId}
                            onCloseTab={handleCloseTab}
                            onNewTab={handleNewTab}
                            renamingTabId={renamingTabId}
                            setRenamingTabId={setRenamingTabId}
                            onRenameTab={handleRenameTab}
                            onDuplicateTab={handleDuplicateTab}
                            onCloseOtherTabs={handleCloseOtherTabs}
                            onCopyAsCurl={handleCopyAsCurl}
                        />
                         {activeTab ? (
                            <ResizablePanel onResize={setPanelSizes} initialSizes={panelSizes}>
                                <div className="p-px h-full min-w-[300px]"><RequestPanel 
                                    key={activeTab.id}
                                    request={activeTab} 
                                    setRequest={setActiveTab} 
                                    onSend={handleSendRequest} 
                                    loading={activeLoading}
                                    onGenerateCode={() => setIsCodeModalOpen(true)}
                                    onImportCurl={() => setIsCurlModalOpen(true)}
                                    environment={environment}
                                /></div>
                                <div className="p-px h-full min-w-[300px]"><ResponsePanel response={activeResponse} error={activeError} loading={activeLoading} /></div>
                            </ResizablePanel>
                        ) : (
                             <div className="flex-1 flex items-center justify-center text-slate-500">
                                Create a new tab to start.
                            </div>
                        )}
                    </div>
                </div>
            </main>
            {isCodeModalOpen && activeTab && <CodeGenerationModal request={activeTab} environment={environment} onClose={() => setIsCodeModalOpen(false)} />}
            {isCurlModalOpen && <CurlImportModal onClose={() => setIsCurlModalOpen(false)} onImport={handleCurlImport} />}
            {isCommandPaletteOpen && <CommandPalette onClose={() => setIsCommandPaletteOpen(false)} commands={commands} />}
        </div>
    );
}

export default App;
