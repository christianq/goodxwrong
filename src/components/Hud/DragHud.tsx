// HUD display during drag/resize showing position and dimensions

import React from 'react';
import './Hud.css';

interface DragHudProps {
  x: number;
  y: number;
  w?: number;
  h?: number;
  cursorX: number;
  cursorY: number;
  visible: boolean;
}

export const DragHud: React.FC<DragHudProps> = ({
  x,
  y,
  w,
  h,
  cursorX,
  cursorY,
  visible,
}) => {
  if (!visible) return null;

  return (
    <div
      className="drag-hud"
      style={{
        left: cursorX + 16,
        top: cursorY + 16,
      }}
    >
      <div className="drag-hud-row">
        <span className="drag-hud-label">X:</span>
        <span className="drag-hud-value">{Math.round(x)}</span>
        <span className="drag-hud-label">Y:</span>
        <span className="drag-hud-value">{Math.round(y)}</span>
      </div>
      {w !== undefined && h !== undefined && (
        <div className="drag-hud-row">
          <span className="drag-hud-label">W:</span>
          <span className="drag-hud-value">{Math.round(w)}</span>
          <span className="drag-hud-label">H:</span>
          <span className="drag-hud-value">{Math.round(h)}</span>
        </div>
      )}
    </div>
  );
};
