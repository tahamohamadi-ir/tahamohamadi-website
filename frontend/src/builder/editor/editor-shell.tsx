/**
 * Editor Shell — Main editor layout
 *
 * Composes the editor toolbar, layers panel, canvas, inspector panel,
 * and component library into the full editor experience.
 *
 * @module builder/editor/editor-shell
 */

'use client';

import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { useStore } from 'zustand';

import type { PageDocument, NodeId } from '../schema/document';
import { CommandBus, registerNodeCommands, NODE_COMMAND_TYPES } from '../core';
import { HistoryEngine } from '../core/history';
import { builderEvents } from '../core/events';
import {
  createDocumentStore,
  createEditorStore,
  createEmptyDocument,
} from '../state';
import type { DocumentStoreApi, EditorStoreApi, DocumentState, EditorState } from '../state';
import { componentRegistry, registerBuiltInComponents } from '../registry';
import { PageRenderer } from '../renderer';
import { BuilderToolbar } from './toolbar';
import { LayersPanel } from './layers-panel';
import { InspectorPanel } from './inspector-panel';
import { BlockLibraryPanel } from './block-library-panel';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export interface BuilderContext {
  documentStore: DocumentStoreApi;
  editorStore: EditorStoreApi;
  commandBus: CommandBus;
  history: HistoryEngine;
}

export const BuilderCtx = React.createContext<BuilderContext | null>(null);

