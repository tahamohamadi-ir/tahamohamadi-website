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
import { DropIndicator } from './drop-indicator';

export interface CanvasFrameProps {
  document: PageDocument;
  isEditor: boolean;
  selectedNodeIds: NodeId[];
  hoveredNodeId?: NodeId | null;
  onNodeClick: (nodeId: NodeId, e: React.MouseEvent) => void;
  onNodeHover: (nodeId: NodeId | null) => void;
  viewportWidth?: string | number;
}

export const CanvasFrame = React.memo(function CanvasFrame({
  document,
  isEditor,
  selectedNodeIds,
  hoveredNodeId,
  onNodeClick,
  onNodeHover,
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

    const element = containerRef.current.querySelector(`[data-node-id="${primaryId}"]`);
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
    return () => window.removeEventListener('resize', updateSelectionOverlay);
  }, [updateSelectionOverlay, document]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: viewportWidth,
        maxWidth: '100%',
        minHeight: '600px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        boxShadow: isEditor ? '0 4px 20px -2px rgba(0, 0, 0, 0.25)' : 'none',
        borderRadius: isEditor ? '4px' : '0',
        overflow: 'auto',
      }}
    >
      <PageRenderer
        document={document}
        isEditor={isEditor}
        selectedNodeIds={selectedNodeIds}
        onNodeClick={onNodeClick}
        onNodeHover={onNodeHover}
      />

      {isEditor && primaryRect && (
        <SelectionOverlay
          rect={primaryRect}
          label={primaryNodeName}
          isLocked={document.nodes[primaryId]?.metadata?.locked}
        />
      )}
    </div>
  );
});
