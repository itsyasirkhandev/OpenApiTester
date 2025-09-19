import React, { useState, useRef, useEffect } from 'react';
import { Environment } from '../types';

// Fix: Correctly type props for a polymorphic component that can be either an input or a textarea.
// A discriminated union is used to support props for both elements without type conflicts.
// Base props that are common and handled by this component are defined separately.
type VariableSuggestionInputBaseProps = {
    environment: Environment;
    as?: 'input' | 'textarea';
    value?: string | readonly string[] | number;
    onChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onInput?: (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
};

type VariableSuggestionInputProps = VariableSuggestionInputBaseProps & (
    (Omit<React.ComponentPropsWithoutRef<'input'>, keyof VariableSuggestionInputBaseProps> & { as?: 'input' }) |
    (Omit<React.ComponentPropsWithoutRef<'textarea'>, keyof VariableSuggestionInputBaseProps> & { as: 'textarea' })
);

const VariableSuggestionInput: React.FC<VariableSuggestionInputProps> = ({ environment, value, onChange, onInput, as = 'input', ...rest }) => {
    const [isFocused, setIsFocused] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    const enabledVariables = environment.filter(v => v.enabled && v.key);

    const handleFocus = () => {
        setIsFocused(true);
    };
    
    // De-focus when clicking outside the component
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    
    const handleSuggestionClick = (variableKey: string) => {
        if (!inputRef.current || !onChange) return;

        const input = inputRef.current;
        const start = input.selectionStart ?? 0;
        const end = input.selectionEnd ?? 0;
        const variableText = `{{${variableKey}}}`;
        
        const currentValue = value?.toString() || '';
        const newValue = currentValue.substring(0, start) + variableText + currentValue.substring(end);
        
        // Create a synthetic event that matches what the onChange handler expects
        const event = {
            target: { ...input, value: newValue },
            currentTarget: { ...input, value: newValue },
        } as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;
        
        onChange(event);
        
        setTimeout(() => {
            input.focus();
            const newCursorPos = start + variableText.length;
            input.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);

        setIsFocused(false);
    };
    
    const Component = as;

    return (
        <div className="relative" ref={wrapperRef}>
            <Component
                ref={inputRef as any}
                value={value}
                onChange={onChange}
                onInput={onInput}
                onFocus={handleFocus}
                {...rest as any}
            />
            {isFocused && enabledVariables.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto animate-fade-in">
                    <ul className="p-1">
                        {enabledVariables.map(variable => (
                            <li key={variable.id}>
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()} // prevent blur from firing before click
                                    onClick={() => handleSuggestionClick(variable.key)}
                                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-700 rounded-md flex justify-between items-center"
                                >
                                    <span className="font-mono text-indigo-400">{variable.key}</span>
                                    <span className="text-slate-400 truncate max-w-[50%]">{variable.value}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default VariableSuggestionInput;