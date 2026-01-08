// Marquee selection hook

import { useRef, useCallback, useState, useEffect } from 'react';
import { usePageStore } from '../store/pageStore';
import { rectsIntersect, normalizeRect } from '../utils/geometry';

interface MarqueeState {
  isActive: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  sectionId: string;
}

interface UseMarqueeReturn {
  marquee: MarqueeState | null;
  startMarquee: (e: React.PointerEvent, sectionId: string, sectionRect: DOMRect) => void;
}

export function useMarquee(): UseMarqueeReturn {
  const [marquee, setMarquee] = useState<MarqueeState | null>(null);
  const sectionRectRef = useRef<DOMRect | null>(null);

  const { elements, breakpoint, selectElements } = usePageStore();

  const updateMarquee = useCallback(
    (clientX: number, clientY: number) => {
      if (!sectionRectRef.current) return;

      const rect = sectionRectRef.current;
      const currentX = clientX - rect.left;
      const currentY = clientY - rect.top;

      setMarquee((prev) => {
        if (!prev) return null;
        return { ...prev, currentX, currentY };
      });
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      requestAnimationFrame(() => {
        updateMarquee(e.clientX, e.clientY);
      });
    },
    [updateMarquee]
  );

  const handlePointerUp = useCallback(() => {
    if (!marquee || !sectionRectRef.current) {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      setMarquee(null);
      return;
    }

    // Calculate selection rect
    const selectionRect = normalizeRect(
      marquee.startX,
      marquee.startY,
      marquee.currentX,
      marquee.currentY
    );

    // Find elements that intersect with the marquee
    const sectionElements = elements.filter((e) => e.sectionId === marquee.sectionId);
    const intersecting: string[] = [];

    for (const element of sectionElements) {
      const layout = element.layout[breakpoint];
      const elementRect = { x: layout.x, y: layout.y, w: layout.w, h: layout.h };

      if (rectsIntersect(selectionRect, elementRect)) {
        intersecting.push(element.id);
      }
    }

    if (intersecting.length > 0) {
      selectElements(intersecting);
    }

    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    setMarquee(null);
    sectionRectRef.current = null;
  }, [marquee, elements, breakpoint, selectElements, handlePointerMove]);

  const startMarquee = useCallback(
    (e: React.PointerEvent, sectionId: string, sectionRect: DOMRect) => {
      e.preventDefault();

      const startX = e.clientX - sectionRect.left;
      const startY = e.clientY - sectionRect.top;

      sectionRectRef.current = sectionRect;

      setMarquee({
        isActive: true,
        startX,
        startY,
        currentX: startX,
        currentY: startY,
        sectionId,
      });

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [handlePointerMove, handlePointerUp]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  return {
    marquee,
    startMarquee,
  };
}
