import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from './icons';

interface JsonViewerProps {
    data: any;
}

const JsonNode: React.FC<{
    nodeKey: string | number;
    value: any;
    isRoot?: boolean;
}> = ({ nodeKey, value, isRoot = false }) => {
    const [isExpanded, setIsExpanded] = useState(isRoot);

    const renderValue = (val: any) => {
        const type = typeof val;
        if (val === null) return <span className="text-orange-400">null</span>;
        if (type === 'string') return <span className="text-green-300">"{val}"</span>;
        if (type === 'number') return <span className="text-purple-300">{val}</span>;
        if (type === 'boolean') return <span className="text-purple-300">{String(val)}</span>;
        return null;
    };

    const valueNode = renderValue(value);
    if (valueNode !== null) {
        return (
            <div>
                <span className="text-cyan-400 font-semibold">"{nodeKey}"</span>
                <span className="text-slate-400">: </span>
                {valueNode}
            </div>
        );
    }
    
    if (typeof value === 'object' && value !== null) {
        const isArray = Array.isArray(value);
        const entries = Object.entries(value);
        const keyPrefix = isRoot ? '' : `"${nodeKey}": `;
        const summary = isArray ? `[${entries.length}]` : `{${entries.length}}`;

        return (
            <div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center text-left w-full"
                >
                    {isExpanded ? <ChevronDownIcon className="w-3 h-3 mr-1 shrink-0" /> : <ChevronRightIcon className="w-3 h-3 mr-1 shrink-0" />}
                    <span className="text-cyan-400 font-semibold">{keyPrefix}</span>
                    {!isExpanded && <span className="text-slate-500">{summary}</span>}
                </button>
                {isExpanded && (
                    <div className="pl-5 border-l border-slate-700 ml-1">
                        {entries.map(([k, v]) => (
                            <JsonNode key={k} nodeKey={isArray ? Number(k) : k} value={v} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return null;
};

const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
    return (
        <div className="font-mono text-sm p-4">
            <JsonNode nodeKey="root" value={data} isRoot={true} />
        </div>
    );
};

export default JsonViewer;
