// Geometry utility functions

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Point {
  x: number;
  y: number;
}

export function rectContainsPoint(rect: Rect, point: Point): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.w &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.h
  );
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.w < b.x ||
    b.x + b.w < a.x ||
    a.y + a.h < b.y ||
    b.y + b.h < a.y
  );
}

export function getIntersectionArea(a: Rect, b: Rect): number {
  const xOverlap = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const yOverlap = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return xOverlap * yOverlap;
}

export function getOverlapPercentage(a: Rect, b: Rect): number {
  const intersection = getIntersectionArea(a, b);
  const areaA = a.w * a.h;
  const areaB = b.w * b.h;
  const smallerArea = Math.min(areaA, areaB);
  return smallerArea > 0 ? (intersection / smallerArea) * 100 : 0;
}

export function getRectCenter(rect: Rect): Point {
  return {
    x: rect.x + rect.w / 2,
    y: rect.y + rect.h / 2,
  };
}

export function getRectEdges(rect: Rect) {
  return {
    left: rect.x,
    right: rect.x + rect.w,
    top: rect.y,
    bottom: rect.y + rect.h,
    centerX: rect.x + rect.w / 2,
    centerY: rect.y + rect.h / 2,
  };
}

export function expandRect(rect: Rect, amount: number): Rect {
  return {
    x: rect.x - amount,
    y: rect.y - amount,
    w: rect.w + amount * 2,
    h: rect.h + amount * 2,
  };
}

export function normalizeRect(x1: number, y1: number, x2: number, y2: number): Rect {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    w: Math.abs(x2 - x1),
    h: Math.abs(y2 - y1),
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
