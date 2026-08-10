/**
 * Selection Overlay — Visual indicator for selected canvas nodes
 *
 * Renders outline borders and resize handles over selected DOM elements inside the canvas.
 *
 * @module builder/canvas/selection-overlay
 */

'use client';

import React from 'react';
import type { NodeId } from '../schema/document';

export interface SelectionOverlayProps {
  /** Rect of the selected element relative to canvas container. */
  rect: DOMRect | null;
  /** Primary node label/name. */
  label?: string;
  /** Whether the node is locked. */
  isLocked?: boolean;
}

export function SelectionOverlay({ rect, label, isLocked }: SelectionOverlayProps) {
  if (!rect) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        border: '2px solid #6366f1',
        pointerEvents: 'none',
        boxSizing: 'border-box',
        zIndex: 50,
        transition: 'all 0.05s ease-out',
      }}
    >
      {/* Node label badge */}
      {label && (
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            left: '-2px',
            backgroundColor: '#6366f1',
            color: '#ffffff',
            fontSize: '0.625rem',
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: '2px 2px 0 0',
            whiteSpace: 'nowrap',
            lineHeight: 1,
          }}
        >
          {label} {isLocked ? '🔒' : ''}
        </div>
      )}

      {/* Resize corner handles */}
      {!isLocked && (
        <>
          <div style={handleStyle('top-left')} />
          <div style={handleStyle('top-right')} />
          <div style={handleStyle('bottom-left')} />
          <div style={handleStyle('bottom-right')} />
        </>
      )}
    </div>
  );
}

function handleStyle(position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    width: '8px',
    height: '8px',
    backgroundColor: '#ffffff',
    border: '2px solid #6366f1',
    borderRadius: '1px',
    boxSizing: 'border-box',
  };

  switch (position) {
    case 'top-left':
      return { ...base, top: '-4px', left: '-4px' };
    case 'top-right':
      return { ...base, top: '-4px', right: '-4px' };
    case 'bottom-left':
      return { ...base, bottom: '-4px', left: '-4px' };
    case 'bottom-right':
      return { ...base, bottom: '-4px', right: '-4px' };
  }
}