export function useBuilder(): BuilderContext {
  const ctx = React.useContext(BuilderCtx);
  if (!ctx) throw new Error('useBuilder must be used within EditorShell');
  return ctx;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface EditorShellProps {
  /** Initial document to load. If not provided, an empty document is created. */
  initialDocument?: PageDocument;
  /** Initial revision number. */
  initialRevision?: number;
  /** Callback when the document is saved. */
  onSave?: (document: PageDocument) => Promise<void>;
  /** Page ID for display purposes. */
  pageId?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditorShell({
  initialDocument,
  initialRevision = 0,
  onSave,
  pageId,
}: EditorShellProps) {
  // Create stores (once)
  const documentStoreRef = useRef<DocumentStoreApi | null>(null);
  const editorStoreRef = useRef<EditorStoreApi | null>(null);
  const commandBusRef = useRef<CommandBus | null>(null);
  const historyRef = useRef<HistoryEngine | null>(null);

  if (!documentStoreRef.current) {
    const doc = initialDocument ?? createEmptyDocument(pageId);
    documentStoreRef.current = createDocumentStore(doc);
  }
  if (!editorStoreRef.current) {
    editorStoreRef.current = createEditorStore();
  }

  const docStore = documentStoreRef.current;
  const editorStore = editorStoreRef.current;

  // Initialize command bus and history
  if (!historyRef.current) {
    historyRef.current = new HistoryEngine({
      applyPatches: (patches) => docStore.getState().applyPatches(patches),
    });
  }
  if (!commandBusRef.current) {
    commandBusRef.current = new CommandBus({
      getDocument: () => docStore.getState().document,
      applyPatches: (patches) => docStore.getState().applyPatches(patches),
      onCommandExecuted: (cmd, result) => {
        historyRef.current!.push(cmd, result);
        builderEvents.emit('document:changed', {
          affectedNodeIds: result.affectedNodeIds,
        });
      },
    });
    registerNodeCommands(commandBusRef.current);
  }

  // Register built-in components (once)
  useEffect(() => {
    registerBuiltInComponents(componentRegistry);
  }, []);

  // Load initial document
  useEffect(() => {
    if (initialDocument) {
      docStore.getState().loadDocument(initialDocument, initialRevision);
    }
  }, [initialDocument, initialRevision, docStore]);

  const commandBus = commandBusRef.current;
  const history = historyRef.current;

  // Subscribe to document state
  const document = useStore(docStore, (s: DocumentState) => s.document);
  const isDirty = useStore(docStore, (s: DocumentState) => s.isDirty);
  const selectedIds = useStore(editorStore, (s: EditorState) => s.selection.selectedIds);
  const primaryId = useStore(editorStore, (s: EditorState) => s.selection.primaryId);
  const openPanels = useStore(editorStore, (s: EditorState) => s.openPanels);
  const isPreviewMode = useStore(editorStore, (s: EditorState) => s.isPreviewMode);

  // Context
  const ctx = useMemo<BuilderContext>(
    () => ({
      documentStore: docStore,
      editorStore,
      commandBus,
      history,
    }),
    [docStore, editorStore, commandBus, history],
  );

  // Handlers
  const handleNodeClick = useCallback(
    (nodeId: NodeId, e: React.MouseEvent) => {
      if (e.ctrlKey || e.metaKey) {
        editorStore.getState().toggleSelect(nodeId);
      } else {
        editorStore.getState().select(nodeId);
      }
    },
    [editorStore],
  );

  const handleNodeHover = useCallback(
    (nodeId: NodeId | null) => {
      editorStore.getState().hover(nodeId);
    },
    [editorStore],
  );

  const handleUndo = useCallback(() => {
    const entry = history.undo();
    if (entry) {
      builderEvents.emit('history:undone', { commandType: entry.commandType });
    }
  }, [history]);

  const handleRedo = useCallback(() => {
    const entry = history.redo();
    if (entry) {
      builderEvents.emit('history:redone', { commandType: entry.commandType });
    }
  }, [history]);

  const handleSave = useCallback(async () => {
    if (!onSave) return;
    editorStore.getState().setSaving(true);
    try {
      await onSave(document);
      docStore.getState().markSaved(docStore.getState().revision + 1);
      editorStore.getState().setLastSavedAt(Date.now());
    } catch (error) {
      console.error('[EditorShell] Save error:', error);
      editorStore.getState().setSaving(false);
    }
  }, [onSave, document, docStore, editorStore]);

  const handleInsertNode = useCallback(
    (componentType: string) => {
      const def = componentRegistry.get(componentType);
      if (!def) return;

      const targetId = primaryId || document.rootNodeId;

      commandBus.execute({
        type: NODE_COMMAND_TYPES.INSERT,
        payload: {
          parentId: targetId,
          slotName: 'children',
          node: {
            type: componentType,
            componentVersion: def.version,
            props: { ...def.defaults },
            slots: Object.fromEntries(
              Object.keys(def.slots).map((name) => [name, []]),
            ),
            styleRefs: [],
            metadata: { name: def.meta.name },
          },
        },
      });
    },
    [commandBus, primaryId, document.rootNodeId],
  );

  const handleDeleteNode = useCallback(() => {
    if (!primaryId || primaryId === document.rootNodeId) return;
    commandBus.execute({
      type: NODE_COMMAND_TYPES.DELETE,
      payload: { nodeId: primaryId },
    });
    editorStore.getState().clearSelect();
  }, [commandBus, primaryId, document.rootNodeId, editorStore]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (isCtrl && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      } else if (isCtrl && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (isCtrl && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteNode();
      } else if (e.key === 'Escape') {
        editorStore.getState().clearSelect();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo, handleSave, handleDeleteNode, editorStore]);

  // Get primary node for inspector
  const primaryNode = primaryId ? document.nodes[primaryId] : null;

  return (
    <BuilderCtx.Provider value={ctx}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#111827',
        color: '#f3f4f6',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        {/* Toolbar */}
        <BuilderToolbar
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          isDirty={isDirty}
          isPreviewMode={isPreviewMode}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSave={handleSave}
          onTogglePreview={() =>
            editorStore.getState().setPreviewMode(!isPreviewMode)
          }
          pageTitle={document.document.title}
        />

        {/* Main area */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left panel: Layers + Library */}
          {!isPreviewMode && openPanels.has('layers') && (
            <div style={{
              width: '260px',
              borderInlineEnd: '1px solid #374151',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}>
              <LayersPanel
                document={document}
                selectedIds={selectedIds}
                onSelect={(id) => editorStore.getState().select(id)}
              />
              <BlockLibraryPanel onInsert={handleInsertNode} />
            </div>
          )}

          {/* Canvas */}
          <div style={{
            flex: 1,
            backgroundColor: '#1f2937',
            overflow: 'auto',
            display: 'flex',
            justifyContent: 'center',
            padding: '2rem',
          }}>
            <div style={{
              width: '100%',
              maxWidth: isPreviewMode ? '100%' : '1280px',
              backgroundColor: '#ffffff',
              borderRadius: isPreviewMode ? 0 : '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              overflow: 'auto',
              minHeight: '600px',
            }}>
              <PageRenderer
                document={document}
                isEditor={!isPreviewMode}
                selectedNodeIds={selectedIds}
                onNodeClick={handleNodeClick}
                onNodeHover={handleNodeHover}
              />
            </div>
          </div>

          {/* Right panel: Inspector */}
          {!isPreviewMode && openPanels.has('inspector') && primaryNode && (
            <div style={{
              width: '300px',
              borderInlineStart: '1px solid #374151',
              overflow: 'auto',
            }}>
              <InspectorPanel
                node={primaryNode}
                document={document}
                onUpdateProps={(nodeId, patch) => {
                  commandBus.execute({
                    type: NODE_COMMAND_TYPES.UPDATE_PROPS,
                    payload: { nodeId, patch },
                  });
                }}
                onDelete={handleDeleteNode}
              />
            </div>
          )}
        </div>
      </div>
    </BuilderCtx.Provider>
  );
}
