/**
 * Drop Indicator — Visual insertion feedback during drag-and-drop
 *
 * Renders a glowing insertion line or box where a block will be dropped.
 *
 * @module builder/canvas/drop-indicator
 */

'use client';

import React from 'react';

export interface DropIndicatorProps {
  /** Target coordinates and dimensions relative to canvas. */
  rect: DOMRect | null;
  /** Position relative to target node: 'before' | 'after' | 'inside'. */
  position?: 'before' | 'after' | 'inside';
}

export function DropIndicator({ rect, position = 'after' }: DropIndicatorProps) {
  if (!rect) return null;

  if (position === 'inside') {
    return (
      <div
        style={{
          position: 'absolute',
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          border: '2px dashed #22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.05)',
          pointerEvents: 'none',
          zIndex: 60,
          boxSizing: 'border-box',
          borderRadius: '4px',
        }}
      />
    );
  }

  const top = position === 'before' ? rect.top - 2 : rect.top + rect.height - 2;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${rect.left}px`,
        top: `${top}px`,
        width: `${rect.width}px`,
        height: '4px',
        backgroundColor: '#22c55e',
        boxShadow: '0 0 8px rgba(34, 197, 94, 0.8)',
        pointerEvents: 'none',
        zIndex: 60,
        borderRadius: '2px',
      }}
    />
  );
}
