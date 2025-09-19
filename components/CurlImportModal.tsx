
import React, { useState, useEffect } from 'react';
import { ApiRequest } from '../types';
import { parseCurlCommand } from '../utils/curlParser';
import { CommandLineIcon } from './icons';

interface CurlImportModalProps {
    onClose: () => void;
    onImport: (request: Partial<ApiRequest>) => void;
}

const CurlImportModal: React.FC<CurlImportModalProps> = ({ onClose, onImport }) => {
    const [curlCommand, setCurlCommand] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleImport = () => {
        setError(null);
        if (!curlCommand.trim()) {
            setError('Please paste a cURL command.');
            return;
        }
        try {
            const parsedRequest = parseCurlCommand(curlCommand);
            onImport(parsedRequest);
        } catch (e: any) {
            setError(e.message || 'Failed to parse cURL command. Please check the format.');
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="curl-import-title"
        >
            <div 
                className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-2xl shadow-2xl flex flex-col animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h2 id="curl-import-title" className="text-lg font-semibold flex items-center space-x-2">
                        <CommandLineIcon className="w-6 h-6" />
                        <span>Import from cURL</span>
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white text-2xl" aria-label="Close">&times;</button>
                </div>
                <div className="p-4 space-y-4">
                    <p className="text-sm text-slate-400">
                        Paste your full cURL command below and we'll do our best to import it.
                    </p>
                    <textarea
                        value={curlCommand}
                        onChange={(e) => setCurlCommand(e.target.value)}
                        placeholder="curl 'https://api.example.com/users' -H 'Authorization: Bearer ...'"
                        className="w-full h-48 bg-slate-800 border border-slate-700 rounded-md p-2 font-mono text-sm resize-y focus:ring-indigo-500 focus:border-indigo-500"
                        aria-label="cURL command input"
                    />
                    {error && (
                        <div className="bg-red-900/50 border border-red-500/50 text-red-300 text-sm rounded-md p-3">
                            {error}
                        </div>
                    )}
                </div>
                 <div className="flex justify-end items-center p-4 border-t border-slate-700/50 bg-slate-900/50 rounded-b-lg space-x-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors"
                    >
                        Import
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CurlImportModal;