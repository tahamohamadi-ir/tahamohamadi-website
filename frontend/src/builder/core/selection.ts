/**
 * Selection Service — Manages which nodes are currently selected
 *
 * This is EDITOR SESSION state — never persisted with the document.
 *
 * @module builder/core/selection
 */

import type { NodeId } from '../schema/document';

export interface SelectionState {
  /** Currently selected node IDs (supports multi-selection). */
  selectedIds: NodeId[];
  /** Currently hovered node ID. */
  hoveredId: NodeId | null;
  /** The "primary" selected node (the one whose inspector is shown). */
  primaryId: NodeId | null;
}

export const INITIAL_SELECTION_STATE: SelectionState = {
  selectedIds: [],
  hoveredId: null,
  primaryId: null,
};

/**
 * Select a single node (replaces current selection).
 */
export function selectNode(
  state: SelectionState,
  nodeId: NodeId,
): SelectionState {
  return {
    ...state,
    selectedIds: [nodeId],
    primaryId: nodeId,
  };
}

/**
 * Toggle a node in multi-selection (Ctrl/Cmd+Click).
 */
export function toggleNodeSelection(
  state: SelectionState,
  nodeId: NodeId,
): SelectionState {
  const isSelected = state.selectedIds.includes(nodeId);
  const newSelected = isSelected
    ? state.selectedIds.filter((id) => id !== nodeId)
    : [...state.selectedIds, nodeId];

  return {
    ...state,
    selectedIds: newSelected,
    primaryId: newSelected.length > 0 ? newSelected[newSelected.length - 1] : null,
  };
}

/**
 * Clear all selection.
 */
export function clearSelection(state: SelectionState): SelectionState {
  return {
    ...state,
    selectedIds: [],
    primaryId: null,
  };
}

/**
 * Set the hovered node.
 */
export function setHoveredNode(
  state: SelectionState,
  nodeId: NodeId | null,
): SelectionState {
  return {
    ...state,
    hoveredId: nodeId,
  };
}

/**
 * Select multiple nodes.
 */
export function selectNodes(
  state: SelectionState,
  nodeIds: NodeId[],
): SelectionState {
  return {
    ...state,
    selectedIds: nodeIds,
    primaryId: nodeIds.length > 0 ? nodeIds[nodeIds.length - 1] : null,
  };
}
