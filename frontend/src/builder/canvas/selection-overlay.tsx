/**
 * Selection Overlay — Figma-style visual indicator for selected canvas nodes
 *
 * Renders precision outline borders, dimension badges (WxH),
 * and corner/edge resize handles over selected DOM elements.
 *
 * @module builder/canvas/selection-overlay
 */

'use client';

import React from 'react';

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

  const width = Math.round(rect.width);
  const height = Math.round(rect.height);

  return (
    <div
      style={{
        position: 'absolute',
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        border: '1.5px solid #2563eb',
        pointerEvents: 'none',
        boxSizing: 'border-box',
        zIndex: 50,
        transition: 'all 0.05s ease-out',
      }}
    >
      {/* Node label and dimension badge (Figma style) */}
      <div
        style={{
          position: 'absolute',
          top: '-24px',
          left: '0px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#2563eb',
          color: '#ffffff',
          fontSize: '0.6875rem',
          fontWeight: 600,
          fontFamily: 'system-ui, sans-serif',
          padding: '2px 8px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
          whiteSpace: 'nowrap',
          lineHeight: 1.2,
        }}
      >
        <span>{label || 'Element'}</span>
        <span style={{ opacity: 0.75, fontWeight: 400 }}>{width} × {height}</span>
        {isLocked && <span>🔒</span>}
      </div>

      {/* Resize corner and edge handles */}
      {!isLocked && width > 12 && height > 12 && (
        <>
          <div style={handleStyle('top-left')} />
          <div style={handleStyle('top-right')} />
          <div style={handleStyle('bottom-left')} />
          <div style={handleStyle('bottom-right')} />
          {width > 40 && height > 40 && (
            <>
              <div style={handleStyle('top-center')} />
              <div style={handleStyle('bottom-center')} />
              <div style={handleStyle('left-center')} />
              <div style={handleStyle('right-center')} />
            </>
          )}
        </>
      )}
    </div>
  );
}

function handleStyle(
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center' | 'left-center' | 'right-center'
): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    width: '7px',
    height: '7px',
    backgroundColor: '#ffffff',
    border: '1.5px solid #2563eb',
    borderRadius: '1px',
    boxSizing: 'border-box',
    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
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
    case 'top-center':
      return { ...base, top: '-4px', left: 'calc(50% - 3.5px)' };
    case 'bottom-center':
      return { ...base, bottom: '-4px', left: 'calc(50% - 3.5px)' };
    case 'left-center':
      return { ...base, top: 'calc(50% - 3.5px)', left: '-4px' };
    case 'right-center':
      return { ...base, top: 'calc(50% - 3.5px)', right: '-4px' };
  }
}
