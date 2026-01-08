// Keyboard shortcuts hook

import { useEffect, useCallback } from 'react';
import { usePageStore } from '../store/pageStore';

export function useKeyboard() {
  const {
    selectedElementIds,
    nudgeElements,
    deleteSelectedElements,
    duplicateElements,
    undo,
    redo,
    breakpoint,
    pushHistory,
  } = usePageStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Cmd/Ctrl + Z
      if (cmdOrCtrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
      if ((cmdOrCtrl && e.key === 'z' && e.shiftKey) || (cmdOrCtrl && e.key === 'y')) {
        e.preventDefault();
        redo();
        return;
      }

      // Only process these if elements are selected
      if (selectedElementIds.length === 0) return;

      // Delete: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedElements();
        return;
      }

      // Duplicate: Cmd/Ctrl + D
      if (cmdOrCtrl && e.key === 'd') {
        e.preventDefault();
        duplicateElements(selectedElementIds);
        return;
      }

      // Arrow key nudge
      const nudgeAmount = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;

      switch (e.key) {
        case 'ArrowUp':
          dy = -nudgeAmount;
          break;
        case 'ArrowDown':
          dy = nudgeAmount;
          break;
        case 'ArrowLeft':
          dx = -nudgeAmount;
          break;
        case 'ArrowRight':
          dx = nudgeAmount;
          break;
        default:
          return;
      }

      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        if (!e.repeat) {
          pushHistory();
        }
        nudgeElements(selectedElementIds, dx, dy);
      }
    },
    [selectedElementIds, nudgeElements, deleteSelectedElements, duplicateElements, undo, redo, breakpoint, pushHistory]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
