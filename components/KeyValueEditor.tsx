import React from 'react';
import { KeyValue, Environment, VariableType } from '../types';
import { PlusIcon, TrashIcon } from './icons';
import VariableSuggestionInput from './VariableSuggestionInput';

interface KeyValueEditorProps {
    items: KeyValue[];
    setItems: React.Dispatch<React.SetStateAction<KeyValue[]>>;
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    direction?: 'responsive' | 'vertical';
    environment: Environment;
    showTypeSelector?: boolean;
}

const KeyValueEditor: React.FC<KeyValueEditorProps> = ({ items, setItems, keyPlaceholder = "Key", valuePlaceholder = "Value", direction = 'responsive', environment, showTypeSelector = false }) => {

    const handleItemChange = (id: string, field: 'key' | 'value' | 'enabled' | 'type', value: string | boolean | VariableType) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                // If type is changed to boolean, default value to 'true' if it's empty
                if (field === 'type' && value === VariableType.BOOLEAN && item.value === '') {
                    return { ...item, type: value as VariableType, value: 'true' };
                }
                // If type is changed to JSON, try to format existing value
                if (field === 'type' && value === VariableType.JSON) {
                    try {
                        const formatted = JSON.stringify(JSON.parse(item.value), null, 2);
                        return { ...item, type: value as VariableType, value: formatted };
                    } catch {
                         return { ...item, type: value as VariableType, value: item.value.startsWith('{') ? '{\n  \n}' : '[\n  \n]' };
                    }
                }
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const addItem = () => {
        setItems(prev => [...prev, { id: crypto.randomUUID(), key: '', value: '', enabled: true, type: VariableType.AUTO }]);
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const renderValueInput = (item: KeyValue) => {
        const type = item.type || VariableType.AUTO;

        if (showTypeSelector && type === VariableType.BOOLEAN) {
            return (
                 <div className="flex items-center h-full mt-1.5">
                    <button
                        onClick={() => handleItemChange(item.id, 'value', item.value === 'true' ? 'false' : 'true')}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${item.value === 'true' ? 'bg-indigo-600' : 'bg-slate-600'}`}
                    >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${item.value === 'true' ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                    <span className="ml-3 text-sm text-slate-400 font-mono">{item.value}</span>
                </div>
            )
        }

        if (showTypeSelector && type === VariableType.JSON) {
            return (
                <textarea
                    placeholder={valuePlaceholder}
                    value={item.value}
                    onChange={(e) => handleItemChange(item.id, 'value', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500 font-mono h-24 resize-y"
                    aria-label="Variable value"
                />
            )
        }

        return (
            <VariableSuggestionInput
                type="text"
                placeholder={valuePlaceholder}
                value={item.value}
                onChange={(e) => handleItemChange(item.id, 'value', e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                aria-label="Variable value"
                environment={environment}
            />
        );
    };

    const layoutClasses = direction === 'responsive' ? 'flex-col sm:flex-row' : 'flex-col';
    const gridLayout = showTypeSelector ? 'grid grid-cols-[auto,1fr,auto] gap-2 items-start' : 'flex items-start space-x-2';

    return (
        <div className="space-y-3 p-1">
            {items.map((item) => (
                <div key={item.id} className={gridLayout}>
                    <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={(e) => handleItemChange(item.id, 'enabled', e.target.checked)}
                        className="form-checkbox h-4 w-4 rounded bg-slate-700 border-slate-600 text-indigo-500 focus:ring-indigo-500 mt-1.5 shrink-0"
                        aria-label="Enable/disable variable"
                    />
                    <div className={`flex-1 flex ${layoutClasses} gap-2`}>
                        <div className="flex-1 flex flex-col gap-2">
                            <input
                                type="text"
                                placeholder={keyPlaceholder}
                                value={item.key}
                                onChange={(e) => handleItemChange(item.id, 'key', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                aria-label="Variable name"
                            />
                             {showTypeSelector && (
                                <select
                                    value={item.type || VariableType.AUTO}
                                    onChange={(e) => handleItemChange(item.id, 'type', e.target.value as VariableType)}
                                    className="bg-slate-700/50 border border-slate-700 rounded-md text-xs py-1 px-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-300"
                                >
                                    {Object.values(VariableType).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            )}
                        </div>
                       <div className="flex-1">
                          {renderValueInput(item)}
                       </div>
                    </div>
                    <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors mt-0.5"
                        aria-label={`Delete variable ${item.key || 'row'}`}
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            ))}
            <button
                onClick={addItem}
                className="flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 transition-colors text-sm font-medium pt-1"
            >
                <PlusIcon className="w-4 h-4" />
                <span>Add</span>
            </button>
        </div>
    );
};

export default KeyValueEditor;