/**
 * Editor Store — Zustand store for editor session state
 *
 * This is NON-PERSISTENT state — selection, hover, drag, zoom, panels, etc.
 * Never saved to the database.
 *
 * @module builder/state/editor-store
 */

import { createStore } from 'zustand/vanilla';
import type { NodeId, BreakpointId } from '../schema/document';
import type { SelectionState } from '../core/selection';
import {
  INITIAL_SELECTION_STATE,
  selectNode,
  toggleNodeSelection,
  clearSelection,
  setHoveredNode,
  selectNodes,
} from '../core/selection';

// ---------------------------------------------------------------------------
// Drag state
// ---------------------------------------------------------------------------

export interface DragState {
  isDragging: boolean;
  dragNodeId: NodeId | null;
  dropTargetId: NodeId | null;
  dropSlotName: string | null;
  dropIndex: number | null;
}

const INITIAL_DRAG_STATE: DragState = {
  isDragging: false,
  dragNodeId: null,
  dropTargetId: null,
  dropSlotName: null,
  dropIndex: null,
};

// ---------------------------------------------------------------------------
// Panel state
// ---------------------------------------------------------------------------

export type PanelId = 'layers' | 'inspector' | 'library' | 'styles' | 'settings';

// ---------------------------------------------------------------------------
// Editor State
// ---------------------------------------------------------------------------

export interface EditorState {
  // Selection
  selection: SelectionState;

  // Drag
  drag: DragState;

  // Viewport
  activeBreakpoint: BreakpointId;
  zoom: number;

  // Panels
  openPanels: Set<PanelId>;

  // Mode
  isPreviewMode: boolean;

  // Autosave
  isSaving: boolean;
  lastSavedAt: number | null;
}

export interface EditorActions {
  // Selection
  select: (nodeId: NodeId) => void;
  toggleSelect: (nodeId: NodeId) => void;
  clearSelect: () => void;
  hover: (nodeId: NodeId | null) => void;
  selectMultiple: (nodeIds: NodeId[]) => void;

  // Drag
  startDrag: (nodeId: NodeId) => void;
  updateDropTarget: (targetId: NodeId | null, slotName: string | null, index: number | null) => void;
  endDrag: () => void;

  // Viewport
  setBreakpoint: (breakpointId: BreakpointId) => void;
  setZoom: (zoom: number) => void;

  // Panels
  togglePanel: (panelId: PanelId) => void;
  openPanel: (panelId: PanelId) => void;
  closePanel: (panelId: PanelId) => void;

  // Mode
  setPreviewMode: (enabled: boolean) => void;

  // Autosave status
  setSaving: (saving: boolean) => void;
  setLastSavedAt: (timestamp: number) => void;
}

export type EditorStore = EditorState & EditorActions;

// ---------------------------------------------------------------------------
// Store factory
// ---------------------------------------------------------------------------

export function createEditorStore() {
  return createStore<EditorStore>((set) => ({
    // Initial state
    selection: INITIAL_SELECTION_STATE,
    drag: INITIAL_DRAG_STATE,
    activeBreakpoint: 'bp_desktop',
    zoom: 1,
    openPanels: new Set<PanelId>(['layers', 'inspector']),
    isPreviewMode: false,
    isSaving: false,
    lastSavedAt: null,

    // Selection actions
    select: (nodeId) =>
      set((s) => ({ selection: selectNode(s.selection, nodeId) })),
    toggleSelect: (nodeId) =>
      set((s) => ({ selection: toggleNodeSelection(s.selection, nodeId) })),
    clearSelect: () =>
      set((s) => ({ selection: clearSelection(s.selection) })),
    hover: (nodeId) =>
      set((s) => ({ selection: setHoveredNode(s.selection, nodeId) })),
    selectMultiple: (nodeIds) =>
      set((s) => ({ selection: selectNodes(s.selection, nodeIds) })),

    // Drag actions
    startDrag: (nodeId) =>
      set({
        drag: {
          isDragging: true,
          dragNodeId: nodeId,
          dropTargetId: null,
          dropSlotName: null,
          dropIndex: null,
        },
      }),
    updateDropTarget: (targetId, slotName, index) =>
      set((s) => ({
        drag: {
          ...s.drag,
          dropTargetId: targetId,
          dropSlotName: slotName,
          dropIndex: index,
        },
      })),
    endDrag: () => set({ drag: INITIAL_DRAG_STATE }),

    // Viewport actions
    setBreakpoint: (breakpointId) =>
      set({ activeBreakpoint: breakpointId }),
    setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(2, zoom)) }),

    // Panel actions
    togglePanel: (panelId) =>
      set((s) => {
        const newPanels = new Set(s.openPanels);
        if (newPanels.has(panelId)) {
          newPanels.delete(panelId);
        } else {
          newPanels.add(panelId);
        }
        return { openPanels: newPanels };
      }),
    openPanel: (panelId) =>
      set((s) => {
        const newPanels = new Set(s.openPanels);
        newPanels.add(panelId);
        return { openPanels: newPanels };
      }),
    closePanel: (panelId) =>
      set((s) => {
        const newPanels = new Set(s.openPanels);
        newPanels.delete(panelId);
        return { openPanels: newPanels };
      }),

    // Mode
    setPreviewMode: (enabled) => set({ isPreviewMode: enabled }),

    // Autosave status
    setSaving: (saving) => set({ isSaving: saving }),
    setLastSavedAt: (timestamp) =>
      set({ lastSavedAt: timestamp, isSaving: false }),
  }));
}

export type EditorStoreApi = ReturnType<typeof createEditorStore>;
