/**
 * Node Renderer — Recursive renderer from normalized document
 *
 * Renders a node tree from the PageDocument schema.
 * Each node is resolved to a React component via the ComponentRegistry.
 *
 * ADR-008: Editor Preview and Published Rendering must use the same Component Registry
 *
 * @module builder/renderer/node-renderer
 */

'use client';

import React, { useMemo, useCallback, memo } from 'react';
import type { NodeId, PageDocument } from '../schema/document';
import { resolveComponent } from './runtime-resolver';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface NodeRendererProps {
  /** The document to render from. */
  document: PageDocument;
  /** The node ID to render. */
  nodeId: NodeId;
  /** Whether we're in editor mode. */
  isEditor: boolean;
  /** Currently selected node IDs (for highlighting in editor). */
  selectedNodeIds?: NodeId[];
  /** Callback when a node is clicked (editor mode). */
  onNodeClick?: (nodeId: NodeId, event: React.MouseEvent) => void;
  /** Callback when mouse enters a node (editor mode). */
  onNodeHover?: (nodeId: NodeId | null) => void;
}

// ---------------------------------------------------------------------------
// Fallback Component
// ---------------------------------------------------------------------------

function FallbackComponent({ nodeId, type }: { nodeId: string; type: string }) {
  return (
    <div
      data-builder-type="unknown"
      data-builder-node={nodeId}
      style={{
        padding: '1rem',
        border: '2px dashed #ef4444',
        borderRadius: '0.5rem',
        backgroundColor: '#fef2f2',
        color: '#dc2626',
        fontSize: '0.875rem',
        fontFamily: 'monospace',
      }}
    >
      ⚠ Unknown component: <strong>{type}</strong>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single Node Renderer (memoized)
// ---------------------------------------------------------------------------

interface SingleNodeContentProps extends NodeRendererProps {
  node: NonNullable<PageDocument['nodes'][string]>;
}

function SingleNodeContent({
  document,
  nodeId,
  isEditor,
  selectedNodeIds,
  onNodeClick,
  onNodeHover,
  node,
}: SingleNodeContentProps) {
  const { definition, resolvedProps } = resolveComponent(node);
  const isSelected = selectedNodeIds?.includes(nodeId) ?? false;

  // Render slot children recursively
  const renderedSlots = useMemo(() => {
    const result: Record<string, React.ReactNode> = {};

    for (const [slotName, childIds] of Object.entries(node.slots)) {
      result[slotName] = (
        <>
          {childIds.map((childId) => (
            <SingleNodeRenderer
              key={childId}
              document={document}
              nodeId={childId}
              isEditor={isEditor}
              selectedNodeIds={selectedNodeIds}
              onNodeClick={onNodeClick}
              onNodeHover={onNodeHover}
            />
          ))}
        </>
      );
    }

    return result;
  }, [node.slots, document, isEditor, selectedNodeIds, onNodeClick, onNodeHover]);

  // Editor event handlers
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isEditor || !onNodeClick) return;
      e.stopPropagation();
      onNodeClick(nodeId, e);
    },
    [isEditor, onNodeClick, nodeId],
  );

  const handleMouseEnter = useCallback(() => {
    if (isEditor && onNodeHover) {
      onNodeHover(nodeId);
    }
  }, [isEditor, onNodeHover, nodeId]);

  const handleMouseLeave = useCallback(() => {
    if (isEditor && onNodeHover) {
      onNodeHover(null);
    }
  }, [isEditor, onNodeHover]);

  if (!definition) {
    return <FallbackComponent nodeId={nodeId} type={node.type} />;
  }

  const Component = definition.render;

  const content = (
    <Component
      nodeId={nodeId}
      props={resolvedProps}
      slots={renderedSlots}
      isEditor={isEditor}
      isSelected={isSelected}
    />
  );

  // In editor mode, wrap with interactive container
  if (isEditor) {
    return (
      <div
        data-builder-node={nodeId}
        data-builder-type={node.type}
        data-builder-selected={isSelected || undefined}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'relative',
          outline: isSelected ? '2px solid #4F46E5' : undefined,
          outlineOffset: '-1px',
          cursor: node.metadata?.locked ? 'not-allowed' : 'pointer',
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}

const SingleNodeRenderer = memo(function SingleNodeRenderer(props: NodeRendererProps) {
  const { document, nodeId, isEditor } = props;
  const node = document.nodes[nodeId];
  if (!node) return null;

  // Check visibility
  if (node.visibility?.hidden && !isEditor) return null;
  if (node.metadata?.hiddenInEditor && isEditor) return null;

  return <SingleNodeContent {...props} node={node} />;
});

SingleNodeRenderer.displayName = 'SingleNodeRenderer';

// ---------------------------------------------------------------------------
// Root Renderer
// ---------------------------------------------------------------------------

export interface PageRendererProps {
  document: PageDocument;
  isEditor?: boolean;
  selectedNodeIds?: NodeId[];
  onNodeClick?: (nodeId: NodeId, event: React.MouseEvent) => void;
  onNodeHover?: (nodeId: NodeId | null) => void;
}

/**
 * Renders the entire page document starting from the root node.
 */
export function PageRenderer({
  document,
  isEditor = false,
  selectedNodeIds = [],
  onNodeClick,
  onNodeHover,
}: PageRendererProps) {
  if (!document.rootNodeId || !document.nodes[document.rootNodeId]) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        Empty page — add components from the library panel.
      </div>
    );
  }

  return (
    <SingleNodeRenderer
      document={document}
      nodeId={document.rootNodeId}
      isEditor={isEditor}
      selectedNodeIds={selectedNodeIds}
      onNodeClick={onNodeClick}
      onNodeHover={onNodeHover}
    />
  );
}
