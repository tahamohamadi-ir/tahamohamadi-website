/**
 * Node Commands — Handlers for node-level document mutations
 *
 * These are pure functions: they read the current document, compute patches,
 * and return them. They never mutate state directly.
 *
 * @module builder/core/commands/node-commands
 */

import { v4 as uuidv4 } from 'uuid';
import type { PageDocument, PageNode, NodeId } from '../../schema/document';
import type { BuilderCommand, CommandHandler, CommandResult, Patch } from '../command-bus';

// ---------------------------------------------------------------------------
// Command Type Constants
// ---------------------------------------------------------------------------

export const NODE_COMMAND_TYPES = {
  INSERT: 'node.insert',
  DELETE: 'node.delete',
  UPDATE_PROPS: 'node.updateProps',
  MOVE: 'node.move',
  DUPLICATE: 'node.duplicate',
  UPDATE_METADATA: 'node.updateMetadata',
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateNodeId(): string {
  return `node_${uuidv4().slice(0, 8)}`;
}

/**
 * Find which parent node and slot contain a given node ID.
 */
function findParentSlot(
  nodes: Record<NodeId, PageNode>,
  childId: NodeId,
): { parentId: NodeId; slotName: string; index: number } | null {
  for (const [nodeId, node] of Object.entries(nodes)) {
    for (const [slotName, children] of Object.entries(node.slots)) {
      const index = children.indexOf(childId);
      if (index >= 0) {
        return { parentId: nodeId, slotName, index };
      }
    }
  }
  return null;
}

/**
 * Collect all descendant node IDs recursively.
 */
function collectDescendants(
  nodes: Record<NodeId, PageNode>,
  nodeId: NodeId,
): NodeId[] {
  const result: NodeId[] = [];
  const node = nodes[nodeId];
  if (!node) return result;

  for (const children of Object.values(node.slots)) {
    for (const childId of children) {
      result.push(childId);
      result.push(...collectDescendants(nodes, childId));
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// node.insert
// ---------------------------------------------------------------------------

interface InsertPayload {
  parentId: NodeId;
  slotName: string;
  index?: number;
  node: Omit<PageNode, 'id'> & { id?: NodeId };
}

export const insertNodeHandler: CommandHandler = (
  document: PageDocument,
  command: BuilderCommand,
): CommandResult => {
  const payload = command.payload as unknown as InsertPayload;
  const { parentId, slotName } = payload;
  const index = payload.index ?? -1;

  const parent = document.nodes[parentId];
  if (!parent) {
    throw new Error(`Parent node "${parentId}" not found`);
  }

  const nodeId = payload.node.id || generateNodeId();
  const newNode: PageNode = {
    ...payload.node,
    id: nodeId,
    slots: payload.node.slots ?? {},
    styleRefs: payload.node.styleRefs ?? [],
    props: payload.node.props ?? {},
    componentVersion: payload.node.componentVersion ?? 1,
  };

  const currentSlot = parent.slots[slotName] ?? [];
  const insertIndex = index >= 0 ? Math.min(index, currentSlot.length) : currentSlot.length;
  const newSlot = [
    ...currentSlot.slice(0, insertIndex),
    nodeId,
    ...currentSlot.slice(insertIndex),
  ];

  const patches: Patch = [
    { op: 'add', path: `nodes.${nodeId}`, value: newNode },
    {
      op: 'replace',
      path: `nodes.${parentId}.slots.${slotName}`,
      value: newSlot,
      oldValue: currentSlot,
    },
  ];

  const inversePatches: Patch = [
    { op: 'remove', path: `nodes.${nodeId}`, oldValue: newNode },
    {
      op: 'replace',
      path: `nodes.${parentId}.slots.${slotName}`,
      value: currentSlot,
      oldValue: newSlot,
    },
  ];

  return {
    patches,
    inversePatches,
    affectedNodeIds: [nodeId, parentId],
  };
};

// ---------------------------------------------------------------------------
// node.delete
// ---------------------------------------------------------------------------

interface DeletePayload {
  nodeId: NodeId;
}

export const deleteNodeHandler: CommandHandler = (
  document: PageDocument,
  command: BuilderCommand,
): CommandResult => {
  const { nodeId } = command.payload as unknown as DeletePayload;

  if (nodeId === document.rootNodeId) {
    throw new Error('Cannot delete the root node');
  }

  const node = document.nodes[nodeId];
  if (!node) {
    throw new Error(`Node "${nodeId}" not found`);
  }

  const parentSlot = findParentSlot(document.nodes, nodeId);
  if (!parentSlot) {
    throw new Error(`Node "${nodeId}" has no parent`);
  }

  // Collect all descendants to delete
  const descendants = collectDescendants(document.nodes, nodeId);
  const allNodeIds = [nodeId, ...descendants];

  const patches: Patch = [];
  const inversePatches: Patch = [];

  // Remove from parent slot
  const currentSlot = document.nodes[parentSlot.parentId].slots[parentSlot.slotName];
  const newSlot = currentSlot.filter((id) => id !== nodeId);
  patches.push({
    op: 'replace',
    path: `nodes.${parentSlot.parentId}.slots.${parentSlot.slotName}`,
    value: newSlot,
    oldValue: currentSlot,
  });

  // Remove all nodes (deepest first for clean inverse)
  for (const id of allNodeIds.reverse()) {
    patches.push({
      op: 'remove',
      path: `nodes.${id}`,
      oldValue: document.nodes[id],
    });
  }

  // Inverse: re-add all nodes, then re-add to parent slot
  for (const id of [...allNodeIds].reverse()) {
    inversePatches.push({
      op: 'add',
      path: `nodes.${id}`,
      value: document.nodes[id],
    });
  }
  inversePatches.push({
    op: 'replace',
    path: `nodes.${parentSlot.parentId}.slots.${parentSlot.slotName}`,
    value: currentSlot,
    oldValue: newSlot,
  });

  return {
    patches,
    inversePatches,
    affectedNodeIds: [parentSlot.parentId, ...allNodeIds],
  };
};

// ---------------------------------------------------------------------------
// node.updateProps
// ---------------------------------------------------------------------------

interface UpdatePropsPayload {
  nodeId: NodeId;
  patch: Record<string, unknown>;
}

export const updatePropsHandler: CommandHandler = (
  document: PageDocument,
  command: BuilderCommand,
): CommandResult => {
  const { nodeId, patch } = command.payload as unknown as UpdatePropsPayload;

  const node = document.nodes[nodeId];
  if (!node) {
    throw new Error(`Node "${nodeId}" not found`);
  }

  const oldProps = { ...node.props };
  const newProps = { ...node.props, ...patch };

  // Build inverse: restore only the changed keys
  const inversePatch: Record<string, unknown> = {};
  for (const key of Object.keys(patch)) {
    inversePatch[key] = oldProps[key]; // may be undefined → will remove on undo
  }

  const patches: Patch = [
    {
      op: 'replace',
      path: `nodes.${nodeId}.props`,
      value: newProps,
      oldValue: oldProps,
    },
  ];

  const inversePatches: Patch = [
    {
      op: 'replace',
      path: `nodes.${nodeId}.props`,
      value: oldProps,
      oldValue: newProps,
    },
  ];

  return {
    patches,
    inversePatches,
    affectedNodeIds: [nodeId],
  };
};

// ---------------------------------------------------------------------------
// node.move
// ---------------------------------------------------------------------------

interface MovePayload {
  nodeId: NodeId;
  toParentId: NodeId;
  toSlotName: string;
  toIndex: number;
}

export const moveNodeHandler: CommandHandler = (
  document: PageDocument,
  command: BuilderCommand,
): CommandResult => {
  const { nodeId, toParentId, toSlotName, toIndex } =
    command.payload as unknown as MovePayload;

  if (nodeId === document.rootNodeId) {
    throw new Error('Cannot move the root node');
  }

  const node = document.nodes[nodeId];
  if (!node) {
    throw new Error(`Node "${nodeId}" not found`);
  }

  const fromSlot = findParentSlot(document.nodes, nodeId);
  if (!fromSlot) {
    throw new Error(`Node "${nodeId}" has no parent`);
  }

  const patches: Patch = [];
  const inversePatches: Patch = [];
  const affectedNodeIds = [nodeId, fromSlot.parentId, toParentId];

  // Remove from old slot
  const oldSlot =
    document.nodes[fromSlot.parentId].slots[fromSlot.slotName];
  const newOldSlot = oldSlot.filter((id) => id !== nodeId);

  patches.push({
    op: 'replace',
    path: `nodes.${fromSlot.parentId}.slots.${fromSlot.slotName}`,
    value: newOldSlot,
    oldValue: oldSlot,
  });

  // Insert into new slot
  const targetSlot =
    fromSlot.parentId === toParentId && fromSlot.slotName === toSlotName
      ? newOldSlot // Same slot: work with already-removed array
      : document.nodes[toParentId]?.slots[toSlotName] ?? [];

  const insertIdx = Math.min(toIndex, targetSlot.length);
  const newTargetSlot = [
    ...targetSlot.slice(0, insertIdx),
    nodeId,
    ...targetSlot.slice(insertIdx),
  ];

  // Only push a separate patch if it's a different slot
  if (fromSlot.parentId !== toParentId || fromSlot.slotName !== toSlotName) {
    patches.push({
      op: 'replace',
      path: `nodes.${toParentId}.slots.${toSlotName}`,
      value: newTargetSlot,
      oldValue: targetSlot,
    });
  } else {
    // Same slot — overwrite the previous patch
    patches[patches.length - 1] = {
      op: 'replace',
      path: `nodes.${toParentId}.slots.${toSlotName}`,
      value: newTargetSlot,
      oldValue: oldSlot,
    };
  }

  // Inverse: move back to original position
  inversePatches.push(
    {
      op: 'replace',
      path: `nodes.${toParentId}.slots.${toSlotName}`,
      value:
        fromSlot.parentId === toParentId && fromSlot.slotName === toSlotName
          ? oldSlot
          : targetSlot,
      oldValue: newTargetSlot,
    },
  );
  if (fromSlot.parentId !== toParentId || fromSlot.slotName !== toSlotName) {
    inversePatches.push({
      op: 'replace',
      path: `nodes.${fromSlot.parentId}.slots.${fromSlot.slotName}`,
      value: oldSlot,
      oldValue: newOldSlot,
    });
  }

  return { patches, inversePatches, affectedNodeIds };
};

// ---------------------------------------------------------------------------
// node.updateMetadata
// ---------------------------------------------------------------------------

interface UpdateMetadataPayload {
  nodeId: NodeId;
  metadata: Partial<PageNode['metadata']>;
}

export const updateMetadataHandler: CommandHandler = (
  document: PageDocument,
  command: BuilderCommand,
): CommandResult => {
  const { nodeId, metadata } =
    command.payload as unknown as UpdateMetadataPayload;

  const node = document.nodes[nodeId];
  if (!node) {
    throw new Error(`Node "${nodeId}" not found`);
  }

  const oldMetadata = node.metadata ?? {};
  const newMetadata = { ...oldMetadata, ...metadata };

  const patches: Patch = [
    {
      op: 'replace',
      path: `nodes.${nodeId}.metadata`,
      value: newMetadata,
      oldValue: oldMetadata,
    },
  ];

  const inversePatches: Patch = [
    {
      op: 'replace',
      path: `nodes.${nodeId}.metadata`,
      value: oldMetadata,
      oldValue: newMetadata,
    },
  ];

  return { patches, inversePatches, affectedNodeIds: [nodeId] };
};

// ---------------------------------------------------------------------------
// Register all node commands helper
// ---------------------------------------------------------------------------

export function registerNodeCommands(bus: {
  registerHandler: (type: string, handler: CommandHandler) => void;
}): void {
  bus.registerHandler(NODE_COMMAND_TYPES.INSERT, insertNodeHandler);
  bus.registerHandler(NODE_COMMAND_TYPES.DELETE, deleteNodeHandler);
  bus.registerHandler(NODE_COMMAND_TYPES.UPDATE_PROPS, updatePropsHandler);
  bus.registerHandler(NODE_COMMAND_TYPES.MOVE, moveNodeHandler);
  bus.registerHandler(NODE_COMMAND_TYPES.UPDATE_METADATA, updateMetadataHandler);
}
