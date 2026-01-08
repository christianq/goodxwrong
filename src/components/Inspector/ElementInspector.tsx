// Element inspector - shows element properties

import React from 'react';
import { usePageStore } from '../../store/pageStore';
import type { PageElement, TextContent, ImageContent, ButtonContent, BlockContent } from '../../types';
import './Inspector.css';

interface ElementInspectorProps {
  element: PageElement;
}

export const ElementInspector: React.FC<ElementInspectorProps> = ({ element }) => {
  const { breakpoint, updateElement, updateElementLayout, bringForward, sendBackward, bringToFront, sendToBack } = usePageStore();

  const layout = element.layout[breakpoint];

  const handleLayoutChange = (key: 'x' | 'y' | 'w' | 'h', value: number) => {
    updateElementLayout(element.id, breakpoint, { [key]: value });
  };

  const handleContentChange = <T extends object>(key: keyof T, value: T[keyof T]) => {
    updateElement(element.id, {
      content: { ...element.content, [key]: value },
    } as Partial<PageElement>);
  };

  return (
    <div className="element-inspector">
      <div className="inspector-section">
        <h3 className="inspector-section-title">
          {element.type.charAt(0).toUpperCase() + element.type.slice(1)}
        </h3>
      </div>

      {/* Position & Size */}
      <div className="inspector-section">
        <h4 className="inspector-section-subtitle">Position & Size</h4>
        <div className="inspector-grid">
          <div className="inspector-field">
            <label>X</label>
            <input
              type="number"
              value={Math.round(layout.x)}
              onChange={(e) => handleLayoutChange('x', Number(e.target.value))}
            />
          </div>
          <div className="inspector-field">
            <label>Y</label>
            <input
              type="number"
              value={Math.round(layout.y)}
              onChange={(e) => handleLayoutChange('y', Number(e.target.value))}
            />
          </div>
          <div className="inspector-field">
            <label>W</label>
            <input
              type="number"
              value={Math.round(layout.w)}
              onChange={(e) => handleLayoutChange('w', Number(e.target.value))}
            />
          </div>
          <div className="inspector-field">
            <label>H</label>
            <input
              type="number"
              value={Math.round(layout.h)}
              onChange={(e) => handleLayoutChange('h', Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Z-order */}
      <div className="inspector-section">
        <h4 className="inspector-section-subtitle">Layer Order</h4>
        <div className="inspector-button-group">
          <button onClick={() => sendToBack(element.id)} title="Send to back">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="6" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="6" y="2" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="white" />
            </svg>
          </button>
          <button onClick={() => sendBackward(element.id)} title="Send backward">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 8v4a1 1 0 01-1 1H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <polyline points="8 12 4 8 8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="rotate(90 8 8)" />
            </svg>
          </button>
          <button onClick={() => bringForward(element.id)} title="Bring forward">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 8V4a1 1 0 011-1h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <polyline points="8 4 12 8 8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-90 8 8)" />
            </svg>
          </button>
          <button onClick={() => bringToFront(element.id)} title="Bring to front">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="6" y="6" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="2" y="2" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="white" />
            </svg>
          </button>
        </div>
      </div>

      {/* Type-specific controls */}
      {element.type === 'text' && (
        <TextControls
          content={element.content as TextContent}
          onChange={handleContentChange}
        />
      )}

      {element.type === 'image' && (
        <ImageControls
          content={element.content as ImageContent}
          onChange={handleContentChange}
        />
      )}

      {element.type === 'button' && (
        <ButtonControls
          content={element.content as ButtonContent}
          onChange={handleContentChange}
        />
      )}

      {element.type === 'block' && (
        <BlockControls
          content={element.content as BlockContent}
          onChange={handleContentChange}
        />
      )}
    </div>
  );
};

interface TextControlsProps {
  content: TextContent;
  onChange: <T extends object>(key: keyof T, value: T[keyof T]) => void;
}

const TextControls: React.FC<TextControlsProps> = ({ content, onChange }) => (
  <div className="inspector-section">
    <h4 className="inspector-section-subtitle">Text</h4>
    <div className="inspector-field inspector-field--full">
      <label>Content</label>
      <textarea
        value={content.text}
        onChange={(e) => onChange<TextContent>('text', e.target.value)}
        rows={3}
      />
    </div>
    <div className="inspector-field inspector-field--full">
      <label>Font Family</label>
      <select
        value={content.fontFamily}
        onChange={(e) => onChange<TextContent>('fontFamily', e.target.value)}
        style={{ fontFamily: content.fontFamily }}
      >
        <optgroup label="System Fonts">
          <option value="system-ui, -apple-system, sans-serif">System UI</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="Helvetica, sans-serif">Helvetica</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="'Times New Roman', serif">Times New Roman</option>
          <option value="'Courier New', monospace">Courier New</option>
        </optgroup>
        <optgroup label="Google Fonts">
          <option value="'Inter', sans-serif">Inter</option>
          <option value="'Roboto', sans-serif">Roboto</option>
          <option value="'Open Sans', sans-serif">Open Sans</option>
          <option value="'Lato', sans-serif">Lato</option>
          <option value="'Montserrat', sans-serif">Montserrat</option>
          <option value="'Poppins', sans-serif">Poppins</option>
          <option value="'Playfair Display', serif">Playfair Display</option>
          <option value="'Merriweather', serif">Merriweather</option>
          <option value="'Oswald', sans-serif">Oswald</option>
          <option value="'Raleway', sans-serif">Raleway</option>
          <option value="'Source Sans Pro', sans-serif">Source Sans Pro</option>
          <option value="'Nunito', sans-serif">Nunito</option>
        </optgroup>
      </select>
    </div>
    <div className="inspector-grid">
      <div className="inspector-field">
        <label>Size</label>
        <input
          type="number"
          value={content.fontSize}
          onChange={(e) => onChange<TextContent>('fontSize', Number(e.target.value))}
        />
      </div>
      <div className="inspector-field">
        <label>Weight</label>
        <select
          value={content.fontWeight}
          onChange={(e) => onChange<TextContent>('fontWeight', Number(e.target.value))}
        >
          <option value={300}>Light</option>
          <option value={400}>Regular</option>
          <option value={500}>Medium</option>
          <option value={600}>Semibold</option>
          <option value={700}>Bold</option>
        </select>
      </div>
    </div>
    <div className="inspector-grid">
      <div className="inspector-field">
        <label>Line Height</label>
        <input
          type="number"
          step="0.1"
          min="0.5"
          max="3"
          value={content.lineHeight}
          onChange={(e) => onChange<TextContent>('lineHeight', Number(e.target.value))}
        />
      </div>
      <div className="inspector-field">
        <label>Letter Spacing</label>
        <input
          type="number"
          step="0.5"
          min="-5"
          max="10"
          value={content.letterSpacing}
          onChange={(e) => onChange<TextContent>('letterSpacing', Number(e.target.value))}
        />
      </div>
    </div>
    <div className="inspector-grid">
      <div className="inspector-field">
        <label>Align</label>
        <select
          value={content.textAlign}
          onChange={(e) => onChange<TextContent>('textAlign', e.target.value as TextContent['textAlign'])}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
          <option value="justify">Justify</option>
        </select>
      </div>
      <div className="inspector-field">
        <label>Style</label>
        <select
          value={content.fontStyle}
          onChange={(e) => onChange<TextContent>('fontStyle', e.target.value as TextContent['fontStyle'])}
        >
          <option value="normal">Normal</option>
          <option value="italic">Italic</option>
        </select>
      </div>
    </div>
    <div className="inspector-field inspector-field--full">
      <label>Decoration</label>
      <select
        value={content.textDecoration}
        onChange={(e) => onChange<TextContent>('textDecoration', e.target.value as TextContent['textDecoration'])}
      >
        <option value="none">None</option>
        <option value="underline">Underline</option>
        <option value="line-through">Line Through</option>
      </select>
    </div>
    <div className="inspector-field inspector-field--full">
      <label>Color</label>
      <div className="inspector-color">
        <input
          type="color"
          value={content.color}
          onChange={(e) => onChange<TextContent>('color', e.target.value)}
        />
        <input
          type="text"
          value={content.color}
          onChange={(e) => onChange<TextContent>('color', e.target.value)}
        />
      </div>
    </div>
  </div>
);

interface ImageControlsProps {
  content: ImageContent;
  onChange: <T extends object>(key: keyof T, value: T[keyof T]) => void;
}

const ImageControls: React.FC<ImageControlsProps> = ({ content, onChange }) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onChange<ImageContent>('src', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="inspector-section">
      <h4 className="inspector-section-subtitle">Image</h4>
      <div className="inspector-field inspector-field--full">
        <label>Upload Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{
            padding: '8px',
            fontSize: '13px',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            width: '100%',
          }}
        />
      </div>
      <div className="inspector-field inspector-field--full">
        <label>Source URL</label>
        <input
          type="text"
          value={content.src}
          onChange={(e) => onChange<ImageContent>('src', e.target.value)}
          placeholder="https://... or upload file above"
        />
      </div>
      <div className="inspector-field inspector-field--full">
        <label>Alt Text</label>
        <input
          type="text"
          value={content.alt}
          onChange={(e) => onChange<ImageContent>('alt', e.target.value)}
        />
      </div>
      <div className="inspector-field inspector-field--full">
        <label>Fit</label>
        <select
          value={content.objectFit}
          onChange={(e) => onChange<ImageContent>('objectFit', e.target.value as ImageContent['objectFit'])}
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
          <option value="fill">Fill</option>
        </select>
      </div>
    </div>
  );
};

