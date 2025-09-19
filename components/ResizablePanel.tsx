import React, { useState, useRef, useCallback, useEffect, ReactNode } from 'react';

interface ResizablePanelProps {
    children: [ReactNode, ReactNode];
    initialSizes?: number[];
    onResize?: (sizes: number[]) => void;
}

const ResizablePanel: React.FC<ResizablePanelProps> = ({ children, initialSizes = [50, 50], onResize }) => {
    const [sizes, setSizes] = useState(initialSizes);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback(() => {
        setIsDragging(true);
    }, []);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);
    
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !containerRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const totalWidth = containerRect.width;

        // Calculate the position of the divider
        const position = e.clientX - containerRect.left;

        // Calculate the percentage for the left panel
        let leftPercentage = (position / totalWidth) * 100;

        // Clamp values to prevent panels from becoming too small (e.g., 10%)
        const minSize = 10;
        leftPercentage = Math.max(minSize, Math.min(leftPercentage, 100 - minSize));
        
        const rightPercentage = 100 - leftPercentage;

        const newSizes = [leftPercentage, rightPercentage];
        setSizes(newSizes);
        if (onResize) {
            onResize(newSizes);
        }

    }, [isDragging, onResize]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('mouseleave', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mouseleave', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);
    
    // Ensure initialSizes from props are reflected if they change
    useEffect(() => {
        setSizes(initialSizes);
    }, [initialSizes]);

    return (
        <div ref={containerRef} className="flex flex-row w-full h-full">
            <div style={{ flexBasis: `${sizes[0]}%` }} className="overflow-hidden">
                {children[0]}
            </div>
            <div 
                onMouseDown={handleMouseDown}
                className={`resize-handle ${isDragging ? 'dragging' : ''}`}
                role="separator"
                aria-orientation="vertical"
                aria-valuenow={sizes[0]}
            />
            <div style={{ flexBasis: `${sizes[1]}%` }} className="overflow-hidden">
                 {children[1]}
            </div>
        </div>
    );
};

export default ResizablePanel;