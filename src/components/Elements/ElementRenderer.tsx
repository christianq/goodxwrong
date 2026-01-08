// Element content renderer based on type

import React from 'react';
import type { PageElement, TextContent, ImageContent, ButtonContent, BlockContent } from '../../types';
import './Elements.css';

interface ElementRendererProps {
  element: PageElement;
  isEditing?: boolean;
}

export const ElementRenderer: React.FC<ElementRendererProps> = ({ element, isEditing }) => {
  switch (element.type) {
    case 'text':
      return <TextElement content={element.content as TextContent} isEditing={isEditing} />;
    case 'image':
      return <ImageElement content={element.content as ImageContent} />;
    case 'button':
      return <ButtonElement content={element.content as ButtonContent} />;
    case 'block':
      return <BlockElement content={element.content as BlockContent} />;
    default:
      return null;
  }
};

interface TextElementProps {
  content: TextContent;
  isEditing?: boolean;
}

const TextElement: React.FC<TextElementProps> = ({ content }) => {
  return (
    <div
      className="element-text"
      style={{
        fontSize: content.fontSize,
        fontWeight: content.fontWeight,
        color: content.color,
        fontFamily: content.fontFamily,
        lineHeight: content.lineHeight,
        letterSpacing: `${content.letterSpacing}px`,
        textAlign: content.textAlign,
        textDecoration: content.textDecoration,
        fontStyle: content.fontStyle,
      }}
    >
      {content.text}
    </div>
  );
};

interface ImageElementProps {
  content: ImageContent;
}

const ImageElement: React.FC<ImageElementProps> = ({ content }) => {
  if (content.src) {
    return (
      <img
        className="element-image"
        src={content.src}
        alt={content.alt}
        style={{ objectFit: content.objectFit }}
      />
    );
  }

  return (
    <div className="element-image-placeholder">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
      <span>Image</span>
    </div>
  );
};

interface ButtonElementProps {
  content: ButtonContent;
}

const ButtonElement: React.FC<ButtonElementProps> = ({ content }) => {
  return (
    <button
      className="element-button"
      style={{
        backgroundColor: content.backgroundColor,
        color: content.textColor,
        borderRadius: content.borderRadius,
      }}
    >
      {content.label}
    </button>
  );
};

interface BlockElementProps {
  content: BlockContent;
}

const BlockElement: React.FC<BlockElementProps> = ({ content }) => {
  return (
    <div
      className="element-block"
      style={{
        backgroundColor: content.backgroundColor,
        borderRadius: content.borderRadius,
        borderWidth: content.borderWidth,
        borderColor: content.borderColor,
        borderStyle: content.borderWidth > 0 ? 'solid' : 'none',
      }}
    />
  );
};
