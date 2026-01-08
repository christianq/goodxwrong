// Section inspector - shows section properties

import React from 'react';
import { usePageStore } from '../../store/pageStore';
import type { Section } from '../../types';
import './Inspector.css';

interface SectionInspectorProps {
  section: Section;
}

export const SectionInspector: React.FC<SectionInspectorProps> = ({ section }) => {
  const { updateSection, deleteSection, duplicateSection, sections } = usePageStore();

  const handleChange = <K extends keyof Section>(key: K, value: Section[K]) => {
    updateSection(section.id, { [key]: value });
  };

  const handleGridChange = <K extends keyof Section['grid']>(key: K, value: Section['grid'][K]) => {
    updateSection(section.id, {
      grid: { ...section.grid, [key]: value },
    });
  };

  const handleBackgroundChange = <K extends keyof Section['background']>(key: K, value: Section['background'][K]) => {
    updateSection(section.id, {
      background: { ...section.background, [key]: value },
    });
  };

  const handleDuplicate = () => {
    duplicateSection(section.id);
  };

  const handleDelete = () => {
    if (sections.length > 1) {
      deleteSection(section.id);
    }
  };

  return (
    <div className="section-inspector">
      <div className="inspector-section">
        <h3 className="inspector-section-title">Section</h3>
      </div>

      {/* Name */}
      <div className="inspector-section">
        <div className="inspector-field inspector-field--full">
          <label>Name</label>
          <input
            type="text"
            value={section.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>
      </div>

      {/* Height */}
      <div className="inspector-section">
        <div className="inspector-field inspector-field--full">
          <label>Height</label>
          <input
            type="number"
            value={section.height}
            onChange={(e) => handleChange('height', Number(e.target.value))}
            min={100}
            step={10}
          />
        </div>
      </div>

      {/* Background */}
      <div className="inspector-section">
        <h4 className="inspector-section-subtitle">Background</h4>
        <div className="inspector-field inspector-field--full">
          <label>Type</label>
          <select
            value={section.background.type}
            onChange={(e) => handleBackgroundChange('type', e.target.value as 'color' | 'image')}
          >
            <option value="color">Color</option>
            <option value="image">Image</option>
          </select>
        </div>
        {section.background.type === 'color' ? (
          <div className="inspector-field inspector-field--full">
            <label>Color</label>
            <div className="inspector-color">
              <input
                type="color"
                value={section.background.value}
                onChange={(e) => handleBackgroundChange('value', e.target.value)}
              />
              <input
                type="text"
                value={section.background.value}
                onChange={(e) => handleBackgroundChange('value', e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="inspector-field inspector-field--full">
            <label>Image URL</label>
            <input
              type="text"
              value={section.background.value}
              onChange={(e) => handleBackgroundChange('value', e.target.value)}
              placeholder="https://..."
            />
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="inspector-section">
        <h4 className="inspector-section-subtitle">Grid</h4>
        <div className="inspector-field inspector-field--full">
          <label className="inspector-checkbox">
            <input
              type="checkbox"
              checked={section.grid.visible}
              onChange={(e) => handleGridChange('visible', e.target.checked)}
            />
            <span>Show grid</span>
          </label>
        </div>
        <div className="inspector-grid">
          <div className="inspector-field">
            <label>Columns</label>
            <input
              type="number"
              value={section.grid.columns}
              onChange={(e) => handleGridChange('columns', Number(e.target.value))}
              min={1}
              max={24}
            />
          </div>
          <div className="inspector-field">
            <label>Row Height</label>
            <input
              type="number"
              value={section.grid.rowHeight}
              onChange={(e) => handleGridChange('rowHeight', Number(e.target.value))}
              min={10}
            />
          </div>
        </div>
        <div className="inspector-field inspector-field--full">
          <label>Gap</label>
          <input
            type="number"
            value={section.grid.gap}
            onChange={(e) => handleGridChange('gap', Number(e.target.value))}
            min={0}
          />
        </div>
        <div className="inspector-field inspector-field--full">
          <label>Snap Strength</label>
          <select
            value={section.grid.snapStrength}
            onChange={(e) => handleGridChange('snapStrength', e.target.value as Section['grid']['snapStrength'])}
          >
            <option value="off">Off</option>
            <option value="weak">Weak</option>
            <option value="strong">Strong</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="inspector-section">
        <div className="inspector-button-group">
          <button
            className="inspector-action-button"
            onClick={handleDuplicate}
            title="Duplicate this section"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="5" y="5" width="9" height="9" rx="1" />
              <path d="M2 11V3a1 1 0 011-1h8" strokeLinecap="round" />
            </svg>
            <span>Duplicate Section</span>
          </button>
        </div>
        {sections.length > 1 && (
          <button
            className="inspector-delete-button"
            onClick={handleDelete}
          >
            Delete Section
          </button>
        )}
      </div>
    </div>
  );
};
