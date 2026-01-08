// Snapping engine - computes snap candidates and returns best matches

import type { PageElement, Section, SnapLine, SnapResult, SpacingIndicator, Breakpoint } from '../types';
import { getRectEdges, type Rect } from '../utils/geometry';

const SNAP_THRESHOLD = 8; // pixels
const ELEMENT_PRIORITY_BOOST = 2; // boost priority for element-to-element snapping

export interface SnapCandidate {
  type: 'vertical' | 'horizontal';
  position: number;
  label?: string;
  source: 'grid' | 'element' | 'section';
  priority: number;
}

export function generateGridCandidates(
  section: Section,
  sectionWidth: number
): SnapCandidate[] {
  const candidates: SnapCandidate[] = [];
  const { columns, rowHeight, gap } = section.grid;

  if (section.grid.snapStrength === 'off') {
    return candidates;
  }

  const priority = section.grid.snapStrength === 'strong' ? 1 : 0.5;

  // Column lines
  const columnWidth = (sectionWidth - gap * (columns + 1)) / columns;
  for (let i = 0; i <= columns; i++) {
    const x = gap + i * (columnWidth + gap);
    candidates.push({
      type: 'vertical',
      position: x,
      source: 'grid',
      priority,
    });
    // Also snap to column centers
    if (i < columns) {
      candidates.push({
        type: 'vertical',
        position: x + columnWidth / 2,
        label: 'Center',
        source: 'grid',
        priority: priority * 0.8,
      });
    }
  }

  // Row lines
  const rows = Math.ceil(section.height / (rowHeight + gap));
  for (let i = 0; i <= rows; i++) {
    const y = gap + i * (rowHeight + gap);
    if (y <= section.height) {
      candidates.push({
        type: 'horizontal',
        position: y,
        source: 'grid',
        priority,
      });
    }
  }

  // Section center lines
  candidates.push({
    type: 'vertical',
    position: sectionWidth / 2,
    label: 'Section Center',
    source: 'section',
    priority: 1.5,
  });

  candidates.push({
    type: 'horizontal',
    position: section.height / 2,
    label: 'Section Center',
    source: 'section',
    priority: 1.5,
  });

  return candidates;
}

export function generateElementCandidates(
  elements: PageElement[],
  excludeIds: string[],
  breakpoint: Breakpoint
): SnapCandidate[] {
  const candidates: SnapCandidate[] = [];

  for (const element of elements) {
    if (excludeIds.includes(element.id)) continue;

    const layout = element.layout[breakpoint];
    const edges = getRectEdges({ x: layout.x, y: layout.y, w: layout.w, h: layout.h });

    // Vertical lines (left, center, right)
    candidates.push({
      type: 'vertical',
      position: edges.left,
      label: 'Left edge',
      source: 'element',
      priority: ELEMENT_PRIORITY_BOOST,
    });
    candidates.push({
      type: 'vertical',
      position: edges.centerX,
      label: 'Center',
      source: 'element',
      priority: ELEMENT_PRIORITY_BOOST,
    });
    candidates.push({
      type: 'vertical',
      position: edges.right,
      label: 'Right edge',
      source: 'element',
      priority: ELEMENT_PRIORITY_BOOST,
    });

    // Horizontal lines (top, middle, bottom)
    candidates.push({
      type: 'horizontal',
      position: edges.top,
      label: 'Top edge',
      source: 'element',
      priority: ELEMENT_PRIORITY_BOOST,
    });
    candidates.push({
      type: 'horizontal',
      position: edges.centerY,
      label: 'Middle',
      source: 'element',
      priority: ELEMENT_PRIORITY_BOOST,
    });
    candidates.push({
      type: 'horizontal',
      position: edges.bottom,
      label: 'Bottom edge',
      source: 'element',
      priority: ELEMENT_PRIORITY_BOOST,
    });
  }

  return candidates;
}

export function findBestSnap(
  candidates: SnapCandidate[],
  value: number,
  threshold: number = SNAP_THRESHOLD
): { snapped: boolean; position: number; candidate?: SnapCandidate } {
  let bestCandidate: SnapCandidate | undefined;
  let bestDistance = Infinity;
  let bestPriority = 0;

  for (const candidate of candidates) {
    const distance = Math.abs(candidate.position - value);
    if (distance <= threshold) {
      // Prefer higher priority, then closer distance
      if (
        candidate.priority > bestPriority ||
        (candidate.priority === bestPriority && distance < bestDistance)
      ) {
        bestCandidate = candidate;
        bestDistance = distance;
        bestPriority = candidate.priority;
      }
    }
  }

  return {
    snapped: bestCandidate !== undefined,
    position: bestCandidate?.position ?? value,
    candidate: bestCandidate,
  };
}

