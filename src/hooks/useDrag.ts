// Drag interaction hook with RAF optimization

import { useRef, useCallback, useState, useEffect } from 'react';
import { usePageStore } from '../store/pageStore';
import { computeSnap, computeSpacingIndicators, detectCollisions } from '../engine/snapping';
import type { SnapResult, SpacingIndicator, CollisionHint, AlignmentBadge } from '../types';

interface DragContext {
  elementIds: string[];
  startPositions: Map<string, { x: number; y: number }>;
  startMouseX: number;
  startMouseY: number;
  sectionId: string;
  sectionRect: DOMRect | null;
}

interface UseDragReturn {
  isDragging: boolean;
  dragPreview: { id: string; x: number; y: number }[];
  snapResult: SnapResult | null;
  spacingIndicators: SpacingIndicator[];
  collisionHints: CollisionHint[];
  alignmentBadge: AlignmentBadge | null;
  cursorPosition: { x: number; y: number } | null;
  startDrag: (
    e: React.PointerEvent,
    elementIds: string[],
    sectionId: string,
    sectionRect: DOMRect
  ) => void;
}

export function useDrag(): UseDragReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPreview, setDragPreview] = useState<{ id: string; x: number; y: number }[]>([]);
  const [snapResult, setSnapResult] = useState<SnapResult | null>(null);
  const [spacingIndicators, setSpacingIndicators] = useState<SpacingIndicator[]>([]);
  const [collisionHints, setCollisionHints] = useState<CollisionHint[]>([]);
  const [alignmentBadge, setAlignmentBadge] = useState<AlignmentBadge | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);

  const dragContextRef = useRef<DragContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const alignmentTimeoutRef = useRef<number | null>(null);
  const dragPreviewRef = useRef<{ id: string; x: number; y: number }[]>([]);

  const { elements, sections, breakpoint, snapEnabled, updateElementLayout, pushHistory } = usePageStore();

  const updateDragPosition = useCallback(
    (clientX: number, clientY: number) => {
      const ctx = dragContextRef.current;
      if (!ctx || !ctx.sectionRect) return;

      const dx = clientX - ctx.startMouseX;
      const dy = clientY - ctx.startMouseY;

      // Get the primary element for snapping
      const primaryId = ctx.elementIds[0];
      const primaryStart = ctx.startPositions.get(primaryId);
      const primaryElement = elements.find((e) => e.id === primaryId);

      if (!primaryStart || !primaryElement) return;

      const section = sections.find((s) => s.id === ctx.sectionId);
      if (!section) return;

      // Calculate new position
      const newX = primaryStart.x + dx;
      const newY = primaryStart.y + dy;
      const layout = primaryElement.layout[breakpoint];

      // Compute snapping
      const sectionWidth = ctx.sectionRect.width;
      const sectionElements = elements.filter((e) => e.sectionId === ctx.sectionId);

      const snap = computeSnap(
        { x: newX, y: newY, w: layout.w, h: layout.h },
        section,
        sectionWidth,
        sectionElements,
        ctx.elementIds,
        breakpoint,
        snapEnabled
      );

      // Calculate final positions for all dragged elements
      const snapDx = snap.x - newX;
      const snapDy = snap.y - newY;

      const previews = ctx.elementIds.map((id) => {
        const start = ctx.startPositions.get(id)!;
        return {
          id,
          x: start.x + dx + snapDx,
          y: start.y + dy + snapDy,
        };
      });

      // Compute spacing indicators
      const primaryRect = { x: snap.x, y: snap.y, w: layout.w, h: layout.h };
      const spacing = computeSpacingIndicators(primaryRect, sectionElements, ctx.elementIds, breakpoint);

      // Compute collision hints
      const collisions = detectCollisions(primaryRect, sectionElements, ctx.elementIds, breakpoint);

      // Update cursor position relative to section
      const cursorX = clientX - ctx.sectionRect.left;
      const cursorY = clientY - ctx.sectionRect.top;

      dragPreviewRef.current = previews;
      setDragPreview(previews);
      setSnapResult(snap);
      setSpacingIndicators(spacing);
      setCollisionHints(collisions);
      setCursorPosition({ x: cursorX, y: cursorY });

      // Show alignment badge briefly
      if (snap.alignmentLabel) {
        if (alignmentTimeoutRef.current) {
          clearTimeout(alignmentTimeoutRef.current);
        }
        setAlignmentBadge({
          type: snap.alignmentLabel as AlignmentBadge['type'],
          x: cursorX,
          y: cursorY - 30,
          expiresAt: Date.now() + 500,
        });
        alignmentTimeoutRef.current = window.setTimeout(() => {
          setAlignmentBadge(null);
        }, 500);
      }
    },
    [elements, sections, breakpoint, snapEnabled]
  );

  const handlePointerMove = useRef((e: PointerEvent) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      updateDragPosition(e.clientX, e.clientY);
    });
  });

  // Update the ref when updateDragPosition changes
  useEffect(() => {
    handlePointerMove.current = (e: PointerEvent) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        updateDragPosition(e.clientX, e.clientY);
      });
    };
  }, [updateDragPosition]);

  const handlePointerUp = useRef(() => {
    const ctx = dragContextRef.current;
    if (!ctx) return;

    // Commit the final positions using the ref (not state)
    const previews = dragPreviewRef.current;
    for (const preview of previews) {
      updateElementLayout(preview.id, breakpoint, { x: preview.x, y: preview.y });
    }

    // Cleanup
    window.removeEventListener('pointermove', handlePointerMove.current);
    window.removeEventListener('pointerup', handlePointerUp.current);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    dragContextRef.current = null;
    dragPreviewRef.current = [];
    setIsDragging(false);
    setDragPreview([]);
    setSnapResult(null);
    setSpacingIndicators([]);
    setCollisionHints([]);
    setCursorPosition(null);
    setAlignmentBadge(null);
  });

  // Update the ref when dependencies change
  useEffect(() => {
    handlePointerUp.current = () => {
      const ctx = dragContextRef.current;
      if (!ctx) return;

      // Commit the final positions using the ref (not state)
      const previews = dragPreviewRef.current;
      for (const preview of previews) {
        updateElementLayout(preview.id, breakpoint, { x: preview.x, y: preview.y });
      }

      // Cleanup
      window.removeEventListener('pointermove', handlePointerMove.current);
      window.removeEventListener('pointerup', handlePointerUp.current);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      dragContextRef.current = null;
      dragPreviewRef.current = [];
      setIsDragging(false);
      setDragPreview([]);
      setSnapResult(null);
      setSpacingIndicators([]);
      setCollisionHints([]);
      setCursorPosition(null);
      setAlignmentBadge(null);
    };
  }, [breakpoint, updateElementLayout]);

  const startDrag = useCallback(
    (
      e: React.PointerEvent,
      elementIds: string[],
      sectionId: string,
      sectionRect: DOMRect
    ) => {
      e.preventDefault();
      e.stopPropagation();

      // Save initial positions
      const startPositions = new Map<string, { x: number; y: number }>();
      for (const id of elementIds) {
        const element = elements.find((el) => el.id === id);
        if (element) {
          const layout = element.layout[breakpoint];
          startPositions.set(id, { x: layout.x, y: layout.y });
        }
      }

      dragContextRef.current = {
        elementIds,
        startPositions,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        sectionId,
        sectionRect,
      };

      pushHistory();
      setIsDragging(true);

      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      window.addEventListener('pointermove', handlePointerMove.current);
      window.addEventListener('pointerup', handlePointerUp.current);
    },
    [elements, breakpoint, pushHistory]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handlePointerMove.current);
      window.removeEventListener('pointerup', handlePointerUp.current);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (alignmentTimeoutRef.current) {
        clearTimeout(alignmentTimeoutRef.current);
      }
    };
  }, []);

  return {
    isDragging,
    dragPreview,
    snapResult,
    spacingIndicators,
    collisionHints,
    alignmentBadge,
    cursorPosition,
    startDrag,
  };
}
