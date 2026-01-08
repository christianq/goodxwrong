// Element wrapper with selection, drag, resize

import React, { useRef, useCallback } from 'react';
import { usePageStore } from '../../store/pageStore';
import { ElementRenderer } from './ElementRenderer';
import { ResizeHandles } from './ResizeHandles';
import type { PageElement, ResizeHandle } from '../../types';
import './Elements.css';

interface ElementProps {
  element: PageElement;
  isSelected: boolean;
  isDragging: boolean;
  dragOffset?: { x: number; y: number };
  isResizing: boolean;
  resizePreview?: { x: number; y: number; w: number; h: number };
  hasCollision: boolean;
  onDragStart: (e: React.PointerEvent, elementIds: string[], sectionId: string, sectionRect: DOMRect) => void;
  onResizeStart: (e: React.PointerEvent, elementId: string, handle: ResizeHandle, sectionId: string, sectionRect: DOMRect) => void;
  sectionRef: React.RefObject<HTMLDivElement | null>;
}

export const Element: React.FC<ElementProps> = ({
  element,
  isSelected,
  isDragging,
  dragOffset,
  isResizing,
  resizePreview,
  hasCollision,
  onDragStart,
  onResizeStart,
  sectionRef,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const { breakpoint, selectElement, selectedElementIds } = usePageStore();

  const layout = element.layout[breakpoint];

  // Calculate display position/size
  let displayX = layout.x;
  let displayY = layout.y;
  let displayW = layout.w;
  let displayH = layout.h;

  if (isDragging && dragOffset) {
    displayX = dragOffset.x;
    displayY = dragOffset.y;
  }

  if (isResizing && resizePreview) {
    displayX = resizePreview.x;
    displayY = resizePreview.y;
    displayW = resizePreview.w;
    displayH = resizePreview.h;
  }

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Don't start drag on resize handles
      if ((e.target as HTMLElement).closest('.resize-handle')) {
        return;
      }

      const sectionRect = sectionRef.current?.getBoundingClientRect();
      if (!sectionRect) return;

      // Handle selection
      if (e.shiftKey) {
        selectElement(element.id, true);
      } else if (!isSelected) {
        selectElement(element.id, false);
      }

      // Start drag with all selected elements (or just this one)
      const dragIds = selectedElementIds.includes(element.id)
        ? selectedElementIds
        : [element.id];

      onDragStart(e, dragIds, element.sectionId, sectionRect);
    },
    [element, isSelected, selectedElementIds, selectElement, onDragStart, sectionRef]
  );

  const handleResizeStart = useCallback(
    (e: React.PointerEvent, handle: ResizeHandle) => {
      const sectionRect = sectionRef.current?.getBoundingClientRect();
      if (!sectionRect) return;

      if (!isSelected) {
        selectElement(element.id, false);
      }

      onResizeStart(e, element.id, handle, element.sectionId, sectionRect);
    },
    [element, isSelected, selectElement, onResizeStart, sectionRef]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
    },
    []
  );

  return (
    <div
      ref={elementRef}
      className={`element-wrapper ${isSelected ? 'element-wrapper--selected' : ''} ${isDragging ? 'element-wrapper--dragging' : ''} ${isResizing ? 'element-wrapper--resizing' : ''} ${hasCollision ? 'element-wrapper--collision' : ''}`}
      style={{
        position: 'absolute',
        left: displayX,
        top: displayY,
        width: displayW,
        height: displayH,
        zIndex: layout.z,
        opacity: isDragging ? 0.8 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      tabIndex={0}
      role="button"
      aria-label={`${element.type} element`}
      aria-selected={isSelected}
    >
      <div className="element-content">
        <ElementRenderer element={element} />
      </div>

      {isSelected && !isDragging && (
        <ResizeHandles onResizeStart={handleResizeStart} />
      )}
    </div>
  );
};
