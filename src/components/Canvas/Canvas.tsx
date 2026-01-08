// Main canvas component - contains all sections

import React, { useMemo } from 'react';
import { usePageStore } from '../../store/pageStore';
import { Section } from './Section';
import { AddSectionButton } from './AddSectionButton';
import './Canvas.css';

const DESKTOP_WIDTH = 1200;
const MOBILE_WIDTH = 375;

export const Canvas: React.FC = () => {
  const { sections, elements, breakpoint, zoom } = usePageStore();

  const canvasWidth = breakpoint === 'desktop' ? DESKTOP_WIDTH : MOBILE_WIDTH;

  // Sort sections by order
  const sortedSections = useMemo(() => {
    return [...sections].sort((a, b) => a.order - b.order);
  }, [sections]);

  // Group elements by section
  const elementsBySection = useMemo(() => {
    const map = new Map<string, typeof elements>();
    for (const section of sections) {
      map.set(section.id, []);
    }
    for (const element of elements) {
      const arr = map.get(element.sectionId);
      if (arr) {
        arr.push(element);
      }
    }
    return map;
  }, [sections, elements]);

  return (
    <div className="canvas-container">
      <div
        className="canvas-viewport"
        style={{
          width: canvasWidth,
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
        }}
      >
        {/* Add section button at top */}
        <AddSectionButton position="top" afterId={undefined} />

        {sortedSections.map((section) => (
          <React.Fragment key={section.id}>
            <Section
              section={section}
              elements={elementsBySection.get(section.id) || []}
              isActive={true}
              canvasWidth={canvasWidth}
            />
            {/* Add section button between sections */}
            <AddSectionButton position="between" afterId={section.id} />
          </React.Fragment>
        ))}

        {sortedSections.length === 0 && (
          <div className="canvas-empty">
            <p>No sections yet</p>
            <p>Click the + button above to add your first section</p>
          </div>
        )}
      </div>
    </div>
  );
};
