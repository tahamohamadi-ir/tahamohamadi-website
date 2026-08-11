import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CollaborationAdapter } from './collaboration-adapter';
import { createPresenceStore } from './presence-store';
import type { PresenceStoreApi } from './presence-store';
import { CommandBus } from '../core/command-bus';

describe('Collaboration Adapter', () => {
  let presenceStore: PresenceStoreApi;
  let commandBus: CommandBus;
  let adapter: CollaborationAdapter;
  let mockApplyPatches: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock WebSocket
    // @ts-ignore
    global.WebSocket = class {
      static OPEN = 1;
      readyState = 1; // OPEN
      send = vi.fn();
      close = vi.fn();
      constructor(public url: string) {
        setTimeout(() => this.onopen?.(), 10);
      }
      onopen?: () => void;
      onmessage?: (ev: { data: string }) => void;
      onclose?: () => void;
    };

    presenceStore = createPresenceStore();
    commandBus = new CommandBus({
      getDocument: () => ({} as any),
      applyPatches: vi.fn(),
      onCommandExecuted: vi.fn(),
    });
    
    mockApplyPatches = vi.fn();

    adapter = new CollaborationAdapter({
      wsUrl: 'ws://localhost',
      pageId: 'page-1',
      localClient: { id: 'client-1', name: 'Alice', color: 'red' },
      presenceStore,
      commandBus,
      applyRemotePatches: mockApplyPatches,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets local client ID on init', () => {
    expect(presenceStore.getState().localClientId).toBe('client-1');
  });

  it('connects to websocket and broadcasts join', async () => {
    adapter.connect();
    
    // wait for onopen
    await new Promise(resolve => setTimeout(resolve, 20));

    const ws = (adapter as any).ws;
    expect(ws.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'presence.join',
        client: { id: 'client-1', name: 'Alice', color: 'red' }
      })
    );
  });

  it('handles remote sync.patches message', async () => {
    adapter.connect();
    await new Promise(resolve => setTimeout(resolve, 20));

    const ws = (adapter as any).ws;
    const remotePatches = [{ op: 'add', path: '/nodes/n2', value: {} }];

    ws.onmessage({
      data: JSON.stringify({
        type: 'sync.patches',
        clientId: 'client-2',
        patches: remotePatches
      })
    });

    expect(mockApplyPatches).toHaveBeenCalledWith(remotePatches);
  });

  it('ignores sync.patches from self', async () => {
    adapter.connect();
    await new Promise(resolve => setTimeout(resolve, 20));

    const ws = (adapter as any).ws;
    ws.onmessage({
      data: JSON.stringify({
        type: 'sync.patches',
        clientId: 'client-1', // same as local
        patches: []
      })
    });

    expect(mockApplyPatches).not.toHaveBeenCalled();
  });
});
