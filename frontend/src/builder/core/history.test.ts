import { describe, it, expect, beforeEach } from 'vitest';
import { HistoryEngine } from './history';
import { CommandBus } from './command-bus';
import { registerNodeCommands, NODE_COMMAND_TYPES } from './commands/node-commands';
import { createDocumentStore, createEmptyDocument } from '../state';

describe('HistoryEngine Undo/Redo', () => {
  let docStore: ReturnType<typeof createDocumentStore>;
  let commandBus: CommandBus;
  let history: HistoryEngine;

  beforeEach(() => {
    docStore = createDocumentStore(createEmptyDocument('page_test'));
    history = new HistoryEngine({
      applyPatches: (patches) => docStore.getState().applyPatches(patches),
    });
    commandBus = new CommandBus({
      getDocument: () => docStore.getState().document,
      applyPatches: (patches) => docStore.getState().applyPatches(patches),
      onCommandExecuted: (cmd, result) => {
        history.push(cmd, result);
      },
    });
    registerNodeCommands(commandBus);
  });

  it('pushes commands and performs undo/redo cleanly', () => {
    const rootId = docStore.getState().document.rootNodeId;

    const res = commandBus.execute({
      type: NODE_COMMAND_TYPES.INSERT,
      payload: {
        parentId: rootId,
        slotName: 'children',
        node: { type: 'content.text', componentVersion: 1, props: { content: 'Initial' }, slots: {}, styleRefs: [] },
      },
    });

    const nodeId = res!.affectedNodeIds[0];
    expect(history.canUndo).toBe(true);

    // Undo
    history.undo();
    expect(docStore.getState().document.nodes[nodeId]).toBeUndefined();
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(true);

    // Redo
    history.redo();
    expect(docStore.getState().document.nodes[nodeId]).toBeDefined();
    expect(docStore.getState().document.nodes[nodeId].props.content).toBe('Initial');
  });
});
