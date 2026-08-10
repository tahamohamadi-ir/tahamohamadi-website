/**
 * Clipboard Service — Copy/Paste operations for builder nodes
 *
 * Uses the browser's Clipboard API where available, with a fallback
 * to an in-memory clipboard.
 *
 * @module builder/core/clipboard
 */

import type { PageNode, NodeId, PageDocument } from '../schema/document';

// ---------------------------------------------------------------------------
// Clipboard Data
// ---------------------------------------------------------------------------

export interface ClipboardData {
  /** The copied nodes (deep snapshot). */
  nodes: Record<NodeId, PageNode>;
  /** The root node ID of the copied subtree. */
  rootId: NodeId;
  /** Timestamp of the copy operation. */
  copiedAt: number;
}

// ---------------------------------------------------------------------------
// In-memory fallback clipboard
// ---------------------------------------------------------------------------

let memoryClipboard: ClipboardData | null = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Deep-clone a subtree from the document starting at the given node.
 */
function cloneSubtree(
  document: PageDocument,
  nodeId: NodeId,
): Record<NodeId, PageNode> {
  const result: Record<NodeId, PageNode> = {};
  const node = document.nodes[nodeId];
  if (!node) return result;

  result[nodeId] = JSON.parse(JSON.stringify(node));

  for (const children of Object.values(node.slots)) {
    for (const childId of children) {
      Object.assign(result, cloneSubtree(document, childId));
    }
  }

  return result;
}

/**
 * Regenerate all node IDs in a subtree to avoid collisions on paste.
 */
function reIdSubtree(
  nodes: Record<NodeId, PageNode>,
  rootId: NodeId,
  idGenerator: () => string,
): { nodes: Record<NodeId, PageNode>; rootId: NodeId } {
  const idMap = new Map<NodeId, NodeId>();

  // Generate new IDs for all nodes
  for (const oldId of Object.keys(nodes)) {
    idMap.set(oldId, idGenerator());
  }

  const newNodes: Record<NodeId, PageNode> = {};
  for (const [oldId, node] of Object.entries(nodes)) {
    const newId = idMap.get(oldId)!;
    const newSlots: Record<string, NodeId[]> = {};

    for (const [slotName, children] of Object.entries(node.slots)) {
      newSlots[slotName] = children.map((childId) => idMap.get(childId) ?? childId);
    }

    newNodes[newId] = {
      ...node,
      id: newId,
      slots: newSlots,
      metadata: {
        ...node.metadata,
        name: node.metadata?.name ? `${node.metadata.name} (copy)` : undefined,
      },
    };
  }

  return {
    nodes: newNodes,
    rootId: idMap.get(rootId)!,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Copy a node (and its subtree) to clipboard.
 */
export function copyNode(document: PageDocument, nodeId: NodeId): ClipboardData {
  const nodes = cloneSubtree(document, nodeId);
  const data: ClipboardData = {
    nodes,
    rootId: nodeId,
    copiedAt: Date.now(),
  };

  memoryClipboard = data;

  // Try to also write to system clipboard
  try {
    const json = JSON.stringify(data);
    navigator.clipboard?.writeText(json).catch(() => {
      // Silently fail — memory clipboard is the fallback
    });
  } catch {
    // Not available (e.g., in iframe without permission)
  }

  return data;
}

/**
 * Get clipboard data, ready for pasting (with re-generated IDs).
 */
export function getClipboardForPaste(
  idGenerator: () => string,
): { nodes: Record<NodeId, PageNode>; rootId: NodeId } | null {
  if (!memoryClipboard) return null;

  return reIdSubtree(memoryClipboard.nodes, memoryClipboard.rootId, idGenerator);
}

/**
 * Check if there's data on the clipboard.
 */
export function hasClipboardData(): boolean {
  return memoryClipboard !== null;
}

/**
 * Clear the clipboard.
 */
export function clearClipboard(): void {
  memoryClipboard = null;
}
