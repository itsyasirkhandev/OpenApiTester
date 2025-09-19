
import React, { useState, useEffect, useRef } from 'react';
import { QueueListIcon } from './icons';

export interface Command {
    id: string;
    name: string;
    action: () => void;
    icon: React.ReactNode;
    section: string;
}

interface CommandPaletteProps {
    onClose: () => void;
    commands: Command[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose, commands }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const filteredCommands = React.useMemo(() => {
        if (!searchTerm) return commands;
        return commands.filter(command =>
            command.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, commands]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [filteredCommands]);
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCommands[selectedIndex]) {
                filteredCommands[selectedIndex].action();
                onClose();
            }
        }
    }
    
    const commandGroups = React.useMemo(() => {
        return filteredCommands.reduce((acc, command) => {
            (acc[command.section] = acc[command.section] || []).push(command);
            return acc;
        }, {} as Record<string, Command[]>);
    }, [filteredCommands]);

    return (
        <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
            onClick={onClose}
        >
            <div 
                className="bg-slate-900 w-full max-w-2xl rounded-lg border border-slate-700 shadow-2xl overflow-hidden animate-fade-in"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <QueueListIcon className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Type a command or search..."
                        className="w-full bg-transparent text-lg pl-11 pr-4 py-3 border-b border-slate-700/50 focus:outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                    {Object.entries(commandGroups).length > 0 ? (
                        Object.entries(commandGroups).map(([section, cmds]) => (
                            <div key={section} className="p-2">
                                <h3 className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{section}</h3>
                                <ul>
                                    {cmds.map((command, index) => {
                                        const globalIndex = filteredCommands.findIndex(c => c.id === command.id);
                                        return (
                                        <li key={command.id}>
                                            <button 
                                                onClick={() => { command.action(); onClose(); }}
                                                className={`w-full text-left flex items-center space-x-3 p-2 my-0.5 rounded-md text-slate-300 ${selectedIndex === globalIndex ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
                                            >
                                                <div className={`${selectedIndex === globalIndex ? 'text-white' : 'text-slate-400'}`}>{command.icon}</div>
                                                <span>{command.name}</span>
                                            </button>
                                        </li>
                                    )})}
                                </ul>
                            </div>
                        ))
                    ) : (
                         <p className="p-4 text-center text-slate-500">No results found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
