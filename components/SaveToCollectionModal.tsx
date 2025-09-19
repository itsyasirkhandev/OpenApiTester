import React, { useState, useEffect } from 'react';
import { CollectionItem } from '../types';
import { RectangleStackIcon, FolderIcon } from './icons';

interface SaveToCollectionModalProps {
    collections: CollectionItem[];
    onSave: (name: string, folderId: string | null) => void;
    onClose: () => void;
    defaultName?: string;
}

const FolderOption: React.FC<{item: CollectionItem, level: number}> = ({item, level}) => (
    <>
        <option value={item.id} style={{paddingLeft: `${level * 1}rem`}}>
           {item.name}
        </option>
        {item.type === 'folder' && item.children.map(child => (
             <FolderOption key={child.id} item={child} level={level + 1} />
        ))}
    </>
);

const SaveToCollectionModal: React.FC<SaveToCollectionModalProps> = ({ collections, onSave, onClose, defaultName = '' }) => {
    const [name, setName] = useState(defaultName);
    const [folderId, setFolderId] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(name, folderId);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);
    
    const folderOptions = collections.filter(item => item.type === 'folder');

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-4 border-b border-slate-700">
                        <h2 className="text-lg font-semibold flex items-center space-x-2">
                            <RectangleStackIcon className="w-6 h-6" />
                            <span>Save Request to Collection</span>
                        </h2>
                    </div>
                    <div className="p-4 space-y-4">
                        <div>
                            <label htmlFor="request-name" className="block text-sm font-medium text-slate-400 mb-1">Request name</label>
                            <input
                                type="text"
                                id="request-name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="collection-folder" className="block text-sm font-medium text-slate-400 mb-1">Save to folder</label>
                            <select
                                id="collection-folder"
                                value={folderId || ''}
                                onChange={e => setFolderId(e.target.value || null)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Root of collection</option>
                                {folderOptions.map(item => <FolderOption key={item.id} item={item} level={0} />)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end p-4 border-t border-slate-700/50 bg-slate-800/50 rounded-b-lg space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SaveToCollectionModal;
