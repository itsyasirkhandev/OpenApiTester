import React, { useState } from 'react';
import { KeyValue } from '../types';
import KeyValueEditor from './KeyValueEditor';
import { castVariable } from '../utils/variables';

interface EnvironmentEditorProps {
    environment: KeyValue[];
    setEnvironment: React.Dispatch<React.SetStateAction<KeyValue[]>>;
}

const EnvironmentEditor: React.FC<EnvironmentEditorProps> = ({ environment, setEnvironment }) => {
    const [showPreview, setShowPreview] = useState(false);

    const getPreviewValue = (item: KeyValue) => {
        if (!item.enabled) return <span className="text-slate-500 italic">disabled</span>;
        const casted = castVariable(item);
        if (typeof casted === 'boolean') {
            return <code className="text-purple-400">{String(casted)}</code>;
        }
        if (typeof casted === 'number') {
            return <code className="text-green-400">{String(casted)}</code>;
        }
        if (typeof casted === 'object' && casted !== null) {
            return <code className="text-yellow-300 truncate">{JSON.stringify(casted)}</code>
        }
        return <code className="text-slate-300">"{String(casted)}"</code>
    }

    return (
        <div>
            <div className="flex justify-between items-center px-1 pb-2">
                 <p className="text-xs text-slate-500">
                    Use <code className="bg-slate-700 text-slate-300 px-1 rounded-sm">{"{{variable}}"}</code> to reference variables.
                </p>
                <div className="flex items-center space-x-2">
                    <label htmlFor="preview-toggle" className="text-xs text-slate-400">Preview</label>
                    <button
                        id="preview-toggle"
                        onClick={() => setShowPreview(!showPreview)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showPreview ? 'bg-indigo-600' : 'bg-slate-600'}`}
                        aria-pressed={showPreview}
                    >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${showPreview ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>
            
            {showPreview ? (
                 <div className="space-y-2 p-1 font-mono text-xs">
                     {environment.map(item => (
                         <div key={item.id} className="grid grid-cols-[1fr,2fr] items-center gap-2">
                             <span className={`truncate font-semibold ${item.enabled ? 'text-indigo-400' : 'text-slate-600 line-through'}`}>{item.key}</span>
                             <div className="truncate">{getPreviewValue(item)}</div>
                         </div>
                     ))}
                 </div>
            ) : (
                <KeyValueEditor
                    items={environment}
                    setItems={setEnvironment}
                    keyPlaceholder="Variable Name"
                    valuePlaceholder="Variable Value"
                    direction="vertical"
                    environment={environment}
                    showTypeSelector={true}
                />
            )}
        </div>
    );
};

export default EnvironmentEditor;