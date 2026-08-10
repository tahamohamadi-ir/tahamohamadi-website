/**
 * Layers Panel — Node tree navigator
 *
 * Shows the hierarchical tree of nodes with selection highlighting.
 *
 * @module builder/editor/layers-panel
 */

'use client';

import React, { useState, useCallback } from 'react';
import type { PageDocument, NodeId } from '../schema/document';
import { componentRegistry } from '../registry';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface LayersPanelProps {
  document: PageDocument;
  selectedIds: NodeId[];
  onSelect: (nodeId: NodeId, e: React.MouseEvent) => void;
  onDuplicate?: (nodeId: NodeId) => void;
  onDelete?: (nodeId: NodeId) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LayersPanel({
  document,
  selectedIds,
  onSelect,
  onDuplicate,
  onDelete,
}: LayersPanelProps) {
  return (
    <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
      <div
        style={{
          padding: '0.75rem',
          fontSize: '0.6875rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#6b7280',
          borderBlockEnd: '1px solid #374151',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>Layers ({Object.keys(document.nodes).length})</span>
        {selectedIds.length > 1 && (
          <span style={{ color: '#818cf8', fontWeight: 600 }}>
            {selectedIds.length} selected
          </span>
        )}
      </div>
      <div style={{ padding: '0.25rem' }}>
        <LayerNode
          document={document}
          nodeId={document.rootNodeId}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          depth={0}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layer Node (recursive)
// ---------------------------------------------------------------------------

interface LayerNodeProps {
  document: PageDocument;
  nodeId: NodeId;
  selectedIds: NodeId[];
  onSelect: (nodeId: NodeId, e: React.MouseEvent) => void;
  onDuplicate?: (nodeId: NodeId) => void;
  onDelete?: (nodeId: NodeId) => void;
  depth: number;
}

function LayerNode({
  document,
  nodeId,
  selectedIds,
  onSelect,
  onDuplicate,
  onDelete,
  depth,
}: LayerNodeProps) {
  const [isExpanded, setExpanded] = useState(depth < 2);
  const [isHovered, setHovered] = useState(false);

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setExpanded((prev) => !prev);
    },
    [],
  );

  const node = document.nodes[nodeId];
  if (!node) return null;

  const def = componentRegistry.get(node.type);
  const displayName = node.metadata?.name || def?.meta.name || node.type;
  const isSelected = selectedIds.includes(nodeId);
  const isRoot = nodeId === document.rootNodeId;
  const hasChildren = Object.values(node.slots).some((s) => s.length > 0);

  return (
    <div>
      <div
        onClick={(e) => onSelect(nodeId, e)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          paddingBlock: '0.25rem',
          paddingInlineStart: `${depth * 16 + 8}px`,
          paddingInlineEnd: '0.5rem',
          fontSize: '0.8125rem',
          cursor: 'pointer',
          borderRadius: '0.25rem',
          backgroundColor: isSelected ? '#312e81' : isHovered ? '#1f2937' : 'transparent',
          color: isSelected ? '#c7d2fe' : '#d1d5db',
          transition: 'background-color 0.1s',
        }}
      >
        {/* Expand/collapse toggle */}
        {hasChildren ? (
          <span
            onClick={handleToggle}
            style={{
              width: '16px',
              textAlign: 'center',
              fontSize: '0.625rem',
              color: '#6b7280',
              userSelect: 'none',
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </span>
        ) : (
          <span style={{ width: '16px' }} />
        )}

        {/* Icon */}
        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
          {getNodeIcon(node.type)}
        </span>

        {/* Name */}
        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {displayName}
        </span>

        {/* Action icons on hover */}
        {isHovered && !isRoot && (
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {onDuplicate && (
              <span
                title="Duplicate node (Ctrl+D)"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(nodeId);
                }}
                style={{
                  fontSize: '0.6875rem',
                  padding: '0 0.25rem',
                  color: '#9ca3af',
                  borderRadius: '0.125rem',
                }}
              >
                📋
              </span>
            )}
            {onDelete && (
              <span
                title="Delete node (Del)"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(nodeId);
                }}
                style={{
                  fontSize: '0.6875rem',
                  padding: '0 0.25rem',
                  color: '#f87171',
                  borderRadius: '0.125rem',
                }}
              >
                🗑️
              </span>
            )}
          </div>
        )}

        {/* Lock indicator */}
        {node.metadata?.locked && (
          <span style={{ fontSize: '0.625rem', opacity: 0.5 }}>🔒</span>
        )}
      </div>

      {/* Children */}
      {isExpanded &&
        hasChildren &&
        Object.entries(node.slots).map(([, children]) =>
          children.map((childId) => (
            <LayerNode
              key={childId}
              document={document}
              nodeId={childId}
              selectedIds={selectedIds}
              onSelect={onSelect}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              depth={depth + 1}
            />
          )),
        )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function getNodeIcon(type: string): string {
  const category = type.split('.')[0];
  switch (category) {
    case 'core': return '📄';
    case 'layout': return '📐';
    case 'content': return '✏️';
    case 'media': return '🖼️';
    case 'ui': return '🔘';
    case 'navigation': return '🧭';
    case 'form': return '📝';
    case 'marketing': return '📣';
    case 'dynamic': return '🔄';
    default: return '📦';
  }
}
