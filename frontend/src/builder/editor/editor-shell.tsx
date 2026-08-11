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
import { componentRegistry } from '../registry';
import { CanvasFrame } from '../canvas';
import { BuilderToolbar } from './toolbar';
import { LayersPanel } from './layers-panel';
import { InspectorPanel } from './inspector-panel';
import { BlockLibraryPanel } from './block-library-panel';

import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';

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
  /** Callback when the document is published. */
  onPublish?: (document: PageDocument) => Promise<void>;
  /** Page ID for display purposes. */
  pageId?: string;
  /** Whether autosave is enabled (default: true). */
  autoSaveEnabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditorShell({
  initialDocument,
  initialRevision = 0,
  onSave,
  onPublish,
  pageId,
  autoSaveEnabled = true,
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
  const hoveredId = useStore(editorStore, (s: EditorState) => s.selection.hoveredId);
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

  const [isPublishing, setIsPublishing] = React.useState(false);

  const handlePublish = useCallback(async () => {
    if (!onPublish || isDirty) return;
    setIsPublishing(true);
    try {
      await onPublish(document);
    } catch (error) {
      console.error('[EditorShell] Publish error:', error);
    } finally {
      setIsPublishing(false);
    }
  }, [onPublish, isDirty, document]);

  // Debounced Autosave (2000ms after document becomes dirty)
  useEffect(() => {
    if (!autoSaveEnabled || !isDirty || !onSave) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 2000);

    return () => clearTimeout(timer);
  }, [isDirty, autoSaveEnabled, onSave, handleSave]);

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

  const handleDuplicateNode = useCallback(
    (targetId?: NodeId) => {
      const nodeId = targetId || primaryId;
      if (!nodeId || nodeId === document.rootNodeId) return;

      commandBus.execute({
        type: NODE_COMMAND_TYPES.DUPLICATE,
        payload: { nodeId },
      });
    },
    [commandBus, primaryId, document.rootNodeId],
  );

  const handleDeleteNode = useCallback(
    (targetId?: NodeId) => {
      if (selectedIds.length > 1 && !targetId) {
        commandBus.execute({
          type: NODE_COMMAND_TYPES.BATCH_DELETE,
          payload: { nodeIds: selectedIds },
        });
        editorStore.getState().clearSelect();
        return;
      }

      const nodeId = targetId || primaryId;
      if (!nodeId || nodeId === document.rootNodeId) return;

      commandBus.execute({
        type: NODE_COMMAND_TYPES.DELETE,
        payload: { nodeId },
      });
      editorStore.getState().clearSelect();
    },
    [commandBus, primaryId, selectedIds, document.rootNodeId, editorStore],
  );

  const handleUpdateProps = useCallback(
    (nodeId: NodeId, patch: Record<string, unknown>) => {
      commandBus.execute({
        type: NODE_COMMAND_TYPES.UPDATE_PROPS,
        payload: { nodeId, patch },
      });
    },
    [commandBus],
  );

  // Drag and Drop State & Handlers
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );
  const [activeDragData, setActiveDragData] = React.useState<Record<string, unknown> | null>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragData(event.active.data.current ?? null);
  }, []);

  const handleDragOver = useCallback(() => {
    // Optionally update visual drop indicator state
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragData(null);
    const { active, over, delta } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || !overData) return;

    if (activeData.type === 'library_block') {
       // Insert new node
       const componentType = activeData.componentType;
       const def = componentRegistry.get(componentType);
       if (!def) return;
       
       commandBus.execute({
         type: NODE_COMMAND_TYPES.INSERT,
         payload: {
           parentId: overData.nodeId || document.rootNodeId,
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
           }
         }
       });
     } else if (activeData.type === 'canvas_node' || activeData.type === 'layer_node') {
        // Check if active node is absolute positioned
        const activeNode = document.nodes[activeData.nodeId as string];
        const styles = (activeNode?.props?.styles || {}) as Record<string, string>;
        const isAbsolute = styles.position === 'absolute' || styles.position === 'fixed';

        if (isAbsolute && activeData.type === 'canvas_node') {
          // Freeform placement: update left/top based on delta instead of moving in tree
          const currentLeft = parseFloat(styles.left || '0') || 0;
          const currentTop = parseFloat(styles.top || '0') || 0;
         
         commandBus.execute({
           type: NODE_COMMAND_TYPES.UPDATE_PROPS,
           payload: {
             nodeId: activeData.nodeId as NodeId,
             patch: { 
               styles: { 
                 ...(activeNode.props.styles as Record<string, string>), 
                 left: `${currentLeft + delta.x}px`, 
                 top: `${currentTop + delta.y}px` 
               } 
             }
           }
         });
         return;
       }

       // Move node
       if (activeData.nodeId === overData.nodeId) return;
       if (activeData.nodeId === document.rootNodeId) return; // Cannot move root
       
       commandBus.execute({
         type: NODE_COMMAND_TYPES.MOVE,
         payload: {
           nodeId: activeData.nodeId,
           toParentId: overData.nodeId,
           toSlotName: 'children',
           toIndex: 99999 // append to end
         }
       });
    }
  }, [commandBus, document]);

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
      } else if (isCtrl && e.key === 'd') {
        e.preventDefault();
        handleDuplicateNode();
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
  }, [handleUndo, handleRedo, handleSave, handleDuplicateNode, handleDeleteNode, editorStore]);

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
          onPublish={handlePublish}
          isPublishing={isPublishing}
          onTogglePreview={() =>
            editorStore.getState().setPreviewMode(!isPreviewMode)
          }
          pageTitle={document.document.title}
        />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
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
                onSelect={(id, e) => {
                  if (e.ctrlKey || e.metaKey) {
                    editorStore.getState().toggleSelect(id);
                  } else {
                    editorStore.getState().select(id);
                  }
                }}
                onDuplicate={handleDuplicateNode}
                onDelete={handleDeleteNode}
              />
              <BlockLibraryPanel onInsert={handleInsertNode} />
            </div>
          )}

          {/* Canvas */}
          <div style={{
            flex: 1,
            backgroundColor: '#0f172a',
            backgroundImage: 'radial-gradient(#334155 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px',
            overflow: 'auto',
            display: 'flex',
            justifyContent: 'center',
            padding: '2.5rem 2rem',
          }}>
            <CanvasFrame
              document={document}
              isEditor={!isPreviewMode}
              selectedNodeIds={selectedIds}
              hoveredNodeId={hoveredId}
              onNodeClick={handleNodeClick}
              onNodeHover={handleNodeHover}
              onUpdateProps={handleUpdateProps}
            />
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
                onUpdateProps={handleUpdateProps}
                onDelete={handleDeleteNode}
              />
            </div>
          )}
        </div>
        
        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
          {activeDragData ? (
            <div style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#4f46e5',
              color: 'white',
              borderRadius: '0.25rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}>
              Dragging {String(activeDragData.componentType || activeDragData.nodeId || '')}
            </div>
          ) : null}
        </DragOverlay>
        </DndContext>
      </div>
    </BuilderCtx.Provider>
  );
}
