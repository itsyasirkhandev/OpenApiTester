
import React, { useState, useMemo, useEffect } from 'react';
import { ApiRequest, Environment } from '../types';
import { generateCurlCommand } from '../utils/codegen';
import { CheckIcon, ClipboardDocumentIcon, CodeBracketIcon } from './icons';

interface CodeGenerationModalProps {
    request: ApiRequest;
    environment: Environment;
    onClose: () => void;
}

const CodeGenerationModal: React.FC<CodeGenerationModalProps> = ({ request, environment, onClose }) => {
    const [copied, setCopied] = useState(false);
    
    const code = useMemo(() => generateCurlCommand(request, environment), [request, environment]);

    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
        });
    };
    
    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

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
        >
            <div 
                className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-2xl shadow-2xl flex flex-col animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h2 className="text-lg font-semibold flex items-center space-x-2">
                        <CodeBracketIcon className="w-6 h-6" />
                        <span>Generate Code Snippet</span>
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white">&times;</button>
                </div>
                <div className="p-4 relative">
                    <button onClick={handleCopy} className="absolute top-6 right-6 p-2 bg-slate-700 hover:bg-slate-600 rounded-md text-sm flex items-center space-x-2">
                        {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardDocumentIcon className="w-5 h-5" />}
                         <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <pre className="bg-slate-800 p-4 rounded-md overflow-x-auto text-sm text-yellow-300">
                        <code>{code}</code>
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default CodeGenerationModal;