interface ButtonControlsProps {
  content: ButtonContent;
  onChange: <T extends object>(key: keyof T, value: T[keyof T]) => void;
}

const ButtonControls: React.FC<ButtonControlsProps> = ({ content, onChange }) => (
  <div className="inspector-section">
    <h4 className="inspector-section-subtitle">Button</h4>
    <div className="inspector-field inspector-field--full">
      <label>Label</label>
      <input
        type="text"
        value={content.label}
        onChange={(e) => onChange<ButtonContent>('label', e.target.value)}
      />
    </div>
    <div className="inspector-field inspector-field--full">
      <label>Background</label>
      <div className="inspector-color">
        <input
          type="color"
          value={content.backgroundColor}
          onChange={(e) => onChange<ButtonContent>('backgroundColor', e.target.value)}
        />
        <input
          type="text"
          value={content.backgroundColor}
          onChange={(e) => onChange<ButtonContent>('backgroundColor', e.target.value)}
        />
      </div>
    </div>
    <div className="inspector-field inspector-field--full">
      <label>Text Color</label>
      <div className="inspector-color">
        <input
          type="color"
          value={content.textColor}
          onChange={(e) => onChange<ButtonContent>('textColor', e.target.value)}
        />
        <input
          type="text"
          value={content.textColor}
          onChange={(e) => onChange<ButtonContent>('textColor', e.target.value)}
        />
      </div>
    </div>
    <div className="inspector-field inspector-field--full">
      <label>Border Radius</label>
      <input
        type="number"
        value={content.borderRadius}
        onChange={(e) => onChange<ButtonContent>('borderRadius', Number(e.target.value))}
      />
    </div>
  </div>
);

