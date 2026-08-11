import { describe, it, expect, beforeEach } from 'vitest';
import { createPresenceStore } from './presence-store';

describe('Presence Store', () => {
  let usePresenceStore: ReturnType<typeof createPresenceStore>;

  beforeEach(() => {
    usePresenceStore = createPresenceStore();
  });

  it('initializes correctly', () => {
    const state = usePresenceStore.getState();
    expect(state.localClientId).toBeNull();
    expect(state.collaborators).toEqual({});
  });

  it('adds and removes collaborators', () => {
    const store = usePresenceStore.getState();
    store.addCollaborator({ id: 'user-1', name: 'Alice', color: '#ff0000' });

    expect(usePresenceStore.getState().collaborators['user-1']).toBeDefined();
    expect(usePresenceStore.getState().collaborators['user-1'].name).toBe('Alice');

    usePresenceStore.getState().removeCollaborator('user-1');
    expect(usePresenceStore.getState().collaborators['user-1']).toBeUndefined();
  });

  it('updates selection and hover state for collaborators', () => {
    const store = usePresenceStore.getState();
    store.addCollaborator({ id: 'user-1', name: 'Alice', color: '#ff0000' });
    
    store.updateSelection('user-1', ['node-123']);
    store.updateHover('user-1', 'node-456');

    expect(usePresenceStore.getState().selections['user-1']).toEqual(['node-123']);
    expect(usePresenceStore.getState().hovers['user-1']).toBe('node-456');

    // Removing collaborator cleans up selection and hover
    store.removeCollaborator('user-1');
    expect(usePresenceStore.getState().selections['user-1']).toBeUndefined();
    expect(usePresenceStore.getState().hovers['user-1']).toBeUndefined();
  });
});
