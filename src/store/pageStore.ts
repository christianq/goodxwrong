// Zustand store with undo/redo and immer

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import type {
  PageState,
  PageElement,
  Section,
  Breakpoint,
  HistoryEntry,
  ElementType,
  TextContent,
  ImageContent,
  ButtonContent,
  BlockContent,
  LayoutProps,
} from '../types';

interface PageStore extends PageState {
  // History
  history: HistoryEntry[];
  historyIndex: number;
  maxHistoryLength: number;

  // Actions
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Section actions
  addSection: (afterId?: string) => void;
  updateSection: (id: string, updates: Partial<Section>) => void;
  deleteSection: (id: string) => void;
  duplicateSection: (id: string) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  selectSection: (id: string | null) => void;

  // Element actions
  addElement: (sectionId: string, type: ElementType, position?: { x: number; y: number }) => void;
  updateElement: (id: string, updates: Partial<PageElement>) => void;
  updateElementLayout: (id: string, breakpoint: Breakpoint, layout: Partial<LayoutProps>) => void;
  deleteElement: (id: string) => void;
  deleteSelectedElements: () => void;
  duplicateElements: (ids: string[]) => void;

  // Selection
  selectElement: (id: string, additive?: boolean) => void;
  selectElements: (ids: string[]) => void;
  clearSelection: () => void;
  selectAllInSection: (sectionId: string) => void;

  // Viewport
  setBreakpoint: (breakpoint: Breakpoint) => void;
  setZoom: (zoom: number) => void;
  setSnapEnabled: (enabled: boolean) => void;

  // Z-order
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;

  // Nudge
  nudgeElements: (ids: string[], dx: number, dy: number) => void;

  // Persistence
  exportPage: () => string;
  importPage: (json: string) => void;
  loadSeedPage: () => void;
}

const createDefaultTextContent = (): TextContent => ({
  text: 'New Text',
  fontSize: 16,
  fontWeight: 400,
  color: '#1a1a1a',
  fontFamily: 'Inter, system-ui, sans-serif',
  lineHeight: 1.5,
  letterSpacing: 0,
  textAlign: 'left',
  textDecoration: 'none',
  fontStyle: 'normal',
});

const createDefaultImageContent = (): ImageContent => ({
  src: '',
  alt: 'Image placeholder',
  objectFit: 'cover',
});

const createDefaultButtonContent = (): ButtonContent => ({
  label: 'Button',
  backgroundColor: '#2563eb',
  textColor: '#ffffff',
  borderRadius: 8,
});

const createDefaultBlockContent = (): BlockContent => ({
  backgroundColor: '#e5e7eb',
  borderRadius: 0,
  borderWidth: 0,
  borderColor: '#d1d5db',
});

const createDefaultLayout = (x: number = 100, y: number = 100): { desktop: LayoutProps; mobile: LayoutProps } => ({
  desktop: { x, y, w: 200, h: 100, z: 1 },
  mobile: { x: 20, y, w: 280, h: 100, z: 1 },
});

const createDefaultSection = (order: number): Section => ({
  id: nanoid(),
  name: `Section ${order + 1}`,
  height: 500,
  background: { type: 'color', value: '#ffffff' },
  grid: {
    columns: 12,
    rowHeight: 40,
    gap: 20,
    visible: true,
    snapStrength: 'strong',
  },
  order,
});

const getContentForType = (type: ElementType) => {
  switch (type) {
    case 'text':
      return createDefaultTextContent();
    case 'image':
      return createDefaultImageContent();
    case 'button':
      return createDefaultButtonContent();
    case 'block':
      return createDefaultBlockContent();
  }
};

const getSizeForType = (type: ElementType): { w: number; h: number } => {
  switch (type) {
    case 'text':
      return { w: 200, h: 60 };
    case 'image':
      return { w: 300, h: 200 };
    case 'button':
      return { w: 150, h: 48 };
    case 'block':
      return { w: 200, h: 200 };
  }
};

