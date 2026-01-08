import { describe, it, expect } from 'vitest';
import {
  generateGridCandidates,
  generateElementCandidates,
  findBestSnap,
  computeSnap,
  computeSpacingIndicators,
  detectCollisions,
} from '../engine/snapping';
import type { Section, PageElement, Breakpoint } from '../types';

describe('Snapping Engine', () => {
  describe('generateGridCandidates', () => {
    const section: Section = {
      id: 'test-section',
      name: 'Test Section',
      height: 500,
      background: { type: 'color', value: '#ffffff' },
      grid: {
        columns: 12,
        rowHeight: 40,
        gap: 20,
        visible: true,
        snapStrength: 'strong',
      },
      order: 0,
    };

    it('should generate vertical candidates for each column', () => {
      const candidates = generateGridCandidates(section, 1200);
      const verticalCandidates = candidates.filter((c) => c.type === 'vertical');

      // Should have column edges + column centers + section center
      expect(verticalCandidates.length).toBeGreaterThan(12);
    });

    it('should generate horizontal candidates for rows', () => {
      const candidates = generateGridCandidates(section, 1200);
      const horizontalCandidates = candidates.filter((c) => c.type === 'horizontal');

      // Should have row lines based on section height
      expect(horizontalCandidates.length).toBeGreaterThan(0);
    });

    it('should include section center lines', () => {
      const candidates = generateGridCandidates(section, 1200);

      const verticalCenter = candidates.find(
        (c) => c.type === 'vertical' && c.label === 'Section Center'
      );
      const horizontalCenter = candidates.find(
        (c) => c.type === 'horizontal' && c.label === 'Section Center'
      );

      expect(verticalCenter).toBeDefined();
      expect(verticalCenter?.position).toBe(600); // 1200 / 2
      expect(horizontalCenter).toBeDefined();
      expect(horizontalCenter?.position).toBe(250); // 500 / 2
    });

    it('should return empty array when snapStrength is off', () => {
      const noSnapSection = {
        ...section,
        grid: { ...section.grid, snapStrength: 'off' as const },
      };
      const candidates = generateGridCandidates(noSnapSection, 1200);
      expect(candidates).toHaveLength(0);
    });
  });

  describe('generateElementCandidates', () => {
    const elements: PageElement[] = [
      {
        id: 'elem-1',
        sectionId: 'test-section',
        type: 'block',
        content: { backgroundColor: '#ccc', borderRadius: 0, borderWidth: 0, borderColor: '#000' },
        layout: {
          desktop: { x: 100, y: 100, w: 200, h: 150, z: 1 },
          mobile: { x: 50, y: 50, w: 100, h: 75, z: 1 },
        },
        locked: false,
        visible: true,
      },
    ];

    it('should generate 6 candidates per element (3 vertical + 3 horizontal)', () => {
      const candidates = generateElementCandidates(elements, [], 'desktop');

      expect(candidates).toHaveLength(6);

      const verticalCandidates = candidates.filter((c) => c.type === 'vertical');
      const horizontalCandidates = candidates.filter((c) => c.type === 'horizontal');

      expect(verticalCandidates).toHaveLength(3);
      expect(horizontalCandidates).toHaveLength(3);
    });

    it('should calculate correct positions for desktop', () => {
      const candidates = generateElementCandidates(elements, [], 'desktop');

      const leftEdge = candidates.find((c) => c.label === 'Left edge');
      const rightEdge = candidates.find((c) => c.label === 'Right edge');
      const centerX = candidates.find((c) => c.type === 'vertical' && c.label === 'Center');

      expect(leftEdge?.position).toBe(100);
      expect(rightEdge?.position).toBe(300); // 100 + 200
      expect(centerX?.position).toBe(200); // 100 + 200/2
    });

    it('should exclude specified element IDs', () => {
      const candidates = generateElementCandidates(elements, ['elem-1'], 'desktop');
      expect(candidates).toHaveLength(0);
    });

    it('should use mobile layout when specified', () => {
      const candidates = generateElementCandidates(elements, [], 'mobile');

      const leftEdge = candidates.find((c) => c.label === 'Left edge');
      expect(leftEdge?.position).toBe(50);
    });
  });

  describe('findBestSnap', () => {
    const candidates = [
      { type: 'vertical' as const, position: 100, source: 'grid' as const, priority: 1 },
      { type: 'vertical' as const, position: 200, source: 'element' as const, priority: 2 },
      { type: 'vertical' as const, position: 300, source: 'grid' as const, priority: 1 },
    ];

    it('should snap when within threshold', () => {
      const result = findBestSnap(candidates, 105, 8);
      expect(result.snapped).toBe(true);
      expect(result.position).toBe(100);
    });

    it('should not snap when outside threshold', () => {
      const result = findBestSnap(candidates, 150, 8);
      expect(result.snapped).toBe(false);
      expect(result.position).toBe(150);
    });

    it('should prefer higher priority candidates', () => {
      // Both 100 and 200 are within threshold from 104
      // But 200 has priority 2 vs 100's priority 1
      const result = findBestSnap(candidates, 197, 8);
      expect(result.snapped).toBe(true);
      expect(result.position).toBe(200);
    });

    it('should prefer closer distance when priorities are equal', () => {
      const equalPriorityCandidates = [
        { type: 'vertical' as const, position: 100, source: 'grid' as const, priority: 1 },
        { type: 'vertical' as const, position: 110, source: 'grid' as const, priority: 1 },
      ];

      const result = findBestSnap(equalPriorityCandidates, 103, 8);
      expect(result.position).toBe(100); // Closer to 103
    });
  });

  describe('computeSpacingIndicators', () => {
    const breakpoint: Breakpoint = 'desktop';

    const elements: PageElement[] = [
      {
        id: 'elem-1',
        sectionId: 'test-section',
        type: 'block',
        content: { backgroundColor: '#ccc', borderRadius: 0, borderWidth: 0, borderColor: '#000' },
        layout: {
          desktop: { x: 100, y: 100, w: 100, h: 100, z: 1 },
          mobile: { x: 50, y: 50, w: 100, h: 75, z: 1 },
        },
        locked: false,
        visible: true,
      },
    ];

    it('should detect horizontal spacing when elements are close', () => {
      const dragRect = { x: 230, y: 100, w: 100, h: 100 }; // 30px to the right of elem-1
      const indicators = computeSpacingIndicators(dragRect, elements, ['drag-elem'], breakpoint);

      const horizontalIndicator = indicators.find((i) => i.direction === 'horizontal');
      expect(horizontalIndicator).toBeDefined();
      expect(horizontalIndicator?.value).toBe(30);
    });

    it('should detect vertical spacing when elements are close', () => {
      const dragRect = { x: 100, y: 220, w: 100, h: 100 }; // 20px below elem-1
      const indicators = computeSpacingIndicators(dragRect, elements, ['drag-elem'], breakpoint);

      const verticalIndicator = indicators.find((i) => i.direction === 'vertical');
      expect(verticalIndicator).toBeDefined();
      expect(verticalIndicator?.value).toBe(20);
    });

    it('should not show indicators when elements are too far apart', () => {
      const dragRect = { x: 300, y: 100, w: 100, h: 100 }; // 100px gap
      const indicators = computeSpacingIndicators(dragRect, elements, ['drag-elem'], breakpoint);
      expect(indicators).toHaveLength(0);
    });
  });

  describe('detectCollisions', () => {
    const breakpoint: Breakpoint = 'desktop';

    const elements: PageElement[] = [
      {
        id: 'elem-1',
        sectionId: 'test-section',
        type: 'block',
        content: { backgroundColor: '#ccc', borderRadius: 0, borderWidth: 0, borderColor: '#000' },
        layout: {
          desktop: { x: 100, y: 100, w: 100, h: 100, z: 1 },
          mobile: { x: 50, y: 50, w: 100, h: 75, z: 1 },
        },
        locked: false,
        visible: true,
      },
    ];

    it('should detect significant overlap (>30%)', () => {
      // 50% overlap
      const dragRect = { x: 150, y: 100, w: 100, h: 100 };
      const collisions = detectCollisions(dragRect, elements, ['drag-elem'], breakpoint);

      expect(collisions).toHaveLength(1);
      expect(collisions[0].elementId).toBe('elem-1');
      expect(collisions[0].overlapPercentage).toBeGreaterThan(30);
    });

    it('should not report minor overlap (<30%)', () => {
      // ~20% overlap
      const dragRect = { x: 180, y: 100, w: 100, h: 100 };
      const collisions = detectCollisions(dragRect, elements, ['drag-elem'], breakpoint);

      expect(collisions).toHaveLength(0);
    });

    it('should not detect collision for excluded elements', () => {
      const dragRect = { x: 100, y: 100, w: 100, h: 100 }; // Full overlap
      const collisions = detectCollisions(dragRect, elements, ['elem-1'], breakpoint);

      expect(collisions).toHaveLength(0);
    });
  });

  describe('computeSnap', () => {
    const section: Section = {
      id: 'test-section',
      name: 'Test Section',
      height: 500,
      background: { type: 'color', value: '#ffffff' },
      grid: {
        columns: 12,
        rowHeight: 40,
        gap: 20,
        visible: true,
        snapStrength: 'strong',
      },
      order: 0,
    };

    it('should return original position when snap is disabled', () => {
      const result = computeSnap(
        { x: 105, y: 105, w: 100, h: 100 },
        section,
        1200,
        [],
        [],
        'desktop',
        false
      );

      expect(result.x).toBe(105);
      expect(result.y).toBe(105);
      expect(result.snappedX).toBe(false);
      expect(result.snappedY).toBe(false);
    });

    it('should snap to nearby grid or center', () => {
      const result = computeSnap(
        { x: 548, y: 200, w: 100, h: 100 }, // x + w/2 = 598, close to 600
        section,
        1200,
        [],
        [],
        'desktop',
        true
      );

      expect(result.snappedX).toBe(true);
      // Should snap to a nearby target (grid line or center)
      expect(Math.abs(result.x - 550)).toBeLessThan(5);
    });

    it('should return snap guides when snapping occurs', () => {
      const result = computeSnap(
        { x: 548, y: 200, w: 100, h: 100 },
        section,
        1200,
        [],
        [],
        'desktop',
        true
      );

      expect(result.guides.length).toBeGreaterThan(0);
    });
  });
});
