import React from 'react';
import { useDraggable } from '@dnd-kit/core';

interface DraggableProps {
    id: string;
    children?: React.ReactNode;
}

export function Draggable({ id = 'draggable', children }: DraggableProps) {
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: id,
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={{
                cursor: 'grab',
                userSelect: 'none',
                touchAction: 'none'
            }}
        >
            {children || <div className="p-4 bg-gray-200 rounded border border-gray-300">Drag me</div>}
        </div>
    );
}