interface BlockControlsProps {
  content: BlockContent;
  onChange: <T extends object>(key: keyof T, value: T[keyof T]) => void;
}

const BlockControls: React.FC<BlockControlsProps> = ({ content, onChange }) => (
  <div className="inspector-section">
    <h4 className="inspector-section-subtitle">Block</h4>
    <div className="inspector-field inspector-field--full">
      <label>Background</label>
      <div className="inspector-color">
        <input
          type="color"
          value={content.backgroundColor}
          onChange={(e) => onChange<BlockContent>('backgroundColor', e.target.value)}
        />
        <input
          type="text"
          value={content.backgroundColor}
          onChange={(e) => onChange<BlockContent>('backgroundColor', e.target.value)}
        />
      </div>
    </div>
    <div className="inspector-grid">
      <div className="inspector-field">
        <label>Radius</label>
        <input
          type="number"
          value={content.borderRadius}
          onChange={(e) => onChange<BlockContent>('borderRadius', Number(e.target.value))}
        />
      </div>
      <div className="inspector-field">
        <label>Border</label>
        <input
          type="number"
          value={content.borderWidth}
          onChange={(e) => onChange<BlockContent>('borderWidth', Number(e.target.value))}
        />
      </div>
    </div>
    {content.borderWidth > 0 && (
      <div className="inspector-field inspector-field--full">
        <label>Border Color</label>
        <div className="inspector-color">
          <input
            type="color"
            value={content.borderColor}
            onChange={(e) => onChange<BlockContent>('borderColor', e.target.value)}
          />
          <input
            type="text"
            value={content.borderColor}
            onChange={(e) => onChange<BlockContent>('borderColor', e.target.value)}
          />
        </div>
      </div>
    )}
  </div>
);
