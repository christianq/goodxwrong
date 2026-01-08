// Core types for the Fluid Engine Page Builder

export type Breakpoint = 'desktop' | 'mobile';

export type ElementType = 'text' | 'image' | 'button' | 'block';

export interface LayoutProps {
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
}

export interface TextContent {
  text: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  fontFamily: string;
  lineHeight: number;
  letterSpacing: number;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  textDecoration: 'none' | 'underline' | 'line-through';
  fontStyle: 'normal' | 'italic';
}

export interface ImageContent {
  src: string;
  alt: string;
  objectFit: 'cover' | 'contain' | 'fill';
}

export interface ButtonContent {
  label: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
}

export interface BlockContent {
  backgroundColor: string;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
}

export type ElementContent = TextContent | ImageContent | ButtonContent | BlockContent;

export interface PageElement {
  id: string;
  sectionId: string;
  type: ElementType;
  content: ElementContent;
  layout: {
    desktop: LayoutProps;
    mobile: LayoutProps;
  };
  locked: boolean;
  visible: boolean;
}

export interface GridSettings {
  columns: number;
  rowHeight: number;
  gap: number;
  visible: boolean;
  snapStrength: 'off' | 'weak' | 'strong';
}

export interface Section {
  id: string;
  name: string;
  height: number;
  background: {
    type: 'color' | 'image';
    value: string;
  };
  grid: GridSettings;
  order: number;
}

export interface PageState {
  sections: Section[];
  elements: PageElement[];
  selectedElementIds: string[];
  selectedSectionId: string | null;
  breakpoint: Breakpoint;
  zoom: number;
  snapEnabled: boolean;
}

export interface SnapLine {
  type: 'vertical' | 'horizontal';
  position: number;
  label?: string;
  source: 'grid' | 'element' | 'section';
  strength: number;
}

export interface SnapResult {
  x: number;
  y: number;
  snappedX: boolean;
  snappedY: boolean;
  guides: SnapLine[];
  alignmentLabel?: string;
}

export interface SpacingIndicator {
  direction: 'horizontal' | 'vertical';
  value: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DragState {
  isDragging: boolean;
  elementIds: string[];
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  offsetX: number;
  offsetY: number;
}

export interface ResizeState {
  isResizing: boolean;
  elementId: string;
  handle: ResizeHandle;
  startBounds: { x: number; y: number; w: number; h: number };
  startMouseX: number;
  startMouseY: number;
  aspectRatio: number;
  fromCenter: boolean;
  lockAspect: boolean;
}

export type ResizeHandle =
  | 'n' | 's' | 'e' | 'w'
  | 'nw' | 'ne' | 'sw' | 'se';

export interface MarqueeState {
  isActive: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  sectionId: string;
}

export interface CollisionHint {
  elementId: string;
  overlapPercentage: number;
}

export interface HistoryEntry {
  sections: Section[];
  elements: PageElement[];
  selectedElementIds: string[];
  selectedSectionId: string | null;
}

export interface AlignmentBadge {
  type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
  x: number;
  y: number;
  expiresAt: number;
}
