import { describe, it, expect } from 'vitest';
import { createDocumentStore, createEmptyDocument } from './document-store';

describe('DocumentStore', () => {
  it('initializes with empty document schema', () => {
    const store = createDocumentStore(createEmptyDocument('page_test_1'));
    const state = store.getState();

    expect(state.document.document.id).toBe('page_test_1');
    expect(state.isDirty).toBe(false);
    expect(state.revision).toBe(0);
    expect(state.getRootNode()?.type).toBe('core.page');
  });

  it('applies patches and updates isDirty', () => {
    const store = createDocumentStore(createEmptyDocument('page_test_2'));
    const rootId = store.getState().document.rootNodeId;

    store.getState().applyPatches([
      {
        op: 'replace',
        path: `nodes.${rootId}.props`,
        value: { title: 'Test Title' },
        oldValue: {},
      },
    ]);

    const state = store.getState();
    expect(state.isDirty).toBe(true);
    expect(state.document.nodes[rootId].props.title).toBe('Test Title');
  });
});
