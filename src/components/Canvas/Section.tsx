// Section component - container for elements with grid background

import React, { useRef, useCallback, useMemo } from 'react';
import { usePageStore } from '../../store/pageStore';
import { Element } from '../Elements';
import { SmartGuides } from '../SmartGuides';
import { DragHud } from '../Hud';
import { useDrag, useResize, useMarquee } from '../../hooks';
import type { Section as SectionType, PageElement, ResizeHandle } from '../../types';
import { normalizeRect } from '../../utils/geometry';
import './Canvas.css';

interface SectionProps {
  section: SectionType;
  elements: PageElement[];
  isActive: boolean;
  canvasWidth: number;
}

export const Section: React.FC<SectionProps> = ({
  section,
  elements,
  isActive,
  canvasWidth,
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const {
    selectedElementIds,
    selectedSectionId,
    breakpoint,
    selectSection,
    clearSelection,
    addElement,
  } = usePageStore();

  const {
    isDragging,
    dragPreview,
    snapResult: dragSnapResult,
    spacingIndicators,
    collisionHints,
    alignmentBadge,
    cursorPosition: dragCursor,
    startDrag,
  } = useDrag();

  const {
    isResizing,
    resizePreview,
    snapResult: resizeSnapResult,
    startResize,
  } = useResize();

  const { marquee, startMarquee } = useMarquee();

  // Generate equidistant grid points using actual rendered section width
  const gridPoints = useMemo(() => {
    if (!section.grid.visible) return [];

    // Use actual rendered width to match snapping calculations
    const rect = sectionRef.current?.getBoundingClientRect();
    const actualWidth = rect?.width ?? canvasWidth;

    const { columns, gap, rowHeight } = section.grid;
    const columnWidth = (actualWidth - gap * (columns + 1)) / columns;
    const points: { x: number; y: number }[] = [];

    // Calculate number of rows based on section height
    const rows = Math.ceil(section.height / (rowHeight + gap));

    // Generate equidistant grid intersection points only
    // These are at column edges and row edges (no centers)
    for (let col = 0; col <= columns; col++) {
      const x = gap + col * (columnWidth + gap);
      for (let row = 0; row <= rows; row++) {
        const y = gap + row * (rowHeight + gap);
        if (y <= section.height) {
          points.push({ x, y });
        }
      }
    }

    return points;
  }, [section.grid, section.height, canvasWidth]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only handle clicks on the section background itself
      if (e.target !== e.currentTarget) return;

      const rect = sectionRef.current?.getBoundingClientRect();
      if (!rect) return;

      if (e.shiftKey) {
        // Start marquee selection
        startMarquee(e, section.id, rect);
      } else {
        // Clear selection and select section
        clearSelection();
        selectSection(section.id);
      }
    },
    [section.id, startMarquee, clearSelection, selectSection]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      // Add text element on double click
      if (e.target !== e.currentTarget) return;

      const rect = sectionRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      addElement(section.id, 'text', { x, y });
    },
    [section.id, addElement]
  );

  const handleDragStart = useCallback(
    (e: React.PointerEvent, elementIds: string[], sectionId: string, sectionRect: DOMRect) => {
      startDrag(e, elementIds, sectionId, sectionRect);
    },
    [startDrag]
  );

  const handleResizeStart = useCallback(
    (e: React.PointerEvent, elementId: string, handle: ResizeHandle, sectionId: string, sectionRect: DOMRect) => {
      startResize(e, elementId, handle, sectionId, sectionRect);
    },
    [startResize]
  );

  // Get drag preview for each element
  const getDragOffset = (elementId: string) => {
    const preview = dragPreview.find((p) => p.id === elementId);
    return preview ? { x: preview.x, y: preview.y } : undefined;
  };

  // Check if element has collision
  const hasCollision = (elementId: string) => {
    return collisionHints.some((c) => c.elementId === elementId);
  };

  // Calculate marquee rect
  const marqueeRect = useMemo(() => {
    if (!marquee || marquee.sectionId !== section.id) return null;
    return normalizeRect(
      marquee.startX,
      marquee.startY,
      marquee.currentX,
      marquee.currentY
    );
  }, [marquee, section.id]);

  // Get primary drag element for HUD
  const primaryDragElement = isDragging && dragPreview.length > 0
    ? elements.find((e) => e.id === dragPreview[0].id)
    : null;

  const primaryDragLayout = primaryDragElement?.layout[breakpoint];

  return (
    <div
      ref={sectionRef}
      className={`section ${isActive ? 'section--active' : ''} ${selectedSectionId === section.id ? 'section--selected' : ''}`}
      style={{
        height: section.height,
        background: section.background.type === 'color'
          ? section.background.value
          : `url(${section.background.value}) center/cover`,
      }}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      data-section-id={section.id}
    >
      {/* Section label */}
      <div className="section-label">{section.name}</div>

      {/* Grid points overlay */}
      {section.grid.visible && (
        <div className="grid-overlay" style={{ pointerEvents: 'none' }}>
          {gridPoints.map((point, idx) => (
            <div
              key={idx}
              className="grid-point"
              style={{
                position: 'absolute',
                left: point.x,
                top: point.y,
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: 'rgba(148, 163, 184, 0.35)',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>
      )}

      {/* Elements */}
      {elements.map((element) => {
        const elemIsSelected = selectedElementIds.includes(element.id);
        const elemIsDragging = isDragging && selectedElementIds.includes(element.id);
        const elemIsResizing = isResizing && resizePreview?.id === element.id;

        return (
          <Element
            key={element.id}
            element={element}
            isSelected={elemIsSelected}
            isDragging={elemIsDragging}
            dragOffset={getDragOffset(element.id)}
            isResizing={elemIsResizing}
            resizePreview={elemIsResizing ? resizePreview : undefined}
            hasCollision={hasCollision(element.id)}
            onDragStart={handleDragStart}
            onResizeStart={handleResizeStart}
            sectionRef={sectionRef}
          />
        );
      })}

      {/* Ghost preview for original positions during drag */}
      {isDragging && dragPreview.map((preview) => {
        const element = elements.find((e) => e.id === preview.id);
        if (!element) return null;
        const layout = element.layout[breakpoint];
        return (
          <div
            key={`ghost-${preview.id}`}
            className="element-ghost"
            style={{
              left: layout.x,
              top: layout.y,
              width: layout.w,
              height: layout.h,
            }}
          />
        );
      })}

      {/* Smart guides */}
      {(isDragging || isResizing) && (
        <SmartGuides
          guides={(isDragging ? dragSnapResult : resizeSnapResult)?.guides ?? []}
          spacingIndicators={isDragging ? spacingIndicators : []}
          collisionHints={isDragging ? collisionHints : []}
          alignmentBadge={alignmentBadge}
          sectionHeight={section.height}
          sectionWidth={canvasWidth}
        />
      )}

      {/* Marquee selection */}
      {marqueeRect && (
        <div
          className="marquee-selection"
          style={{
            left: marqueeRect.x,
            top: marqueeRect.y,
            width: marqueeRect.w,
            height: marqueeRect.h,
          }}
        />
      )}

      {/* Drag HUD */}
      {isDragging && dragCursor && primaryDragLayout && (
        <DragHud
          x={dragPreview[0]?.x ?? 0}
          y={dragPreview[0]?.y ?? 0}
          w={primaryDragLayout.w}
          h={primaryDragLayout.h}
          cursorX={dragCursor.x}
          cursorY={dragCursor.y}
          visible
        />
      )}

      {/* Resize HUD */}
      {isResizing && resizePreview && dragCursor && (
        <DragHud
          x={resizePreview.x}
          y={resizePreview.y}
          w={resizePreview.w}
          h={resizePreview.h}
          cursorX={dragCursor?.x ?? resizePreview.x + resizePreview.w}
          cursorY={dragCursor?.y ?? resizePreview.y + resizePreview.h}
          visible
        />
      )}
    </div>
  );
};