export function computeSnap(
  dragRect: Rect,
  section: Section,
  sectionWidth: number,
  elements: PageElement[],
  excludeIds: string[],
  breakpoint: Breakpoint,
  snapEnabled: boolean
): SnapResult {
  if (!snapEnabled) {
    return {
      x: dragRect.x,
      y: dragRect.y,
      snappedX: false,
      snappedY: false,
      guides: [],
    };
  }

  const gridCandidates = generateGridCandidates(section, sectionWidth);
  const elementCandidates = generateElementCandidates(elements, excludeIds, breakpoint);

  const verticalCandidates = [...gridCandidates, ...elementCandidates].filter(
    (c) => c.type === 'vertical'
  );
  const horizontalCandidates = [...gridCandidates, ...elementCandidates].filter(
    (c) => c.type === 'horizontal'
  );

  const dragEdges = getRectEdges(dragRect);
  const guides: SnapLine[] = [];

  // Check edges for vertical snap - only snap the CLOSEST edge to avoid glitchy behavior
  const verticalPoints = [
    { value: dragEdges.left, offset: 0, label: 'Left' },
    { value: dragEdges.right, offset: -dragRect.w, label: 'Right' },
  ];

  let bestVerticalSnap = { snapped: false, position: dragRect.x, distance: Infinity, candidate: undefined as SnapCandidate | undefined };

  // Find which edge is closest to a snap candidate first
  let closestEdgeDistance = Infinity;
  let closestEdgeIndex = -1;

  for (let i = 0; i < verticalPoints.length; i++) {
    const point = verticalPoints[i];
    for (const candidate of verticalCandidates) {
      const distance = Math.abs(candidate.position - point.value);
      if (distance < closestEdgeDistance && distance <= SNAP_THRESHOLD) {
        closestEdgeDistance = distance;
        closestEdgeIndex = i;
      }
    }
  }

  // Only snap the closest edge
  if (closestEdgeIndex >= 0) {
    const point = verticalPoints[closestEdgeIndex];
    const snap = findBestSnap(verticalCandidates, point.value);
    if (snap.snapped) {
      bestVerticalSnap = {
        snapped: true,
        position: snap.position + point.offset,
        distance: Math.abs(snap.position - point.value),
        candidate: snap.candidate,
      };
    }
  }

  // Check edges for horizontal snap - only snap the CLOSEST edge to avoid glitchy behavior
  const horizontalPoints = [
    { value: dragEdges.top, offset: 0, label: 'Top' },
    { value: dragEdges.bottom, offset: -dragRect.h, label: 'Bottom' },
  ];

  let bestHorizontalSnap = { snapped: false, position: dragRect.y, distance: Infinity, candidate: undefined as SnapCandidate | undefined };

  // Find which edge is closest to a snap candidate first
  let closestHorizontalEdgeDistance = Infinity;
  let closestHorizontalEdgeIndex = -1;

  for (let i = 0; i < horizontalPoints.length; i++) {
    const point = horizontalPoints[i];
    for (const candidate of horizontalCandidates) {
      const distance = Math.abs(candidate.position - point.value);
      if (distance < closestHorizontalEdgeDistance && distance <= SNAP_THRESHOLD) {
        closestHorizontalEdgeDistance = distance;
        closestHorizontalEdgeIndex = i;
      }
    }
  }

  // Only snap the closest edge
  if (closestHorizontalEdgeIndex >= 0) {
    const point = horizontalPoints[closestHorizontalEdgeIndex];
    const snap = findBestSnap(horizontalCandidates, point.value);
    if (snap.snapped) {
      bestHorizontalSnap = {
        snapped: true,
        position: snap.position + point.offset,
        distance: Math.abs(snap.position - point.value),
        candidate: snap.candidate,
      };
    }
  }

  // Generate guide lines for active snaps
  if (bestVerticalSnap.snapped && bestVerticalSnap.candidate) {
    guides.push({
      type: 'vertical',
      position: bestVerticalSnap.candidate.position,
      label: bestVerticalSnap.candidate.label,
      source: bestVerticalSnap.candidate.source,
      strength: 1 - bestVerticalSnap.distance / SNAP_THRESHOLD,
    });
  }

  if (bestHorizontalSnap.snapped && bestHorizontalSnap.candidate) {
    guides.push({
      type: 'horizontal',
      position: bestHorizontalSnap.candidate.position,
      label: bestHorizontalSnap.candidate.label,
      source: bestHorizontalSnap.candidate.source,
      strength: 1 - bestHorizontalSnap.distance / SNAP_THRESHOLD,
    });
  }

  let alignmentLabel: string | undefined;
  if (bestVerticalSnap.candidate?.label?.includes('Center')) {
    alignmentLabel = 'center';
  } else if (bestHorizontalSnap.candidate?.label?.includes('Middle')) {
    alignmentLabel = 'middle';
  }

  return {
    x: bestVerticalSnap.snapped ? bestVerticalSnap.position : dragRect.x,
    y: bestHorizontalSnap.snapped ? bestHorizontalSnap.position : dragRect.y,
    snappedX: bestVerticalSnap.snapped,
    snappedY: bestHorizontalSnap.snapped,
    guides,
    alignmentLabel,
  };
}

