// Smart guides overlay - shows snap lines, spacing indicators, etc.

import React from 'react';
import type { SnapLine, SpacingIndicator, CollisionHint, AlignmentBadge } from '../../types';
import './SmartGuides.css';

interface SmartGuidesProps {
  guides: SnapLine[];
  spacingIndicators: SpacingIndicator[];
  collisionHints: CollisionHint[];
  alignmentBadge: AlignmentBadge | null;
  sectionHeight: number;
  sectionWidth: number;
}

export const SmartGuides: React.FC<SmartGuidesProps> = ({
  guides,
  spacingIndicators,
  collisionHints: _collisionHints,
  alignmentBadge,
  sectionHeight,
  sectionWidth,
}) => {
  // collisionHints reserved for future visual indicators
  void _collisionHints;
  return (
    <svg
      className="smart-guides-overlay"
      width={sectionWidth}
      height={sectionHeight}
      style={{ pointerEvents: 'none' }}
    >
      {/* Snap lines */}
      {guides.map((guide, index) => {
        const isVertical = guide.type === 'vertical';
        const brightness = 0.5 + guide.strength * 0.5;

        return (
          <g key={`guide-${index}`}>
            <line
              className={`snap-line snap-line--${guide.source}`}
              x1={isVertical ? guide.position : 0}
              y1={isVertical ? 0 : guide.position}
              x2={isVertical ? guide.position : sectionWidth}
              y2={isVertical ? sectionHeight : guide.position}
              style={{
                opacity: brightness,
                filter: guide.strength > 0.8 ? 'drop-shadow(0 0 2px var(--snap-color))' : undefined,
              }}
            />
            {guide.label && (
              <text
                className="snap-label"
                x={isVertical ? guide.position + 4 : sectionWidth / 2}
                y={isVertical ? 16 : guide.position - 4}
                style={{ opacity: brightness }}
              >
                {guide.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Spacing indicators */}
      {spacingIndicators.map((indicator, index) => {
        const isHorizontal = indicator.direction === 'horizontal';
        const midX = indicator.x + indicator.width / 2;
        const midY = indicator.y + indicator.height / 2;

        return (
          <g key={`spacing-${index}`} className="spacing-indicator">
            {/* Line */}
            <line
              x1={isHorizontal ? indicator.x : midX}
              y1={isHorizontal ? midY : indicator.y}
              x2={isHorizontal ? indicator.x + indicator.width : midX}
              y2={isHorizontal ? midY : indicator.y + indicator.height}
              className="spacing-line"
            />
            {/* Caps */}
            {isHorizontal ? (
              <>
                <line
                  x1={indicator.x}
                  y1={midY - 4}
                  x2={indicator.x}
                  y2={midY + 4}
                  className="spacing-cap"
                />
                <line
                  x1={indicator.x + indicator.width}
                  y1={midY - 4}
                  x2={indicator.x + indicator.width}
                  y2={midY + 4}
                  className="spacing-cap"
                />
              </>
            ) : (
              <>
                <line
                  x1={midX - 4}
                  y1={indicator.y}
                  x2={midX + 4}
                  y2={indicator.y}
                  className="spacing-cap"
                />
                <line
                  x1={midX - 4}
                  y1={indicator.y + indicator.height}
                  x2={midX + 4}
                  y2={indicator.y + indicator.height}
                  className="spacing-cap"
                />
              </>
            )}
            {/* Label */}
            <rect
              x={midX - 14}
              y={midY - 10}
              width={28}
              height={20}
              rx={4}
              className="spacing-badge-bg"
            />
            <text x={midX} y={midY + 4} className="spacing-badge-text">
              {indicator.value}
            </text>
          </g>
        );
      })}

      {/* Alignment badge */}
      {alignmentBadge && (
        <g className="alignment-badge" style={{ animation: 'fadeInOut 0.5s ease-out' }}>
          <rect
            x={alignmentBadge.x - 30}
            y={alignmentBadge.y - 10}
            width={60}
            height={20}
            rx={4}
            fill="#2563eb"
          />
          <text
            x={alignmentBadge.x}
            y={alignmentBadge.y + 4}
            fill="white"
            fontSize="11"
            fontWeight="500"
            textAnchor="middle"
          >
            {alignmentBadge.type}
          </text>
        </g>
      )}
    </svg>
  );
};
