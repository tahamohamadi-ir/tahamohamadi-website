/**
 * Block Library Panel — Component inserter
 *
 * Shows available components grouped by category for insertion.
 *
 * @module builder/editor/block-library-panel
 */

'use client';

import React, { useMemo, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { componentRegistry } from '../registry';
import type { ComponentDefinition } from '../registry/registry-types';
import { CATEGORY_LABELS, getNodeCategory } from '../schema/node-types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BlockLibraryPanelProps {
  onInsert: (componentType: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const BlockLibraryPanel = React.memo(function BlockLibraryPanel({ onInsert }: BlockLibraryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const libraryComponents = useMemo(() => {
    const all = componentRegistry.getLibraryComponents();

    if (!searchQuery.trim()) return all;

    const q = searchQuery.toLowerCase();
    return all.filter(
      (def) =>
        def.meta.name.toLowerCase().includes(q) ||
        def.type.toLowerCase().includes(q) ||
        def.meta.description?.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof libraryComponents>();
    for (const comp of libraryComponents) {
      const cat = getNodeCategory(comp.type);
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(comp);
    }
    return map;
  }, [libraryComponents]);

  return (
    <div
      style={{
        borderBlockStart: '1px solid #374151',
        overflow: 'auto',
        maxHeight: '40%',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '0.75rem',
          fontSize: '0.6875rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#6b7280',
          borderBlockEnd: '1px solid #374151',
        }}
      >
        Components
      </div>

      {/* Search */}
      <div style={{ padding: '0.5rem' }}>
        <input
          type="text"
          placeholder="Search components..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '0.375rem 0.5rem',
            fontSize: '0.8125rem',
            backgroundColor: '#1f2937',
            color: '#e5e7eb',
            border: '1px solid #374151',
            borderRadius: '0.25rem',
            outline: 'none',
          }}
        />
      </div>

      {/* Component list */}
      <div style={{ padding: '0.25rem 0.5rem 0.5rem' }}>
        {Array.from(grouped.entries()).map(([category, components]) => (
          <div key={category} style={{ marginBlockEnd: '0.5rem' }}>
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBlockEnd: '0.25rem',
                paddingInlineStart: '0.25rem',
              }}
            >
              {CATEGORY_LABELS[category] || category}
            </div>
            {components.map((comp) => (
              <DraggableLibraryItem
                key={comp.type}
                comp={comp}
                onInsert={onInsert}
              />
            ))}
          </div>
        ))}
        {libraryComponents.length === 0 && (
          <div
            style={{
              padding: '1rem',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '0.8125rem',
            }}
          >
            No components found.
          </div>
        )}
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Draggable Library Item
// ---------------------------------------------------------------------------

function DraggableLibraryItem({ comp, onInsert }: { comp: ComponentDefinition, onInsert: (type: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library-${comp.type}`,
    data: {
      type: 'library_block',
      componentType: comp.type,
    },
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onInsert(comp.type)}
      title={comp.meta.description || comp.meta.name}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        width: '100%',
        padding: '0.375rem 0.5rem',
        fontSize: '0.8125rem',
        color: '#d1d5db',
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: '0.25rem',
        cursor: isDragging ? 'grabbing' : 'grab',
        textAlign: 'start',
        transition: 'background-color 0.1s',
        opacity: isDragging ? 0.5 : 1,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1f2937')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>+</span>
      <span>{comp.meta.name}</span>
    </button>
  );
}
