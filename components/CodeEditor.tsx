import React, { useRef, useEffect, useState } from 'react';

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const highlightJSON = (json: string) => {
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return `<span class="token ${cls}">${match}</span>`;
    }).replace(/[{}[\]]/g, (match) => `<span class="token brace">${match}</span>`);
};

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, placeholder }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);
    const [highlighted, setHighlighted] = useState('');
    
    useEffect(() => {
        try {
            setHighlighted(highlightJSON(value));
        } catch {
             setHighlighted(value);
        }
    }, [value]);

    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (preRef.current) {
            preRef.current.scrollTop = e.currentTarget.scrollTop;
            preRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
    };

    return (
        <div className="relative w-full h-full">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full h-full bg-transparent border-0 rounded-md p-2 font-mono text-sm resize-none focus:ring-0 focus:outline-none text-transparent caret-white"
                spellCheck="false"
                onScroll={handleScroll}
                style={{
                    lineHeight: '1.5rem',
                    fontFamily: 'monospace',
                }}
            />
            <pre
                ref={preRef}
                aria-hidden="true"
                className="w-full h-full absolute top-0 left-0 bg-slate-800/50 border border-slate-700 rounded-md p-2 font-mono text-sm overflow-hidden pointer-events-none"
                style={{
                    lineHeight: '1.5rem',
                    fontFamily: 'monospace',
                }}
            >
                <code dangerouslySetInnerHTML={{ __html: highlighted }} />
            </pre>
        </div>
    );
};

export default CodeEditor;
