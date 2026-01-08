// Resize interaction hook

import { useRef, useCallback, useState, useEffect } from 'react';
import { usePageStore } from '../store/pageStore';
import { generateGridCandidates, generateElementCandidates, findBestSnap } from '../engine/snapping';
import type { ResizeHandle, SnapResult, SnapLine } from '../types';

interface ResizeContext {
  elementId: string;
  handle: ResizeHandle;
  startBounds: { x: number; y: number; w: number; h: number };
  startMouseX: number;
  startMouseY: number;
  aspectRatio: number;
  sectionId: string;
  sectionRect: DOMRect | null;
}

interface UseResizeReturn {
  isResizing: boolean;
  resizePreview: { id: string; x: number; y: number; w: number; h: number } | null;
  snapResult: SnapResult | null;
  startResize: (
    e: React.PointerEvent,
    elementId: string,
    handle: ResizeHandle,
    sectionId: string,
    sectionRect: DOMRect
  ) => void;
}

export function useResize(): UseResizeReturn {
  const [isResizing, setIsResizing] = useState(false);
  const [resizePreview, setResizePreview] = useState<{
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [snapResult, setSnapResult] = useState<SnapResult | null>(null);

  const resizeContextRef = useRef<ResizeContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const resizePreviewRef = useRef<{ id: string; x: number; y: number; w: number; h: number } | null>(null);

  const { elements, sections, breakpoint, snapEnabled, updateElementLayout, pushHistory } = usePageStore();

  const updateResizePosition = useCallback(
    (clientX: number, clientY: number, shiftKey: boolean, altKey: boolean) => {
      const ctx = resizeContextRef.current;
      if (!ctx || !ctx.sectionRect) return;

      const dx = clientX - ctx.startMouseX;
      const dy = clientY - ctx.startMouseY;

      let { x, y, w, h } = ctx.startBounds;
      const minSize = 20;

      // Calculate new bounds based on handle
      switch (ctx.handle) {
        case 'e':
          w = Math.max(minSize, ctx.startBounds.w + dx);
          break;
        case 'w':
          w = Math.max(minSize, ctx.startBounds.w - dx);
          x = ctx.startBounds.x + ctx.startBounds.w - w;
          break;
        case 's':
          h = Math.max(minSize, ctx.startBounds.h + dy);
          break;
        case 'n':
          h = Math.max(minSize, ctx.startBounds.h - dy);
          y = ctx.startBounds.y + ctx.startBounds.h - h;
          break;
        case 'se':
          w = Math.max(minSize, ctx.startBounds.w + dx);
          h = Math.max(minSize, ctx.startBounds.h + dy);
          break;
        case 'sw':
          w = Math.max(minSize, ctx.startBounds.w - dx);
          x = ctx.startBounds.x + ctx.startBounds.w - w;
          h = Math.max(minSize, ctx.startBounds.h + dy);
          break;
        case 'ne':
          w = Math.max(minSize, ctx.startBounds.w + dx);
          h = Math.max(minSize, ctx.startBounds.h - dy);
          y = ctx.startBounds.y + ctx.startBounds.h - h;
          break;
        case 'nw':
          w = Math.max(minSize, ctx.startBounds.w - dx);
          x = ctx.startBounds.x + ctx.startBounds.w - w;
          h = Math.max(minSize, ctx.startBounds.h - dy);
          y = ctx.startBounds.y + ctx.startBounds.h - h;
          break;
      }

      // Lock aspect ratio with shift
      if (shiftKey && ctx.aspectRatio > 0) {
        if (['e', 'w'].includes(ctx.handle)) {
          h = w / ctx.aspectRatio;
        } else if (['n', 's'].includes(ctx.handle)) {
          w = h * ctx.aspectRatio;
        } else {
          // Corner handles - use the larger delta
          const newAspect = w / h;
          if (newAspect > ctx.aspectRatio) {
            w = h * ctx.aspectRatio;
          } else {
            h = w / ctx.aspectRatio;
          }
        }
      }

      // Resize from center with alt
      if (altKey) {
        const centerX = ctx.startBounds.x + ctx.startBounds.w / 2;
        const centerY = ctx.startBounds.y + ctx.startBounds.h / 2;
        x = centerX - w / 2;
        y = centerY - h / 2;
      }

      // Compute snapping for edges
      const section = sections.find((s) => s.id === ctx.sectionId);
      if (section && snapEnabled) {
        const sectionWidth = ctx.sectionRect.width;
        const sectionElements = elements.filter((e) => e.sectionId === ctx.sectionId);

        const gridCandidates = generateGridCandidates(section, sectionWidth);
        const elementCandidates = generateElementCandidates(sectionElements, [ctx.elementId], breakpoint);
        const allCandidates = [...gridCandidates, ...elementCandidates];

        // Separate candidates by type
        const verticalCandidates = allCandidates.filter((c) => c.type === 'vertical');
        const horizontalCandidates = allCandidates.filter((c) => c.type === 'horizontal');

        let snappedX = false;
        let snappedY = false;
        const guides: SnapLine[] = [];

        // Snap horizontal edges based on which handle is being dragged
        if (['w', 'nw', 'sw'].includes(ctx.handle)) {
          // Only snap left edge
          const leftSnap = findBestSnap(verticalCandidates, x);
          if (leftSnap.snapped && leftSnap.candidate) {
            const newX = leftSnap.position;
            w = w + (x - newX);
            x = newX;
            snappedX = true;
            guides.push({
              type: 'vertical',
              position: leftSnap.candidate.position,
              label: leftSnap.candidate.label,
              source: leftSnap.candidate.source,
              strength: 1,
            });
          }
        } else if (['e', 'ne', 'se'].includes(ctx.handle)) {
          // Only snap right edge
          const rightEdge = x + w;
          const rightSnap = findBestSnap(verticalCandidates, rightEdge);
          if (rightSnap.snapped && rightSnap.candidate) {
            w = rightSnap.position - x;
            snappedX = true;
            guides.push({
              type: 'vertical',
              position: rightSnap.candidate.position,
              label: rightSnap.candidate.label,
              source: rightSnap.candidate.source,
              strength: 1,
            });
          }
        }

        // Snap vertical edges based on which handle is being dragged
        if (['n', 'nw', 'ne'].includes(ctx.handle)) {
          // Only snap top edge
          const topSnap = findBestSnap(horizontalCandidates, y);
          if (topSnap.snapped && topSnap.candidate) {
            const newY = topSnap.position;
            h = h + (y - newY);
            y = newY;
            snappedY = true;
            guides.push({
              type: 'horizontal',
              position: topSnap.candidate.position,
              label: topSnap.candidate.label,
              source: topSnap.candidate.source,
              strength: 1,
            });
          }
        } else if (['s', 'sw', 'se'].includes(ctx.handle)) {
          // Only snap bottom edge
          const bottomEdge = y + h;
          const bottomSnap = findBestSnap(horizontalCandidates, bottomEdge);
          if (bottomSnap.snapped && bottomSnap.candidate) {
            h = bottomSnap.position - y;
            snappedY = true;
            guides.push({
              type: 'horizontal',
              position: bottomSnap.candidate.position,
              label: bottomSnap.candidate.label,
              source: bottomSnap.candidate.source,
              strength: 1,
            });
          }
        }

        setSnapResult({ x, y, snappedX, snappedY, guides });
      }

      const preview = { id: ctx.elementId, x, y, w: Math.round(w), h: Math.round(h) };
      resizePreviewRef.current = preview;
      setResizePreview(preview);
    },
    [elements, sections, breakpoint, snapEnabled]
  );

  const handlePointerMove = useRef((e: PointerEvent) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      updateResizePosition(e.clientX, e.clientY, e.shiftKey, e.altKey);
    });
  });

  // Update the ref when updateResizePosition changes
  useEffect(() => {
    handlePointerMove.current = (e: PointerEvent) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        updateResizePosition(e.clientX, e.clientY, e.shiftKey, e.altKey);
      });
    };
  }, [updateResizePosition]);

  const handlePointerUp = useRef(() => {
    const ctx = resizeContextRef.current;
    if (!ctx) return;

    // Use the ref (not state) to get the latest preview
    const preview = resizePreviewRef.current;
    if (!preview) return;

    // Commit the final size
    updateElementLayout(preview.id, breakpoint, {
      x: preview.x,
      y: preview.y,
      w: preview.w,
      h: preview.h,
    });

    // Cleanup
    window.removeEventListener('pointermove', handlePointerMove.current);
    window.removeEventListener('pointerup', handlePointerUp.current);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    resizeContextRef.current = null;
    resizePreviewRef.current = null;
    setIsResizing(false);
    setResizePreview(null);
    setSnapResult(null);
  });

  // Update the ref when dependencies change
  useEffect(() => {
    handlePointerUp.current = () => {
      const ctx = resizeContextRef.current;
      if (!ctx) return;

      // Use the ref (not state) to get the latest preview
      const preview = resizePreviewRef.current;
      if (!preview) return;

      // Commit the final size
      updateElementLayout(preview.id, breakpoint, {
        x: preview.x,
        y: preview.y,
        w: preview.w,
        h: preview.h,
      });

      // Cleanup
      window.removeEventListener('pointermove', handlePointerMove.current);
      window.removeEventListener('pointerup', handlePointerUp.current);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      resizeContextRef.current = null;
      resizePreviewRef.current = null;
      setIsResizing(false);
      setResizePreview(null);
      setSnapResult(null);
    };
  }, [breakpoint, updateElementLayout]);

  const startResize = useCallback(
    (
      e: React.PointerEvent,
      elementId: string,
      handle: ResizeHandle,
      sectionId: string,
      sectionRect: DOMRect
    ) => {
      e.preventDefault();
      e.stopPropagation();

      const element = elements.find((el) => el.id === elementId);
      if (!element) return;

      const layout = element.layout[breakpoint];

      resizeContextRef.current = {
        elementId,
        handle,
        startBounds: { x: layout.x, y: layout.y, w: layout.w, h: layout.h },
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        aspectRatio: layout.w / layout.h,
        sectionId,
        sectionRect,
      };

      pushHistory();
      setIsResizing(true);

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
    };
  }, []);

  return {
    isResizing,
    resizePreview,
    snapResult,
    startResize,
  };
}
