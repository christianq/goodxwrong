// Resize handles for selected elements

import React from 'react';
import type { ResizeHandle } from '../../types';
import './Elements.css';

interface ResizeHandlesProps {
  onResizeStart: (e: React.PointerEvent, handle: ResizeHandle) => void;
}

const handles: { position: ResizeHandle; cursor: string; style: React.CSSProperties }[] = [
  { position: 'nw', cursor: 'nwse-resize', style: { top: -4, left: -4 } },
  { position: 'n', cursor: 'ns-resize', style: { top: -4, left: '50%', transform: 'translateX(-50%)' } },
  { position: 'ne', cursor: 'nesw-resize', style: { top: -4, right: -4 } },
  { position: 'e', cursor: 'ew-resize', style: { top: '50%', right: -4, transform: 'translateY(-50%)' } },
  { position: 'se', cursor: 'nwse-resize', style: { bottom: -4, right: -4 } },
  { position: 's', cursor: 'ns-resize', style: { bottom: -4, left: '50%', transform: 'translateX(-50%)' } },
  { position: 'sw', cursor: 'nesw-resize', style: { bottom: -4, left: -4 } },
  { position: 'w', cursor: 'ew-resize', style: { top: '50%', left: -4, transform: 'translateY(-50%)' } },
];

export const ResizeHandles: React.FC<ResizeHandlesProps> = ({ onResizeStart }) => {
  return (
    <>
      {handles.map((handle) => (
        <div
          key={handle.position}
          className="resize-handle"
          style={{
            ...handle.style,
            cursor: handle.cursor,
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onResizeStart(e, handle.position);
          }}
          aria-label={`Resize ${handle.position}`}
          role="button"
          tabIndex={-1}
        />
      ))}
    </>
  );
};
