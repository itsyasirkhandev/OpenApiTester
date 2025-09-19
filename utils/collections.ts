import { CollectionItem, ApiRequest } from '../types';

export const findItemAndParent = (
    items: CollectionItem[], 
    id: string, 
    parent: CollectionItem | null = null
): { item: CollectionItem | null, parent: CollectionItem | null } => {
    for (const item of items) {
        if (item.id === id) {
            return { item, parent };
        }
        if (item.type === 'folder' && item.children.length > 0) {
            const found = findItemAndParent(item.children, id, item);
            if (found.item) {
                return found;
            }
        }
    }
    return { item: null, parent: null };
};

export const removeItem = (items: CollectionItem[], id: string): CollectionItem[] => {
    return items
        .filter(item => item.id !== id)
        .map(item => {
            if (item.type === 'folder' && item.children) {
                return { ...item, children: removeItem(item.children, id) };
            }
            return item;
        });
};

export const findItemPath = (items: CollectionItem[], id: string, path: string[] = []): string[] | null => {
    for (const item of items) {
        if (item.id === id) {
            return [...path, item.name];
        }
        if (item.type === 'folder') {
            const foundPath = findItemPath(item.children, id, [...path, item.name]);
            if (foundPath) {
                return foundPath;
            }
        }
    }
    return null;
};

export const updateItem = (
    items: CollectionItem[], 
    id: string, 
    updatedRequest: Omit<ApiRequest, 'id' | 'collectionId'>
): CollectionItem[] => {
    return items.map(item => {
        if (item.id === id && item.type === 'request') {
            return { ...item, name: updatedRequest.name || item.name, request: updatedRequest };
        }
        if (item.type === 'folder' && item.children) {
            return { ...item, children: updateItem(item.children, id, updatedRequest) };
        }
        return item;
    });
};