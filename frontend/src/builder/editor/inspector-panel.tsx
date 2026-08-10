/**
 * Inspector Panel — Property editor for selected nodes
 *
 * Shows editable fields for the currently selected node's props.
 *
 * @module builder/editor/inspector-panel
 */

'use client';

import React, { useCallback } from 'react';
import type { PageNode, PageDocument, NodeId } from '../schema/document';
import { componentRegistry } from '../registry';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface InspectorPanelProps {
  node: PageNode;
  document: PageDocument;
  onUpdateProps: (nodeId: NodeId, patch: Record<string, unknown>) => void;
  onDelete: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InspectorPanel({
  node,
  document,
  onUpdateProps,
  onDelete,
}: InspectorPanelProps) {
  const def = componentRegistry.get(node.type);
  const displayName = node.metadata?.name || def?.meta.name || node.type;

  const handlePropChange = useCallback(
    (key: string, value: unknown) => {
      onUpdateProps(node.id, { [key]: value });
    },
    [node.id, onUpdateProps],
  );

  return (
    <div style={{ padding: '0.75rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBlockEnd: '1rem',
          paddingBlockEnd: '0.75rem',
          borderBlockEnd: '1px solid #374151',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#e5e7eb',
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              fontSize: '0.6875rem',
              color: '#6b7280',
              fontFamily: 'monospace',
            }}
          >
            {node.type} v{node.componentVersion}
          </div>
        </div>
        {node.id !== document.rootNodeId && (
          <button
            onClick={onDelete}
            title="Delete node"
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              color: '#fca5a5',
              backgroundColor: '#450a0a',
              border: '1px solid #7f1d1d',
              borderRadius: '0.25rem',
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        )}
      </div>

      {/* Props editors */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {Object.entries(node.props).map(([key, value]) => (
          <PropField
            key={key}
            label={key}
            value={value}
            onChange={(newValue) => handlePropChange(key, newValue)}
          />
        ))}
      </div>

      {/* Node ID (read-only info) */}
      <div
        style={{
          marginBlockStart: '1.5rem',
          paddingBlockStart: '0.75rem',
          borderBlockStart: '1px solid #374151',
        }}
      >
        <div
          style={{
            fontSize: '0.6875rem',
            color: '#4b5563',
            fontFamily: 'monospace',
          }}
        >
          ID: {node.id}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PropField — Generic property editor
// ---------------------------------------------------------------------------

interface PropFieldProps {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
}

function PropField({ label, value, onChange }: PropFieldProps) {
  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.375rem 0.5rem',
    fontSize: '0.8125rem',
    backgroundColor: '#1f2937',
    color: '#e5e7eb',
    border: '1px solid #374151',
    borderRadius: '0.25rem',
    outline: 'none',
    fontFamily: 'inherit',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: '#9ca3af',
    marginBlockEnd: '0.25rem',
    textTransform: 'capitalize',
  };

  // Number
  if (typeof value === 'number') {
    return (
      <div>
        <label style={labelStyle}>{formatLabel(label)}</label>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={fieldStyle}
        />
      </div>
    );
  }

  // Boolean
  if (typeof value === 'boolean') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          style={{ accentColor: '#4F46E5' }}
        />
        <label style={{ ...labelStyle, margin: 0 }}>{formatLabel(label)}</label>
      </div>
    );
  }

  // String (default)
  const strValue = typeof value === 'string' ? value : String(value ?? '');

  // Multi-line for long text
  if (strValue.length > 80 || label === 'text' || label === 'content') {
    return (
      <div>
        <label style={labelStyle}>{formatLabel(label)}</label>
        <textarea
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          style={{ ...fieldStyle, resize: 'vertical' }}
        />
      </div>
    );
  }

  return (
    <div>
      <label style={labelStyle}>{formatLabel(label)}</label>
      <input
        type="text"
        value={strValue}
        onChange={(e) => onChange(e.target.value)}
        style={fieldStyle}
      />
    </div>
  );
}

function formatLabel(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');
}
