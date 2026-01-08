// Section rail - left panel for reordering sections

import React, { useRef, useState, useCallback } from 'react';
import { usePageStore } from '../../store/pageStore';
import './SectionRail.css';

export const SectionRail: React.FC = () => {
  const { sections, selectedSectionId, selectSection, reorderSections } = usePageStore();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragIndex !== null && dropIndex !== null && dragIndex !== dropIndex) {
      reorderSections(dragIndex, dropIndex);
    }
    setDragIndex(null);
    setDropIndex(null);
  }, [dragIndex, dropIndex, reorderSections]);

  const handleClick = useCallback((sectionId: string) => {
    selectSection(sectionId);
  }, [selectSection]);

  return (
    <div className="section-rail" ref={railRef}>
      <div className="section-rail-header">
        <span>Sections</span>
      </div>
      <div className="section-rail-list">
        {sortedSections.map((section, index) => (
          <div
            key={section.id}
            className={`section-rail-item ${selectedSectionId === section.id ? 'section-rail-item--selected' : ''} ${dragIndex === index ? 'section-rail-item--dragging' : ''} ${dropIndex === index && dragIndex !== index ? 'section-rail-item--drop-target' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => handleClick(section.id)}
          >
            <div className="section-rail-handle">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <circle cx="3" cy="3" r="1.5" />
                <circle cx="9" cy="3" r="1.5" />
                <circle cx="3" cy="9" r="1.5" />
                <circle cx="9" cy="9" r="1.5" />
              </svg>
            </div>
            <div className="section-rail-content">
              <span className="section-rail-name">{section.name}</span>
              <span className="section-rail-height">{section.height}px</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
