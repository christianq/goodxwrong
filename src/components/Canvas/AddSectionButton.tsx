// Add section button that appears between sections

import React from 'react';
import { usePageStore } from '../../store/pageStore';
import './Canvas.css';

interface AddSectionButtonProps {
  position: 'top' | 'between';
  afterId?: string;
}

export const AddSectionButton: React.FC<AddSectionButtonProps> = ({ position, afterId }) => {
  const { addSection } = usePageStore();

  const handleClick = () => {
    addSection(afterId);
  };

  return (
    <div className={`add-section-container add-section-container--${position}`}>
      <button
        className="add-section-button"
        onClick={handleClick}
        aria-label="Add section"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 3v10M3 8h10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <span>Add Section</span>
      </button>
    </div>
  );
};
