/**
 * Inspector Panel — Property editor for selected nodes
 *
 * Shows editable fields for the currently selected node's props.
 *
 * @module builder/editor/inspector-panel
 */

'use client';

import React, { useCallback, useState } from 'react';
import type { PageNode, PageDocument, NodeId } from '../schema/document';
import { componentRegistry } from '../registry';

type TabType = 'content' | 'design' | 'interaction' | 'animations';

export interface InspectorPanelProps {
  node: PageNode;
  document: PageDocument;
  onUpdateProps: (nodeId: NodeId, patch: Record<string, unknown>) => void;
  onDelete: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const InspectorPanel = React.memo(function InspectorPanel({
  node,
  document,
  onUpdateProps,
  onDelete,
}: InspectorPanelProps) {
  const def = componentRegistry.get(node.type);
  const displayName = node.metadata?.name || def?.meta.name || node.type;
  const supportsStyle = def?.capabilities?.style;
  const [activeTab, setActiveTab] = useState<TabType>('content');
  const [styleState, setStyleState] = useState<'normal' | 'hover'>('normal');

  const handlePropChange = useCallback(
    (key: string, value: unknown) => {
      onUpdateProps(node.id, { [key]: value });
    },
    [node.id, onUpdateProps],
  );

  const handleStyleChange = useCallback(
    (key: string, value: string) => {
      const targetProp = styleState === 'normal' ? 'styles' : 'hoverStyles';
      const currentStyles = (node.props[targetProp] || {}) as Record<string, unknown>;
      onUpdateProps(node.id, {
        [targetProp]: { ...currentStyles, [key]: value },
      });
    },
    [node.id, styleState, node.props, onUpdateProps],
  );

  const handleInteractionChange = useCallback(
    (key: string, value: string) => {
      onUpdateProps(node.id, { [key]: value });
    },
    [node.id, onUpdateProps],
  );

  const tabs: TabType[] = ['content', ...(supportsStyle ? ['design' as TabType] : []), 'interaction', 'animations'];

  return (
    <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
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
        </div>
        {node.id !== document.rootNodeId && (
          <button
            onClick={onDelete}
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBlockEnd: '1rem', borderBottom: '1px solid #374151' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === tab ? '#6366f1' : '#9ca3af',
              cursor: 'pointer',
              fontWeight: 600,
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'content' && (
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {def?.defaults && Object.keys(def.defaults).map((propKey) => {
              const val = node.props[propKey] !== undefined ? node.props[propKey] : def.defaults[propKey];
              const isObjOrArray = typeof val === 'object' && val !== null;

              return (
                <div key={propKey}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#e5e7eb', marginBlockEnd: '0.25rem' }}>
                    {propKey}
                  </label>
                  {isObjOrArray ? (
                    <textarea
                      rows={5}
                      defaultValue={JSON.stringify(val, null, 2)}
                      onBlur={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          handlePropChange(propKey, parsed);
                        } catch {
                          // Ignore invalid JSON
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        fontSize: '0.8125rem',
                        fontFamily: 'monospace',
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '0.25rem',
                        color: '#38bdf8',
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={typeof val === 'string' || typeof val === 'number' ? String(val) : ''}
                      onChange={(e) => handlePropChange(propKey, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        fontSize: '0.875rem',
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '0.25rem',
                        color: '#fff',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'design' && (
          <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBlockEnd: '1rem' }}>
              <button
                onClick={() => setStyleState('normal')}
                style={{ flex: 1, padding: '0.25rem', fontSize: '0.75rem', borderRadius: '0.25rem', border: 'none', backgroundColor: styleState === 'normal' ? '#6366f1' : '#374151', color: '#fff', cursor: 'pointer' }}
              >
                Normal
              </button>
              <button
                onClick={() => setStyleState('hover')}
                style={{ flex: 1, padding: '0.25rem', fontSize: '0.75rem', borderRadius: '0.25rem', border: 'none', backgroundColor: styleState === 'hover' ? '#6366f1' : '#374151', color: '#fff', cursor: 'pointer' }}
              >
                Hover
              </button>
            </div>
            <div style={{ marginBlockEnd: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#e5e7eb' }}>
                <input 
                  type="checkbox" 
                  checked={!!node.props.glassmorphism}
                  onChange={(e) => handlePropChange('glassmorphism', e.target.checked)}
                />
                Enable Glassmorphism
              </label>
            </div>
            <StyleEditor
              styles={(node.props[styleState === 'normal' ? 'styles' : 'hoverStyles'] || {}) as Record<string, string>}
              onChange={handleStyleChange}
            />
          </div>
        )}

        {activeTab === 'interaction' && (
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#e5e7eb', marginBlockEnd: '0.25rem' }}>Action Type</label>
              <select
                value={(node.props.actionType as string) || 'navigate'}
                onChange={(e) => handleInteractionChange('actionType', e.target.value)}
                style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.25rem', color: '#fff' }}
              >
                <option value="navigate">Navigate (Link)</option>
                <option value="modal">Open Modal</option>
              </select>
            </div>

            {(!node.props.actionType || node.props.actionType === 'navigate') && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#e5e7eb', marginBlockEnd: '0.25rem' }}>Link (URL)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={(node.props.href as string) || ''}
                  onChange={(e) => handleInteractionChange('href', e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.25rem', color: '#fff' }}
                />
              </div>
            )}

            {node.props.actionType === 'modal' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#e5e7eb', marginBlockEnd: '0.25rem' }}>Target Modal ID</label>
                <input
                  type="text"
                  placeholder="e.g. node_123"
                  value={(node.props.modalTargetId as string) || ''}
                  onChange={(e) => handleInteractionChange('modalTargetId', e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.25rem', color: '#fff' }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#e5e7eb', marginBlockEnd: '0.25rem' }}>Tooltip Text</label>
              <input
                type="text"
                placeholder="Hover text..."
                value={(node.props.tooltip as string) || ''}
                onChange={(e) => handleInteractionChange('tooltip', e.target.value)}
                style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.25rem', color: '#fff' }}
              />
            </div>
          </div>
        )}

        {activeTab === 'animations' && (
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#e5e7eb', marginBlockEnd: '0.25rem' }}>Entrance Animation</label>
              <select
                value={((node.props.animations as Record<string, unknown>)?.entrance as string) || 'none'}
                onChange={(e) => {
                  const anim = { ...((node.props.animations as Record<string, unknown>) || {}), entrance: e.target.value };
                  onUpdateProps(node.id, { animations: anim });
                }}
                style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.25rem', color: '#fff' }}
              >
                <option value="none">None</option>
                <option value="fade">Fade In</option>
                <option value="slide-up">Slide Up</option>
                <option value="scale">Scale Up</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#e5e7eb', marginBlockEnd: '0.25rem' }}>Animation Delay (seconds)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={((node.props.animations as Record<string, unknown>)?.delay as number) || 0}
                onChange={(e) => {
                  const anim = { ...((node.props.animations as Record<string, unknown>) || {}), delay: Number(e.target.value) };
                  onUpdateProps(node.id, { animations: anim });
                }}
                style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.25rem', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#e5e7eb', marginBlockEnd: '0.25rem' }}>Parallax Speed (-1 to 1)</label>
              <input
                type="number"
                step="0.1"
                min="-1"
                max="1"
                value={((node.props.animations as Record<string, unknown>)?.parallaxSpeed as number) || 0}
                onChange={(e) => {
                  const anim = { ...((node.props.animations as Record<string, unknown>) || {}), parallaxSpeed: Number(e.target.value) };
                  onUpdateProps(node.id, { animations: anim });
                }}
                style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.25rem', color: '#fff' }}
              />
              <p style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '0.25rem' }}>Set to non-zero to enable scrolling parallax.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// PropField — Generic property editor
// ---------------------------------------------------------------------------

interface PropFieldProps {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
}

const PropField = React.memo(function PropField({ label, value, onChange }: PropFieldProps) {
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
});

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const safeColor = value && value.startsWith('#') && value.length === 7 ? value : '#000000';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <label style={{ fontSize: '0.6875rem', color: '#9ca3af', textTransform: 'capitalize' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.25rem', padding: '0.25rem 0.5rem' }}>
        <input
          type="color"
          value={safeColor}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '20px', height: '20px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'transparent' }}
        />
        <input
          type="text"
          value={value || ''}
          placeholder="#000000"
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '100%', border: 'none', background: 'none', color: '#fff', fontSize: '0.75rem', fontFamily: 'monospace', outline: 'none' }}
        />
      </div>
    </div>
  );
}

function formatLabel(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');
}

// ---------------------------------------------------------------------------
// Style Editor
// ---------------------------------------------------------------------------

function StyleEditor({ styles, onChange }: { styles: Record<string, string>; onChange: (k: string, v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Layout */}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e5e7eb', marginBlockEnd: '0.5rem' }}>Layout</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div>
            <label style={{ fontSize: '0.6875rem', color: '#9ca3af' }}>Display</label>
            <select
              value={styles.display || ''}
              onChange={(e) => onChange('display', e.target.value)}
              style={{ width: '100%', padding: '0.25rem', fontSize: '0.75rem', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '0.25rem' }}
            >
              <option value="">Default</option>
              <option value="block">Block</option>
              <option value="flex">Flex</option>
              <option value="grid">Grid</option>
              <option value="inline-block">Inline Block</option>
              <option value="none">None</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.6875rem', color: '#9ca3af' }}>Direction</label>
            <select
              value={styles.flexDirection || ''}
              onChange={(e) => onChange('flexDirection', e.target.value)}
              style={{ width: '100%', padding: '0.25rem', fontSize: '0.75rem', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '0.25rem' }}
              disabled={styles.display !== 'flex'}
            >
              <option value="">Default</option>
              <option value="row">Row</option>
              <option value="column">Column</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.6875rem', color: '#9ca3af' }}>Wrap</label>
            <select
              value={styles.flexWrap || ''}
              onChange={(e) => onChange('flexWrap', e.target.value)}
              style={{ width: '100%', padding: '0.25rem', fontSize: '0.75rem', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '0.25rem' }}
              disabled={styles.display !== 'flex'}
            >
              <option value="">Default</option>
              <option value="nowrap">No Wrap</option>
              <option value="wrap">Wrap</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.6875rem', color: '#9ca3af' }}>Justify</label>
            <select
              value={styles.justifyContent || ''}
              onChange={(e) => onChange('justifyContent', e.target.value)}
              style={{ width: '100%', padding: '0.25rem', fontSize: '0.75rem', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '0.25rem' }}
              disabled={styles.display !== 'flex'}
            >
              <option value="">Default</option>
              <option value="flex-start">Start</option>
              <option value="center">Center</option>
              <option value="flex-end">End</option>
              <option value="space-between">Space Between</option>
              <option value="space-around">Space Around</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.6875rem', color: '#9ca3af' }}>Align Items</label>
            <select
              value={styles.alignItems || ''}
              onChange={(e) => onChange('alignItems', e.target.value)}
              style={{ width: '100%', padding: '0.25rem', fontSize: '0.75rem', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '0.25rem' }}
              disabled={styles.display !== 'flex'}
            >
              <option value="">Default</option>
              <option value="flex-start">Start</option>
              <option value="center">Center</option>
              <option value="flex-end">End</option>
              <option value="stretch">Stretch</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.6875rem', color: '#9ca3af' }}>Align Self</label>
            <select
              value={styles.alignSelf || ''}
              onChange={(e) => onChange('alignSelf', e.target.value)}
              style={{ width: '100%', padding: '0.25rem', fontSize: '0.75rem', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '0.25rem' }}
            >
              <option value="">Default</option>
              <option value="flex-start">Start (Left)</option>
              <option value="center">Center</option>
              <option value="flex-end">End (Right)</option>
              <option value="stretch">Stretch</option>
            </select>
          </div>
        </div>
      </div>

      {/* Typography */}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e5e7eb', marginBlockEnd: '0.5rem' }}>Typography</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div>
            <label style={{ fontSize: '0.6875rem', color: '#9ca3af' }}>Text Align</label>
            <select
              value={styles.textAlign || ''}
              onChange={(e) => onChange('textAlign', e.target.value)}
              style={{ width: '100%', padding: '0.25rem', fontSize: '0.75rem', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '0.25rem' }}
            >
              <option value="">Default</option>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
              <option value="justify">Justify</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.6875rem', color: '#9ca3af' }}>Font Weight</label>
            <select
              value={styles.fontWeight || ''}
              onChange={(e) => onChange('fontWeight', e.target.value)}
              style={{ width: '100%', padding: '0.25rem', fontSize: '0.75rem', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '0.25rem' }}
            >
              <option value="">Default</option>
              <option value="300">Light</option>
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semi Bold</option>
              <option value="700">Bold</option>
              <option value="800">Extra Bold</option>
            </select>
          </div>
          <PropField label="font family" value={styles.fontFamily || ''} onChange={(v) => onChange('fontFamily', v as string)} />
          <PropField label="font size" value={styles.fontSize || ''} onChange={(v) => onChange('fontSize', v as string)} />
          <PropField label="line height" value={styles.lineHeight || ''} onChange={(v) => onChange('lineHeight', v as string)} />
          <PropField label="letter spacing" value={styles.letterSpacing || ''} onChange={(v) => onChange('letterSpacing', v as string)} />
        </div>
      </div>

      {/* Sizing */}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e5e7eb', marginBlockEnd: '0.5rem' }}>Sizing</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <PropField label="width" value={styles.width || ''} onChange={(v) => onChange('width', v as string)} />
          <PropField label="height" value={styles.height || ''} onChange={(v) => onChange('height', v as string)} />
        </div>
      </div>

      {/* Positioning */}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e5e7eb', marginBlockEnd: '0.5rem' }}>Positioning</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div>
            <label style={{ fontSize: '0.6875rem', color: '#9ca3af' }}>Position</label>
            <select
              value={styles.position || ''}
              onChange={(e) => onChange('position', e.target.value)}
              style={{ width: '100%', padding: '0.25rem', fontSize: '0.75rem', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '0.25rem' }}
            >
              <option value="">Static (Default)</option>
              <option value="relative">Relative</option>
              <option value="absolute">Absolute</option>
              <option value="fixed">Fixed</option>
              <option value="sticky">Sticky</option>
            </select>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <PropField label="top" value={styles.top || ''} onChange={(v) => onChange('top', v as string)} />
            <PropField label="bottom" value={styles.bottom || ''} onChange={(v) => onChange('bottom', v as string)} />
            <PropField label="left" value={styles.left || ''} onChange={(v) => onChange('left', v as string)} />
            <PropField label="right" value={styles.right || ''} onChange={(v) => onChange('right', v as string)} />
          </div>
          <PropField label="z-index" value={styles.zIndex || ''} onChange={(v) => onChange('zIndex', v as string)} />
        </div>
      </div>

      {/* Spacing */}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e5e7eb', marginBlockEnd: '0.5rem' }}>Spacing</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <PropField label="padding" value={styles.padding || ''} onChange={(v) => onChange('padding', v as string)} />
          <PropField label="margin" value={styles.margin || ''} onChange={(v) => onChange('margin', v as string)} />
        </div>
      </div>

      {/* Appearance, Borders & Shadows */}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e5e7eb', marginBlockEnd: '0.5rem' }}>Appearance & Borders</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <ColorField label="Background" value={styles.backgroundColor || ''} onChange={(v) => onChange('backgroundColor', v)} />
            <ColorField label="Text Color" value={styles.color || ''} onChange={(v) => onChange('color', v)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
            <PropField label="border width" value={styles.borderWidth || ''} onChange={(v) => onChange('borderWidth', v as string)} />
            
            <div>
              <label style={{ fontSize: '0.6875rem', color: '#9ca3af' }}>Border Style</label>
              <select
                value={styles.borderStyle || ''}
                onChange={(e) => onChange('borderStyle', e.target.value)}
                style={{ width: '100%', padding: '0.25rem', fontSize: '0.75rem', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '0.25rem' }}
              >
                <option value="">None</option>
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
            </div>
          </div>

          <ColorField label="Border Color" value={styles.borderColor || ''} onChange={(v) => onChange('borderColor', v)} />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', marginBottom: '0.5rem', gridColumn: 'span 2' }}>
              <input
                type="checkbox"
                checked={!!styles.backdropFilter?.includes('blur')}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange('backdropFilter', 'blur(12px)');
                    onChange('backgroundColor', 'rgba(255, 255, 255, 0.1)');
                  } else {
                    onChange('backdropFilter', 'none');
                    onChange('backgroundColor', '');
                  }
                }}
                style={{ accentColor: '#4F46E5' }}
              />
              <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>Glassmorphism</label>
            </div>
            <PropField label="border radius" value={styles.borderRadius || ''} onChange={(v) => onChange('borderRadius', v as string)} />
            <PropField label="box shadow" value={styles.boxShadow || ''} onChange={(v) => onChange('boxShadow', v as string)} />
          </div>
        </div>
      </div>

      {/* Effects */}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e5e7eb', marginBlockEnd: '0.5rem' }}>Effects</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <PropField label="transition" value={styles.transition || ''} onChange={(v) => onChange('transition', v as string)} />
          <PropField label="opacity" value={styles.opacity || ''} onChange={(v) => onChange('opacity', v as string)} />
        </div>
      </div>
    </div>
  );
}