export const usePageStore = create<PageStore>()(
  immer((set, get) => ({
    // Initial state
    sections: [],
    elements: [],
    selectedElementIds: [],
    selectedSectionId: null,
    breakpoint: 'desktop',
    zoom: 1,
    snapEnabled: true,

    history: [],
    historyIndex: -1,
    maxHistoryLength: 50,

    pushHistory: () => {
      set((state) => {
        const entry: HistoryEntry = {
          sections: JSON.parse(JSON.stringify(state.sections)),
          elements: JSON.parse(JSON.stringify(state.elements)),
          selectedElementIds: [...state.selectedElementIds],
          selectedSectionId: state.selectedSectionId,
        };

        // Remove any forward history
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(entry);

        // Limit history length
        if (newHistory.length > state.maxHistoryLength) {
          newHistory.shift();
        }

        state.history = newHistory;
        state.historyIndex = newHistory.length - 1;
      });
    },

    undo: () => {
      const { historyIndex, history } = get();
      if (historyIndex > 0) {
        set((state) => {
          const entry = history[historyIndex - 1];
          state.sections = JSON.parse(JSON.stringify(entry.sections));
          state.elements = JSON.parse(JSON.stringify(entry.elements));
          state.selectedElementIds = [...entry.selectedElementIds];
          state.selectedSectionId = entry.selectedSectionId;
          state.historyIndex = historyIndex - 1;
        });
      }
    },

    redo: () => {
      const { historyIndex, history } = get();
      if (historyIndex < history.length - 1) {
        set((state) => {
          const entry = history[historyIndex + 1];
          state.sections = JSON.parse(JSON.stringify(entry.sections));
          state.elements = JSON.parse(JSON.stringify(entry.elements));
          state.selectedElementIds = [...entry.selectedElementIds];
          state.selectedSectionId = entry.selectedSectionId;
          state.historyIndex = historyIndex + 1;
        });
      }
    },

    addSection: (afterId) => {
      get().pushHistory();
      set((state) => {
        let insertIndex = state.sections.length;
        if (afterId) {
          const idx = state.sections.findIndex((s) => s.id === afterId);
          if (idx !== -1) insertIndex = idx + 1;
        }
        const newSection = createDefaultSection(insertIndex);
        state.sections.splice(insertIndex, 0, newSection);
        // Update order for all sections
        state.sections.forEach((s, i) => {
          s.order = i;
        });
        state.selectedSectionId = newSection.id;
        state.selectedElementIds = [];
      });
    },

    updateSection: (id, updates) => {
      get().pushHistory();
      set((state) => {
        const section = state.sections.find((s) => s.id === id);
        if (section) {
          Object.assign(section, updates);
        }
      });
    },

    deleteSection: (id) => {
      get().pushHistory();
      set((state) => {
        state.sections = state.sections.filter((s) => s.id !== id);
        state.elements = state.elements.filter((e) => e.sectionId !== id);
        state.sections.forEach((s, i) => {
          s.order = i;
        });
        if (state.selectedSectionId === id) {
          state.selectedSectionId = state.sections[0]?.id ?? null;
        }
        state.selectedElementIds = state.selectedElementIds.filter(
          (eid) => !state.elements.find((e) => e.id === eid && e.sectionId === id)
        );
      });
    },

    duplicateSection: (id) => {
      get().pushHistory();
      set((state) => {
        const section = state.sections.find((s) => s.id === id);
        if (!section) return;

        // Create new section with new ID
        const newSectionId = nanoid();
        const newSection: Section = {
          ...JSON.parse(JSON.stringify(section)),
          id: newSectionId,
          name: `${section.name} Copy`,
        };

        // Find insert position (after the original section)
        const idx = state.sections.findIndex((s) => s.id === id);
        state.sections.splice(idx + 1, 0, newSection);

        // Update order for all sections
        state.sections.forEach((s, i) => {
          s.order = i;
        });

        // Duplicate all elements in the section
        const sectionElements = state.elements.filter((e) => e.sectionId === id);
        const newElements = sectionElements.map((el) => ({
          ...JSON.parse(JSON.stringify(el)),
          id: nanoid(),
          sectionId: newSectionId,
        }));

        state.elements.push(...newElements);
        state.selectedSectionId = newSectionId;
        state.selectedElementIds = [];
      });
    },

    reorderSections: (fromIndex, toIndex) => {
      get().pushHistory();
      set((state) => {
        const [section] = state.sections.splice(fromIndex, 1);
        state.sections.splice(toIndex, 0, section);
        state.sections.forEach((s, i) => {
          s.order = i;
        });
      });
    },

    selectSection: (id) => {
      set((state) => {
        state.selectedSectionId = id;
        state.selectedElementIds = [];
      });
    },

    addElement: (sectionId, type, position) => {
      get().pushHistory();
      set((state) => {
        const size = getSizeForType(type);
        const layout = createDefaultLayout(position?.x ?? 100, position?.y ?? 100);
        layout.desktop.w = size.w;
        layout.desktop.h = size.h;
        layout.mobile.w = Math.min(size.w, 280);
        layout.mobile.h = size.h;

        const maxZ = Math.max(0, ...state.elements.filter((e) => e.sectionId === sectionId).map((e) => e.layout.desktop.z));

        const newElement: PageElement = {
          id: nanoid(),
          sectionId,
          type,
          content: getContentForType(type),
          layout: {
            desktop: { ...layout.desktop, z: maxZ + 1 },
            mobile: { ...layout.mobile, z: maxZ + 1 },
          },
          locked: false,
          visible: true,
        };

        state.elements.push(newElement);
        state.selectedElementIds = [newElement.id];
        state.selectedSectionId = null;
      });
    },

    updateElement: (id, updates) => {
      get().pushHistory();
      set((state) => {
        const element = state.elements.find((e) => e.id === id);
        if (element) {
          Object.assign(element, updates);
        }
      });
    },

    updateElementLayout: (id, breakpoint, layout) => {
      set((state) => {
        const element = state.elements.find((e) => e.id === id);
        if (element) {
          Object.assign(element.layout[breakpoint], layout);
        }
      });
    },

    deleteElement: (id) => {
      get().pushHistory();
      set((state) => {
        state.elements = state.elements.filter((e) => e.id !== id);
        state.selectedElementIds = state.selectedElementIds.filter((eid) => eid !== id);
      });
    },

    deleteSelectedElements: () => {
      const { selectedElementIds } = get();
      if (selectedElementIds.length === 0) return;
      get().pushHistory();
      set((state) => {
        state.elements = state.elements.filter((e) => !selectedElementIds.includes(e.id));
        state.selectedElementIds = [];
      });
    },

    duplicateElements: (ids) => {
      get().pushHistory();
      set((state) => {
        const newIds: string[] = [];
        for (const id of ids) {
          const element = state.elements.find((e) => e.id === id);
          if (element) {
            const newElement: PageElement = {
              ...JSON.parse(JSON.stringify(element)),
              id: nanoid(),
            };
            // Offset the duplicate
            newElement.layout.desktop.x += 20;
            newElement.layout.desktop.y += 20;
            newElement.layout.mobile.x += 20;
            newElement.layout.mobile.y += 20;
            state.elements.push(newElement);
            newIds.push(newElement.id);
          }
        }
        state.selectedElementIds = newIds;
      });
    },

    selectElement: (id, additive = false) => {
      set((state) => {
        state.selectedSectionId = null;
        if (additive) {
          if (state.selectedElementIds.includes(id)) {
            state.selectedElementIds = state.selectedElementIds.filter((eid) => eid !== id);
          } else {
            state.selectedElementIds.push(id);
          }
        } else {
          state.selectedElementIds = [id];
        }
      });
    },

    selectElements: (ids) => {
      set((state) => {
        state.selectedSectionId = null;
        state.selectedElementIds = ids;
      });
    },

    clearSelection: () => {
      set((state) => {
        state.selectedElementIds = [];
        state.selectedSectionId = null;
      });
    },

    selectAllInSection: (sectionId) => {
      set((state) => {
        state.selectedElementIds = state.elements
          .filter((e) => e.sectionId === sectionId)
          .map((e) => e.id);
        state.selectedSectionId = null;
      });
    },

    setBreakpoint: (breakpoint) => {
      set((state) => {
        state.breakpoint = breakpoint;
      });
    },

    setZoom: (zoom) => {
      set((state) => {
        state.zoom = zoom;
      });
    },

    setSnapEnabled: (enabled) => {
      set((state) => {
        state.snapEnabled = enabled;
      });
    },

    bringForward: (id) => {
      get().pushHistory();
      set((state) => {
        const element = state.elements.find((e) => e.id === id);
        if (!element) return;

        const siblings = state.elements.filter((e) => e.sectionId === element.sectionId);
        const currentZ = element.layout[state.breakpoint].z;
        const above = siblings.filter((e) => e.layout[state.breakpoint].z > currentZ);

        if (above.length > 0) {
          const nextZ = Math.min(...above.map((e) => e.layout[state.breakpoint].z));
          const swapElement = siblings.find((e) => e.layout[state.breakpoint].z === nextZ);
          if (swapElement) {
            swapElement.layout[state.breakpoint].z = currentZ;
            element.layout[state.breakpoint].z = nextZ;
          }
        }
      });
    },

    sendBackward: (id) => {
      get().pushHistory();
      set((state) => {
        const element = state.elements.find((e) => e.id === id);
        if (!element) return;

        const siblings = state.elements.filter((e) => e.sectionId === element.sectionId);
        const currentZ = element.layout[state.breakpoint].z;
        const below = siblings.filter((e) => e.layout[state.breakpoint].z < currentZ);

        if (below.length > 0) {
          const prevZ = Math.max(...below.map((e) => e.layout[state.breakpoint].z));
          const swapElement = siblings.find((e) => e.layout[state.breakpoint].z === prevZ);
          if (swapElement) {
            swapElement.layout[state.breakpoint].z = currentZ;
            element.layout[state.breakpoint].z = prevZ;
          }
        }
      });
    },

    bringToFront: (id) => {
      get().pushHistory();
      set((state) => {
        const element = state.elements.find((e) => e.id === id);
        if (!element) return;

        const siblings = state.elements.filter((e) => e.sectionId === element.sectionId);
        const maxZ = Math.max(...siblings.map((e) => e.layout[state.breakpoint].z));
        element.layout[state.breakpoint].z = maxZ + 1;
      });
    },

    sendToBack: (id) => {
      get().pushHistory();
      set((state) => {
        const element = state.elements.find((e) => e.id === id);
        if (!element) return;

        const siblings = state.elements.filter((e) => e.sectionId === element.sectionId);
        const minZ = Math.min(...siblings.map((e) => e.layout[state.breakpoint].z));
        element.layout[state.breakpoint].z = minZ - 1;
      });
    },

    nudgeElements: (ids, dx, dy) => {
      set((state) => {
        for (const id of ids) {
          const element = state.elements.find((e) => e.id === id);
          if (element) {
            element.layout[state.breakpoint].x += dx;
            element.layout[state.breakpoint].y += dy;
          }
        }
      });
    },

    exportPage: () => {
      const { sections, elements } = get();
      return JSON.stringify({ sections, elements }, null, 2);
    },

    importPage: (json) => {
      try {
        const data = JSON.parse(json);
        get().pushHistory();
        set((state) => {
          state.sections = data.sections || [];
          state.elements = data.elements || [];
          state.selectedElementIds = [];
          state.selectedSectionId = null;
        });
      } catch (e) {
        console.error('Failed to import page:', e);
      }
    },

    loadSeedPage: () => {
      const section1: Section = {
        id: 'section-hero',
        name: 'Hero Section',
        height: 600,
        background: { type: 'color', value: '#f8fafc' },
        grid: {
          columns: 12,
          rowHeight: 40,
          gap: 20,
          visible: true,
          snapStrength: 'strong',
        },
        order: 0,
      };

      const section2: Section = {
        id: 'section-features',
        name: 'Features Section',
        height: 500,
        background: { type: 'color', value: '#ffffff' },
        grid: {
          columns: 12,
          rowHeight: 40,
          gap: 20,
          visible: true,
          snapStrength: 'strong',
        },
        order: 1,
      };

      const elements: PageElement[] = [
        {
          id: 'elem-title',
          sectionId: 'section-hero',
          type: 'text',
          content: {
            text: 'Welcome to Fluid Engine',
            fontSize: 48,
            fontWeight: 700,
            color: '#0f172a',
            fontFamily: 'Inter, system-ui, sans-serif',
            lineHeight: 1.2,
            letterSpacing: -1,
            textAlign: 'left',
            textDecoration: 'none',
            fontStyle: 'normal',
          } as TextContent,
          layout: {
            desktop: { x: 200, y: 180, w: 500, h: 70, z: 1 },
            mobile: { x: 20, y: 100, w: 280, h: 80, z: 1 },
          },
          locked: false,
          visible: true,
        },
        {
          id: 'elem-subtitle',
          sectionId: 'section-hero',
          type: 'text',
          content: {
            text: 'Build beautiful, responsive layouts with drag and drop',
            fontSize: 20,
            fontWeight: 400,
            color: '#64748b',
            fontFamily: 'Inter, system-ui, sans-serif',
            lineHeight: 1.6,
            letterSpacing: 0,
            textAlign: 'left',
            textDecoration: 'none',
            fontStyle: 'normal',
          } as TextContent,
          layout: {
            desktop: { x: 200, y: 260, w: 450, h: 40, z: 2 },
            mobile: { x: 20, y: 190, w: 280, h: 60, z: 2 },
          },
          locked: false,
          visible: true,
        },
        {
          id: 'elem-cta',
          sectionId: 'section-hero',
          type: 'button',
          content: {
            label: 'Get Started',
            backgroundColor: '#2563eb',
            textColor: '#ffffff',
            borderRadius: 8,
          } as ButtonContent,
          layout: {
            desktop: { x: 200, y: 340, w: 160, h: 52, z: 3 },
            mobile: { x: 20, y: 270, w: 140, h: 48, z: 3 },
          },
          locked: false,
          visible: true,
        },
        {
          id: 'elem-image',
          sectionId: 'section-hero',
          type: 'image',
          content: {
            src: '',
            alt: 'Hero image',
            objectFit: 'cover',
          } as ImageContent,
          layout: {
            desktop: { x: 550, y: 120, w: 400, h: 350, z: 0 },
            mobile: { x: 20, y: 340, w: 280, h: 200, z: 0 },
          },
          locked: false,
          visible: true,
        },
        {
          id: 'elem-feature1',
          sectionId: 'section-features',
          type: 'block',
          content: {
            backgroundColor: '#dbeafe',
            borderRadius: 12,
            borderWidth: 0,
            borderColor: '#bfdbfe',
          } as BlockContent,
          layout: {
            desktop: { x: 100, y: 80, w: 250, h: 200, z: 1 },
            mobile: { x: 20, y: 40, w: 280, h: 150, z: 1 },
          },
          locked: false,
          visible: true,
        },
        {
          id: 'elem-feature2',
          sectionId: 'section-features',
          type: 'block',
          content: {
            backgroundColor: '#dcfce7',
            borderRadius: 12,
            borderWidth: 0,
            borderColor: '#bbf7d0',
          } as BlockContent,
          layout: {
            desktop: { x: 380, y: 80, w: 250, h: 200, z: 1 },
            mobile: { x: 20, y: 210, w: 280, h: 150, z: 1 },
          },
          locked: false,
          visible: true,
        },
        {
          id: 'elem-feature3',
          sectionId: 'section-features',
          type: 'block',
          content: {
            backgroundColor: '#fef3c7',
            borderRadius: 12,
            borderWidth: 0,
            borderColor: '#fde68a',
          } as BlockContent,
          layout: {
            desktop: { x: 660, y: 80, w: 250, h: 200, z: 1 },
            mobile: { x: 20, y: 380, w: 280, h: 150, z: 1 },
          },
          locked: false,
          visible: true,
        },
      ];

      set((state) => {
        state.sections = [section1, section2];
        state.elements = elements;
        state.selectedElementIds = [];
        state.selectedSectionId = null;
        state.history = [];
        state.historyIndex = -1;
      });

      // Push initial state to history
      get().pushHistory();
    },
  }))
);
