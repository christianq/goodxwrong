// Inspector panel - shows properties for selected element or section

import React from 'react';
import { usePageStore } from '../../store/pageStore';
import { ElementInspector } from './ElementInspector';
import { SectionInspector } from './SectionInspector';
import './Inspector.css';

export const Inspector: React.FC = () => {
  const {
    selectedElementIds,
    selectedSectionId,
    elements,
    sections,
    breakpoint,
  } = usePageStore();

  // Get selected element (only show inspector for single selection)
  const selectedElement = selectedElementIds.length === 1
    ? elements.find((e) => e.id === selectedElementIds[0])
    : null;

  // Get selected section
  const selectedSection = selectedSectionId
    ? sections.find((s) => s.id === selectedSectionId)
    : null;

  return (
    <div className="inspector">
      <div className="inspector-header">
        <h2>Inspector</h2>
        <span className="inspector-breakpoint">{breakpoint}</span>
      </div>

      <div className="inspector-content">
        {selectedElement && (
          <ElementInspector element={selectedElement} />
        )}

        {selectedSection && !selectedElement && (
          <SectionInspector section={selectedSection} />
        )}

        {!selectedElement && !selectedSection && (
          <div className="inspector-empty">
            <p>Select an element or section to edit its properties</p>
          </div>
        )}

        {selectedElementIds.length > 1 && (
          <div className="inspector-multi">
            <p>{selectedElementIds.length} elements selected</p>
            <p className="inspector-hint">Select a single element to edit properties</p>
          </div>
        )}
      </div>
    </div>
  );
};
