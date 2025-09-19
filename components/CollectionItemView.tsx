import React, { useState } from 'react';
import { CollectionItem, ApiRequest } from '../types';
import { FolderIcon, FolderOpenIcon, DocumentIcon, ChevronRightIcon, ChevronDownIcon, PlusIcon, PencilIcon, TrashIcon } from './icons';
import { METHOD_COLORS } from '../constants';

interface CollectionItemViewProps {
    item: CollectionItem;
    onSelect: (request: Omit<ApiRequest, 'id'>, collectionId: string) => void;
    onUpdate: (id: string, name: string) => void;
    onDelete: (id: string) => void;
    onAddFolder: (parentId: string) => void;
}

const CollectionItemView: React.FC<CollectionItemViewProps> = ({ item, onSelect, onUpdate, onDelete, onAddFolder }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(item.name);

    const handleSelect = () => {
        if (item.type === 'request') {
            onSelect({ ...item.request, name: item.name }, item.id);
        } else {
            setIsExpanded(!isExpanded);
        }
    };
    
    const handleRename = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(item.id, newName);
        setIsRenaming(false);
    };

    const icon = item.type === 'folder'
        ? isExpanded ? <FolderOpenIcon className="w-5 h-5 text-yellow-400" /> : <FolderIcon className="w-5 h-5 text-yellow-400" />
        : <DocumentIcon className={`w-5 h-5 ${METHOD_COLORS[item.request.method]}`} />;
    
    const chevron = item.type === 'folder' && item.children.length > 0
        ? isExpanded ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />
        : <div className="w-3"></div>;

    return (
        <div>
            <div className="flex items-center space-x-1 group rounded-md hover:bg-slate-800 pr-2">
                <button onClick={handleSelect} className="flex-1 flex items-center space-x-1 p-1 text-left">
                    {chevron}
                    {icon}
                    {isRenaming ? (
                        <form onSubmit={handleRename} className="flex-1">
                            <input
                                type="text"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onBlur={handleRename}
                                autoFocus
                                className="bg-slate-700 text-sm p-0.5 rounded w-full"
                            />
                        </form>
                    ) : (
                        <span className="truncate text-sm">{item.name}</span>
                    )}
                </button>
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.type === 'folder' && (
                        <button onClick={() => onAddFolder(item.id)} className="p-1 text-slate-400 hover:text-white" title="New Folder">
                            <PlusIcon className="w-4 h-4" />
                        </button>
                    )}
                    <button onClick={() => setIsRenaming(true)} className="p-1 text-slate-400 hover:text-white" title="Rename">
                        <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(item.id)} className="p-1 text-slate-400 hover:text-red-400" title="Delete">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
            {isExpanded && item.type === 'folder' && (
                <div className="pl-4 border-l border-slate-700 ml-3">
                    {item.children.map(child => (
                        <CollectionItemView 
                            key={child.id} 
                            item={child} 
                            onSelect={onSelect} 
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                            onAddFolder={onAddFolder}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CollectionItemView;