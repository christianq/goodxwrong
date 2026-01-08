// Top toolbar - add elements, toggle breakpoint, zoom, undo/redo, export

import React, { useCallback, useRef } from 'react';
import { usePageStore } from '../../store/pageStore';
import type { ElementType } from '../../types';
import './Toolbar.css';

export const Toolbar: React.FC = () => {
  const {
    breakpoint,
    setBreakpoint,
    zoom,
    setZoom,
    snapEnabled,
    setSnapEnabled,
    selectedSectionId,
    sections,
    elements,
    addElement,
    undo,
    redo,
    history,
    historyIndex,
    exportPage,
    importPage,
  } = usePageStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddElement = useCallback((type: ElementType) => {
    // Add to first section if none selected
    const sectionId = selectedSectionId || sections[0]?.id;
    if (sectionId) {
      addElement(sectionId, type);
    }
  }, [selectedSectionId, sections, addElement]);

  const handleExport = useCallback(() => {
    const json = exportPage();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'page.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [exportPage]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const json = event.target?.result as string;
        importPage(json);
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  }, [importPage]);

  const handlePreview = useCallback(() => {
    // Generate HTML from current page state
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;600;700&family=Lato:wght@300;400;700&family=Montserrat:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Merriweather:wght@300;400;700&family=Oswald:wght@300;400;500;600;700&family=Raleway:wght@300;400;500;600;700&family=Source+Sans+Pro:wght@300;400;600;700&family=Nunito:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .page-container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
    }
    .section {
      position: relative;
      width: 100%;
    }
    .section-inner {
      position: relative;
      max-width: 1200px;
      margin: 0 auto;
      height: 100%;
    }
    .element { position: absolute; }
    .element-text {
      word-wrap: break-word;
      overflow-wrap: break-word;
      overflow: hidden;
      padding: 4px;
      box-sizing: border-box;
    }
    .element-image { width: 100%; height: 100%; object-fit: cover; display: block; }
    .element-button {
      width: 100%;
      height: 100%;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: filter 0.15s ease;
    }
    .element-button:hover { filter: brightness(1.1); }
    .element-block { width: 100%; height: 100%; }
    @media (max-width: 768px) {
      .desktop-only { display: none !important; }
      .page-container { max-width: 100%; }
      .section-inner { max-width: 100%; padding: 0 20px; }
    }
    @media (min-width: 769px) { .mobile-only { display: none !important; } }
  </style>
</head>
<body>
  <div class="page-container">
${sections.map(section => {
  const sectionElements = elements.filter(el => el.sectionId === section.id);
  return `    <div class="section" style="height: ${section.height}px; background: ${section.background.type === 'color' ? section.background.value : `url(${section.background.value}) center/cover`};">
      <div class="section-inner">
${sectionElements.map(el => {
      const layoutDesktop = el.layout.desktop;
      const layoutMobile = el.layout.mobile;

      let content = '';
      if (el.type === 'text') {
        const c = el.content as any;
        content = `<div class="element-text" style="font-size: ${c.fontSize}px; font-weight: ${c.fontWeight}; color: ${c.color}; font-family: ${c.fontFamily}; line-height: ${c.lineHeight}; letter-spacing: ${c.letterSpacing}px; text-align: ${c.textAlign}; text-decoration: ${c.textDecoration}; font-style: ${c.fontStyle};">${c.text}</div>`;
      } else if (el.type === 'image') {
        const c = el.content as any;
        content = c.src ? `<img class="element-image" src="${c.src}" alt="${c.alt}" style="object-fit: ${c.objectFit};">` : '<div class="element-image" style="background: #f1f5f9; border: 2px dashed #cbd5e1;"></div>';
      } else if (el.type === 'button') {
        const c = el.content as any;
        content = `<button class="element-button" style="background-color: ${c.backgroundColor}; color: ${c.textColor}; border-radius: ${c.borderRadius}px;">${c.label}</button>`;
      } else if (el.type === 'block') {
        const c = el.content as any;
        content = `<div class="element-block" style="background-color: ${c.backgroundColor}; border-radius: ${c.borderRadius}px; border: ${c.borderWidth}px solid ${c.borderColor};"></div>`;
      }

      return `        <div class="element desktop-only" style="left: ${layoutDesktop.x}px; top: ${layoutDesktop.y}px; width: ${layoutDesktop.w}px; height: ${layoutDesktop.h}px; z-index: ${layoutDesktop.z};">
          ${content}
        </div>
        <div class="element mobile-only" style="left: ${layoutMobile.x}px; top: ${layoutMobile.y}px; width: ${layoutMobile.w}px; height: ${layoutMobile.h}px; z-index: ${layoutMobile.z};">
          ${content}
        </div>`;
    }).join('\n')}
      </div>
    </div>`;
}).join('\n')}
  </div>
</body>
</html>`;

    // Open in new window
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(html);
      previewWindow.document.close();
    }
  }, [sections, elements]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <span className="toolbar-logo">Fluid Engine</span>
      </div>

      <div className="toolbar-section toolbar-section--elements">
        <span className="toolbar-label">Add:</span>
        <button
          className="toolbar-button"
          onClick={() => handleAddElement('text')}
          title="Add Text (T)"
          disabled={sections.length === 0}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3h10M8 3v10M6 13h4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Text</span>
        </button>
        <button
          className="toolbar-button"
          onClick={() => handleAddElement('image')}
          title="Add Image (I)"
          disabled={sections.length === 0}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="2" width="12" height="12" rx="1.5" />
            <circle cx="6" cy="6" r="1.5" fill="currentColor" />
            <path d="M14 11l-3.5-3.5L8 10l-2.5-2.5L2 11" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Image</span>
        </button>
        <button
          className="toolbar-button"
          onClick={() => handleAddElement('button')}
          title="Add Button (B)"
          disabled={sections.length === 0}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="5" width="12" height="6" rx="3" />
            <path d="M5.5 8h5" strokeLinecap="round" />
          </svg>
          <span>Button</span>
        </button>
        <button
          className="toolbar-button"
          onClick={() => handleAddElement('block')}
          title="Add Block (S)"
          disabled={sections.length === 0}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="2" width="12" height="12" rx="2" />
            <path d="M2 6h12M6 2v12" />
          </svg>
          <span>Block</span>
        </button>
      </div>

      <div className="toolbar-section toolbar-section--actions">
        <div className="toolbar-divider" />

        <button
          className="toolbar-button toolbar-button--icon"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Cmd+Z)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 6h6a3 3 0 013 3v0a3 3 0 01-3 3H7" strokeLinecap="round" />
            <path d="M7 3L4 6l3 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          className="toolbar-button toolbar-button--icon"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Cmd+Shift+Z)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 6H6a3 3 0 00-3 3v0a3 3 0 003 3h3" strokeLinecap="round" />
            <path d="M9 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="toolbar-divider" />

        <button
          className={`toolbar-button toolbar-button--toggle ${snapEnabled ? 'toolbar-button--active' : ''}`}
          onClick={() => {
            console.log('Snap toggle clicked. Current:', snapEnabled, 'Setting to:', !snapEnabled);
            setSnapEnabled(!snapEnabled);
          }}
          title={`Toggle Snap to Grid (Currently: ${snapEnabled ? 'ON' : 'OFF'})`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            {snapEnabled ? (
              <>
                <circle cx="3" cy="3" r="1" fill="currentColor" />
                <circle cx="8" cy="3" r="1" fill="currentColor" />
                <circle cx="13" cy="3" r="1" fill="currentColor" />
                <circle cx="3" cy="8" r="1" fill="currentColor" />
                <circle cx="8" cy="8" r="1" fill="currentColor" />
                <circle cx="13" cy="8" r="1" fill="currentColor" />
                <circle cx="3" cy="13" r="1" fill="currentColor" />
                <circle cx="8" cy="13" r="1" fill="currentColor" />
                <circle cx="13" cy="13" r="1" fill="currentColor" />
                <rect x="9.5" y="9.5" width="4" height="4" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1" />
              </>
            ) : (
              <>
                <circle cx="3" cy="3" r="0.5" fill="currentColor" opacity="0.3" />
                <circle cx="8" cy="3" r="0.5" fill="currentColor" opacity="0.3" />
                <circle cx="13" cy="3" r="0.5" fill="currentColor" opacity="0.3" />
                <circle cx="3" cy="8" r="0.5" fill="currentColor" opacity="0.3" />
                <circle cx="8" cy="8" r="0.5" fill="currentColor" opacity="0.3" />
                <circle cx="13" cy="8" r="0.5" fill="currentColor" opacity="0.3" />
                <circle cx="3" cy="13" r="0.5" fill="currentColor" opacity="0.3" />
                <circle cx="8" cy="13" r="0.5" fill="currentColor" opacity="0.3" />
                <circle cx="13" cy="13" r="0.5" fill="currentColor" opacity="0.3" />
                <line x1="2" y1="14" x2="14" y2="2" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
              </>
            )}
          </svg>
          <span>Snap</span>
        </button>

        <div className="toolbar-divider" />

        <div className="toolbar-breakpoint">
          <button
            className={`toolbar-breakpoint-btn ${breakpoint === 'desktop' ? 'toolbar-breakpoint-btn--active' : ''}`}
            onClick={() => setBreakpoint('desktop')}
            title="Desktop view"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="2" width="14" height="9" rx="1" />
              <path d="M5 14h6M8 11v3" strokeLinecap="round" />
            </svg>
          </button>
          <button
            className={`toolbar-breakpoint-btn ${breakpoint === 'mobile' ? 'toolbar-breakpoint-btn--active' : ''}`}
            onClick={() => setBreakpoint('mobile')}
            title="Mobile view"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="5" y="1" width="6" height="14" rx="1" />
              <path d="M7 13h2" strokeLinecap="round" strokeWidth="1.5" />
            </svg>
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-zoom">
          <button
            className="toolbar-zoom-btn"
            onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
            title="Zoom out"
          >
            −
          </button>
          <span className="toolbar-zoom-value">{Math.round(zoom * 100)}%</span>
          <button
            className="toolbar-zoom-btn"
            onClick={() => setZoom(Math.min(2, zoom + 0.25))}
            title="Zoom in"
          >
            +
          </button>
        </div>

        <div className="toolbar-divider" />

        <button
          className="toolbar-button"
          onClick={handlePreview}
          title="Preview page in new window"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="3" />
            <path d="M2 8s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Preview</span>
        </button>

        <div className="toolbar-divider" />

        <button
          className="toolbar-button"
          onClick={handleImport}
          title="Import page"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 10v3a1 1 0 01-1 1H3a1 1 0 01-1-1v-3" strokeLinecap="round" />
            <path d="M8 2v8M5 7l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Import</span>
        </button>
        <button
          className="toolbar-button"
          onClick={handleExport}
          title="Export page"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 10v3a1 1 0 01-1 1H3a1 1 0 01-1-1v-3" strokeLinecap="round" />
            <path d="M8 10V2M5 5l3-3 3 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Export</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};
