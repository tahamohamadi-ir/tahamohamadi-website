/**
 * Editor Toolbar — Top bar with undo, redo, save, preview controls
 *
 * @module builder/editor/toolbar
 */

'use client';

import React from 'react';
import Link from 'next/link';

export interface BuilderToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  isPreviewMode: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onPublish?: () => void;
  isPublishing?: boolean;
  onTogglePreview: () => void;
  pageTitle: string;
}

export function BuilderToolbar({
  canUndo,
  canRedo,
  isDirty,
  isPreviewMode,
  onUndo,
  onRedo,
  onSave,
  onPublish,
  isPublishing,
  onTogglePreview,
  pageTitle,
}: BuilderToolbarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '48px',
        paddingInline: '1rem',
        backgroundColor: '#0f172a',
        borderBlockEnd: '1px solid #1e293b',
        flexShrink: 0,
      }}
    >
      {/* Left: Navigation + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link
          href="/admin/builder"
          style={{
            color: '#94a3b8',
            textDecoration: 'none',
            fontSize: '0.875rem',
          }}
        >
          ← Back
        </Link>
        <span
          style={{
            color: '#e2e8f0',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {pageTitle}
        </span>
        {isDirty && (
          <span
            style={{
              fontSize: '0.75rem',
              color: '#f59e0b',
              backgroundColor: '#451a03',
              padding: '0.125rem 0.5rem',
              borderRadius: '9999px',
            }}
          >
            Unsaved
          </span>
        )}
      </div>

      {/* Center: Undo/Redo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <ToolbarButton
          title="Undo (Ctrl+Z)"
          disabled={!canUndo}
          onClick={onUndo}
        >
          ↶
        </ToolbarButton>
        <ToolbarButton
          title="Redo (Ctrl+Shift+Z)"
          disabled={!canRedo}
          onClick={onRedo}
        >
          ↷
        </ToolbarButton>
      </div>

      {/* Right: Preview + Save */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ToolbarButton
          title={isPreviewMode ? 'Exit Preview' : 'Preview'}
          onClick={onTogglePreview}
          active={isPreviewMode}
        >
          {isPreviewMode ? '✎ Edit' : '👁 Preview'}
        </ToolbarButton>

        <button
          onClick={onSave}
          disabled={!isDirty}
          title="Save Draft (Ctrl+S)"
          style={{
            padding: '0.375rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: isDirty ? '#ffffff' : '#64748b',
            backgroundColor: isDirty ? '#4F46E5' : '#1e293b',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: isDirty ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.15s',
          }}
        >
          Save
        </button>

        {onPublish && (
          <button
            onClick={onPublish}
            disabled={isPublishing || isDirty}
            title={isDirty ? 'Save draft before publishing' : 'Publish to production'}
            style={{
              padding: '0.375rem 1rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: (isPublishing || isDirty) ? '#94a3b8' : '#ffffff',
              backgroundColor: (isPublishing || isDirty) ? '#334155' : '#10b981',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: (isPublishing || isDirty) ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s',
              marginLeft: '0.5rem',
            }}
          >
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toolbar Button
// ---------------------------------------------------------------------------

function ToolbarButton({
  children,
  title,
  disabled,
  active,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: '0.375rem 0.625rem',
        fontSize: '0.875rem',
        color: disabled ? '#475569' : active ? '#818cf8' : '#cbd5e1',
        backgroundColor: active ? '#1e1b4b' : 'transparent',
        border: 'none',
        borderRadius: '0.25rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}
