import { describe, it, expect, beforeEach } from 'vitest';
import { CommandBus } from './command-bus';
import { registerNodeCommands, NODE_COMMAND_TYPES } from './commands/node-commands';
import { createDocumentStore, createEmptyDocument } from '../state';

describe('CommandBus & Node Commands', () => {
  let docStore: ReturnType<typeof createDocumentStore>;
  let commandBus: CommandBus;

  beforeEach(() => {
    docStore = createDocumentStore(createEmptyDocument('page_test'));
    commandBus = new CommandBus({
      getDocument: () => docStore.getState().document,
      applyPatches: (patches) => docStore.getState().applyPatches(patches),
    });
    registerNodeCommands(commandBus);
  });

  it('executes node.insert command and updates document state', () => {
    const rootId = docStore.getState().document.rootNodeId;

    const result = commandBus.execute({
      type: NODE_COMMAND_TYPES.INSERT,
      payload: {
        parentId: rootId,
        slotName: 'children',
        node: {
          type: 'ui.button',
          componentVersion: 1,
          props: { label: 'Click Me' },
          slots: {},
          styleRefs: [],
        },
      },
    });

    const doc = docStore.getState().document;
    const insertedId = result.affectedNodeIds[0];

    expect(doc.nodes[insertedId]).toBeDefined();
    expect(doc.nodes[insertedId].type).toBe('ui.button');
    expect(doc.nodes[insertedId].props.label).toBe('Click Me');
    expect(doc.nodes[rootId].slots.children).toContain(insertedId);
  });

  it('executes node.updateProps command', () => {
    const rootId = docStore.getState().document.rootNodeId;
    const insertRes = commandBus.execute({
      type: NODE_COMMAND_TYPES.INSERT,
      payload: {
        parentId: rootId,
        slotName: 'children',
        node: {
          type: 'content.heading',
          componentVersion: 1,
          props: { text: 'Old Title', level: 2 },
          slots: {},
          styleRefs: [],
        },
      },
    });

    const node = insertRes.affectedNodeIds[0];

    commandBus.execute({
      type: NODE_COMMAND_TYPES.UPDATE_PROPS,
      payload: {
        nodeId: node,
        patch: { text: 'New Title' },
      },
    });

    const updatedNode = docStore.getState().document.nodes[node];
    expect(updatedNode.props.text).toBe('New Title');
    expect(updatedNode.props.level).toBe(2);
  });

  it('executes node.duplicate command', () => {
    const rootId = docStore.getState().document.rootNodeId;
    const insertRes = commandBus.execute({
      type: NODE_COMMAND_TYPES.INSERT,
      payload: {
        parentId: rootId,
        slotName: 'children',
        node: {
          type: 'ui.button',
          componentVersion: 1,
          props: { label: 'Original' },
          slots: {},
          styleRefs: [],
        },
      },
    });

    const originalId = insertRes.affectedNodeIds[0];

    const dupRes = commandBus.execute({
      type: NODE_COMMAND_TYPES.DUPLICATE,
      payload: { nodeId: originalId },
    });

    const doc = docStore.getState().document;
    const duplicatedId = dupRes.affectedNodeIds[0];

    expect(duplicatedId).not.toBe(originalId);
    expect(doc.nodes[duplicatedId]).toBeDefined();
    expect(doc.nodes[duplicatedId].props.label).toBe('Original');
    expect(doc.nodes[rootId].slots.children.length).toBe(2);
  });

  it('executes node.delete and node.batchDelete commands', () => {
    const rootId = docStore.getState().document.rootNodeId;

    const n1 = commandBus.execute({
      type: NODE_COMMAND_TYPES.INSERT,
      payload: {
        parentId: rootId,
        slotName: 'children',
        node: { type: 'ui.button', componentVersion: 1, props: {}, slots: {}, styleRefs: [] },
      },
    }).affectedNodeIds[0];

    const n2 = commandBus.execute({
      type: NODE_COMMAND_TYPES.INSERT,
      payload: {
        parentId: rootId,
        slotName: 'children',
        node: { type: 'ui.button', componentVersion: 1, props: {}, slots: {}, styleRefs: [] },
      },
    }).affectedNodeIds[0];

    commandBus.execute({
      type: NODE_COMMAND_TYPES.BATCH_DELETE,
      payload: { nodeIds: [n1, n2] },
    });

    const doc = docStore.getState().document;
    expect(doc.nodes[n1]).toBeUndefined();
    expect(doc.nodes[n2]).toBeUndefined();
    expect(doc.nodes[rootId].slots.children).toEqual([]);
  });
});