export function computeSpacingIndicators(
  dragRect: Rect,
  elements: PageElement[],
  excludeIds: string[],
  breakpoint: Breakpoint
): SpacingIndicator[] {
  const indicators: SpacingIndicator[] = [];
  const SPACING_THRESHOLD = 50; // Only show if elements are close enough

  const otherElements = elements.filter((e) => !excludeIds.includes(e.id));
  const dragEdges = getRectEdges(dragRect);

  for (const element of otherElements) {
    const layout = element.layout[breakpoint];
    const elemEdges = getRectEdges({ x: layout.x, y: layout.y, w: layout.w, h: layout.h });

    // Check horizontal spacing (left/right)
    if (dragEdges.top < elemEdges.bottom && dragEdges.bottom > elemEdges.top) {
      // Right of drag to left of element
      if (elemEdges.left > dragEdges.right && elemEdges.left - dragEdges.right < SPACING_THRESHOLD) {
        const gap = elemEdges.left - dragEdges.right;
        const y = Math.max(dragEdges.top, elemEdges.top);
        const height = Math.min(dragEdges.bottom, elemEdges.bottom) - y;
        indicators.push({
          direction: 'horizontal',
          value: Math.round(gap),
          x: dragEdges.right,
          y: y + height / 2 - 10,
          width: gap,
          height: 20,
        });
      }
      // Left of drag to right of element
      if (dragEdges.left > elemEdges.right && dragEdges.left - elemEdges.right < SPACING_THRESHOLD) {
        const gap = dragEdges.left - elemEdges.right;
        const y = Math.max(dragEdges.top, elemEdges.top);
        const height = Math.min(dragEdges.bottom, elemEdges.bottom) - y;
        indicators.push({
          direction: 'horizontal',
          value: Math.round(gap),
          x: elemEdges.right,
          y: y + height / 2 - 10,
          width: gap,
          height: 20,
        });
      }
    }

    // Check vertical spacing (top/bottom)
    if (dragEdges.left < elemEdges.right && dragEdges.right > elemEdges.left) {
      // Bottom of drag to top of element
      if (elemEdges.top > dragEdges.bottom && elemEdges.top - dragEdges.bottom < SPACING_THRESHOLD) {
        const gap = elemEdges.top - dragEdges.bottom;
        const x = Math.max(dragEdges.left, elemEdges.left);
        const width = Math.min(dragEdges.right, elemEdges.right) - x;
        indicators.push({
          direction: 'vertical',
          value: Math.round(gap),
          x: x + width / 2 - 10,
          y: dragEdges.bottom,
          width: 20,
          height: gap,
        });
      }
      // Top of drag to bottom of element
      if (dragEdges.top > elemEdges.bottom && dragEdges.top - elemEdges.bottom < SPACING_THRESHOLD) {
        const gap = dragEdges.top - elemEdges.bottom;
        const x = Math.max(dragEdges.left, elemEdges.left);
        const width = Math.min(dragEdges.right, elemEdges.right) - x;
        indicators.push({
          direction: 'vertical',
          value: Math.round(gap),
          x: x + width / 2 - 10,
          y: elemEdges.bottom,
          width: 20,
          height: gap,
        });
      }
    }
  }

  return indicators;
}

export function detectCollisions(
  dragRect: Rect,
  elements: PageElement[],
  excludeIds: string[],
  breakpoint: Breakpoint
): { elementId: string; overlapPercentage: number }[] {
  const collisions: { elementId: string; overlapPercentage: number }[] = [];

  for (const element of elements) {
    if (excludeIds.includes(element.id)) continue;

    const layout = element.layout[breakpoint];
    const elemRect: Rect = { x: layout.x, y: layout.y, w: layout.w, h: layout.h };

    const dragEdges = getRectEdges(dragRect);
    const elemEdges = getRectEdges(elemRect);

    // Check intersection
    if (
      dragEdges.left < elemEdges.right &&
      dragEdges.right > elemEdges.left &&
      dragEdges.top < elemEdges.bottom &&
      dragEdges.bottom > elemEdges.top
    ) {
      const xOverlap = Math.min(dragEdges.right, elemEdges.right) - Math.max(dragEdges.left, elemEdges.left);
      const yOverlap = Math.min(dragEdges.bottom, elemEdges.bottom) - Math.max(dragEdges.top, elemEdges.top);
      const intersection = xOverlap * yOverlap;
      const smallerArea = Math.min(dragRect.w * dragRect.h, elemRect.w * elemRect.h);
      const overlapPercentage = (intersection / smallerArea) * 100;

      if (overlapPercentage > 30) {
        collisions.push({ elementId: element.id, overlapPercentage });
      }
    }
  }

  return collisions;
}
