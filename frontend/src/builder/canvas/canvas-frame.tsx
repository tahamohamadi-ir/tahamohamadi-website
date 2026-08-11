/**
 * Canvas Frame — Isolated viewport container for builder document rendering
 *
 * Provides responsive viewport scaling, selection overlay integration,
 * and style isolation boundary for the page builder.
 *
 * @module builder/canvas/canvas-frame
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { PageDocument, NodeId } from '../schema/document';
import { PageRenderer } from '../renderer';
import { SelectionOverlay } from './selection-overlay';

export interface CanvasFrameProps {
  document: PageDocument;
  isEditor: boolean;
  selectedNodeIds: NodeId[];
  hoveredNodeId?: NodeId | null;
  onNodeClick: (nodeId: NodeId, e: React.MouseEvent) => void;
  onNodeHover: (nodeId: NodeId | null) => void;
  onUpdateProps?: (nodeId: NodeId, patch: Record<string, unknown>) => void;
  viewportWidth?: string | number;
}

export const CanvasFrame = React.memo(function CanvasFrame({
  document,
  isEditor,
  selectedNodeIds,
  onNodeClick,
  onNodeHover,
  onUpdateProps,
  viewportWidth = '100%',
}: CanvasFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [primaryRect, setPrimaryRect] = useState<DOMRect | null>(null);
  const [primaryNodeName, setPrimaryNodeName] = useState<string>('');

  const primaryId = selectedNodeIds[selectedNodeIds.length - 1];

  // Measure selected element relative to container
  const updateSelectionOverlay = useCallback(() => {
    if (!primaryId || !containerRef.current) {
      setPrimaryRect(null);
      return;
    }

    const element = containerRef.current.querySelector(`[data-builder-node="${primaryId}"], [data-node-id="${primaryId}"]`);
    if (!element) {
      setPrimaryRect(null);
      return;
    }

    const containerBounds = containerRef.current.getBoundingClientRect();
    const elemBounds = element.getBoundingClientRect();

    setPrimaryRect(new DOMRect(
      elemBounds.left - containerBounds.left + containerRef.current.scrollLeft,
      elemBounds.top - containerBounds.top + containerRef.current.scrollTop,
      elemBounds.width,
      elemBounds.height,
    ));

    const node = document.nodes[primaryId];
    if (node) {
      setPrimaryNodeName(node.metadata?.name || node.type);
    }
  }, [primaryId, document.nodes]);

  useEffect(() => {
    updateSelectionOverlay();
    window.addEventListener('resize', updateSelectionOverlay);
    window.addEventListener('scroll', updateSelectionOverlay, true);
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', updateSelectionOverlay);
    }
    return () => {
      window.removeEventListener('resize', updateSelectionOverlay);
      window.removeEventListener('scroll', updateSelectionOverlay, true);
      if (container) {
        container.removeEventListener('scroll', updateSelectionOverlay);
      }
    };
  }, [updateSelectionOverlay, document]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', position: 'relative' }}>
      {isEditor && (
        <div
          style={{
            alignSelf: 'flex-start',
            marginInlineStart: 'auto',
            marginInlineEnd: 'auto',
            maxWidth: '1200px',
            width: viewportWidth,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
            color: '#9ca3af',
            fontSize: '0.75rem',
            fontWeight: 600,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#60a5fa', fontWeight: 700 }}># Page</span>
            <span style={{ backgroundColor: '#374151', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6875rem' }}>
              {typeof viewportWidth === 'number' ? `${viewportWidth}px` : viewportWidth}
            </span>
          </div>
          <div style={{ fontSize: '0.6875rem', opacity: 0.8 }}>Framer Canvas Engine</div>
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: viewportWidth,
          maxWidth: '1200px',
          minHeight: '800px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          boxShadow: isEditor ? '0 20px 40px -10px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)' : 'none',
          borderRadius: isEditor ? '8px' : '0',
          transition: 'width 0.3s ease, height 0.3s ease',
          boxSizing: 'border-box',
        }}
      >
        <PageRenderer
          document={document}
          isEditor={isEditor}
          selectedNodeIds={selectedNodeIds}
          onNodeClick={onNodeClick}
          onNodeHover={onNodeHover}
          onUpdateProps={onUpdateProps}
        />

        {isEditor && primaryRect && (
          <SelectionOverlay
            rect={primaryRect}
            label={primaryNodeName}
            isLocked={document.nodes[primaryId]?.metadata?.locked}
          />
        )}
      </div>
    </div>
  );
});
