
import React from 'react';

interface SettingsProps {
    corsProxy: string;
    setCorsProxy: (url: string) => void;
}

const PUBLIC_PROXY_URL = 'https://thingproxy.freeboard.io/fetch/';

const Settings: React.FC<SettingsProps> = ({ corsProxy, setCorsProxy }) => {
    return (
        <div className="bg-slate-900 p-3 rounded-lg border border-slate-700/50">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label htmlFor="cors-proxy" className="text-sm font-medium text-slate-300 sm:w-20 shrink-0">CORS Proxy</label>
                <div className="flex-1 flex items-center gap-2">
                    <input 
                        type="text"
                        id="cors-proxy"
                        placeholder="https://your-proxy.com/"
                        value={corsProxy}
                        onChange={(e) => setCorsProxy(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button 
                        onClick={() => setCorsProxy(PUBLIC_PROXY_URL)}
                        className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded-md whitespace-nowrap"
                        title={`Set proxy to ${PUBLIC_PROXY_URL}`}
                    >
                       Use Public Demo
                    </button>
                </div>
            </div>
             <div className="text-xs text-slate-500 mt-2 sm:pl-[88px]">
                <p><span className="font-bold text-yellow-500">Warning:</span> Public proxies are for development/testing only and can be unreliable. Do not send sensitive data.</p>
            </div>
        </div>
    );
};

export default Settings;