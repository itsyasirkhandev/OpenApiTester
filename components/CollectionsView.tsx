import React, { useState } from 'react';
import { CollectionItem, ApiRequest } from '../types';
import { PlusIcon, FolderIcon } from './icons';
import CollectionItemView from './CollectionItemView';
import { findItemAndParent, removeItem } from '../utils/collections';

interface CollectionsViewProps {
    collections: CollectionItem[];
    setCollections: React.Dispatch<React.SetStateAction<CollectionItem[]>>;
    onSelect: (request: Omit<ApiRequest, 'id'>, collectionId: string) => void;
}

const CollectionsView: React.FC<CollectionsViewProps> = ({ collections, setCollections, onSelect }) => {

    const handleAddItem = (type: 'request' | 'folder', parentId: string | null = null) => {
        if (type === 'folder') {
            const name = prompt("Enter folder name:");
            if (name) {
                const newFolder: CollectionItem = {
                    id: crypto.randomUUID(),
                    name,
                    parentId,
                    type: 'folder',
                    children: []
                };

                if (parentId) {
                     setCollections(prev => {
                        const newCollections = JSON.parse(JSON.stringify(prev));
                        const { parent } = findItemAndParent(newCollections, parentId);
                        if (parent && parent.type === 'folder') {
                            parent.children.push(newFolder);
                        }
                        return newCollections;
                    });
                } else {
                    setCollections(prev => [...prev, newFolder]);
                }
            }
        }
    };

    const handleUpdateItem = (id: string, name: string) => {
        setCollections(prev => {
            const newCollections = JSON.parse(JSON.stringify(prev));
            const { item } = findItemAndParent(newCollections, id);
            if(item) {
                item.name = name;
            }
            return newCollections;
        });
    };

    const handleDeleteItem = (id: string) => {
        if (confirm('Are you sure you want to delete this item? This cannot be undone.')) {
            setCollections(prev => removeItem(prev, id));
        }
    }

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-3 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-base font-semibold">Collections</h2>
                <div className="flex items-center">
                    <button onClick={() => handleAddItem('folder')} className="p-1 text-slate-400 hover:text-white" title="New Folder">
                        <FolderIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-1">
                 {collections.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center p-4">Your collections will appear here. Save a request to get started.</p>
                ) : (
                    collections.map(item => (
                        <CollectionItemView 
                            key={item.id} 
                            item={item} 
                            onSelect={onSelect} 
                            onUpdate={handleUpdateItem}
                            onDelete={handleDeleteItem}
                            onAddFolder={(parentId) => handleAddItem('folder', parentId)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default CollectionsView;