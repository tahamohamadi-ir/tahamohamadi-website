/**
 * Collaboration Adapter
 *
 * Interfaces with the WebSocket / CRDT backend to broadcast and receive
 * document patches and presence events.
 *
 * @module builder/collaboration/collaboration-adapter
 */

import type { Patch } from '../core/history';
import type { NodeId } from '../schema/document';
import type { PresenceStoreApi, Collaborator } from './presence-store';
import type { CommandBus } from '../core/command-bus';

export interface SyncMessage {
  type: 'sync.patches';
  clientId: string;
  patches: Patch[];
}

export interface PresenceMessage {
  type: 'presence.update';
  clientId: string;
  selections: NodeId[];
  hoveredId: NodeId | null;
}

export interface JoinMessage {
  type: 'presence.join';
  client: Collaborator;
}

export interface LeaveMessage {
  type: 'presence.leave';
  clientId: string;
}

export type CollaborationMessage =
  | SyncMessage
  | PresenceMessage
  | JoinMessage
  | LeaveMessage;

export interface CollaborationConfig {
  wsUrl: string;
  pageId: string;
  localClient: Collaborator;
  presenceStore: PresenceStoreApi;
  commandBus: CommandBus;
  applyRemotePatches: (patches: Patch[]) => void;
}

export class CollaborationAdapter {
  private ws: WebSocket | null = null;
  private config: CollaborationConfig;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: CollaborationConfig) {
    this.config = config;
    this.config.presenceStore.getState().setLocalClientId(config.localClient.id);
  }

  public connect() {
    if (this.ws) return;

    this.ws = new WebSocket(`${this.config.wsUrl}/${this.config.pageId}`);

    this.ws.onopen = () => {
      console.log('[CollaborationAdapter] Connected to sync server.');
      this.broadcastJoin();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as CollaborationMessage;
        this.handleMessage(msg);
      } catch (err) {
        console.error('[CollaborationAdapter] Error parsing message:', err);
      }
    };

    this.ws.onclose = () => {
      console.log('[CollaborationAdapter] Disconnected. Reconnecting in 3s...');
      this.ws = null;
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    };
  }

  public disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public broadcastPatches(patches: Patch[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    
    const msg: SyncMessage = {
      type: 'sync.patches',
      clientId: this.config.localClient.id,
      patches,
    };
    
    this.ws.send(JSON.stringify(msg));
  }

  public broadcastPresence(selections: NodeId[], hoveredId: NodeId | null) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const msg: PresenceMessage = {
      type: 'presence.update',
      clientId: this.config.localClient.id,
      selections,
      hoveredId,
    };

    this.ws.send(JSON.stringify(msg));
  }

  private broadcastJoin() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const msg: JoinMessage = {
      type: 'presence.join',
      client: this.config.localClient,
    };
    this.ws.send(JSON.stringify(msg));
  }

  private handleMessage(msg: CollaborationMessage) {
    const presence = this.config.presenceStore.getState();

    switch (msg.type) {
      case 'sync.patches':
        // Prevent echoing our own patches
        if (msg.clientId !== this.config.localClient.id) {
          this.config.applyRemotePatches(msg.patches);
        }
        break;

      case 'presence.update':
        if (msg.clientId !== this.config.localClient.id) {
          presence.updateSelection(msg.clientId, msg.selections);
          presence.updateHover(msg.clientId, msg.hoveredId);
        }
        break;

      case 'presence.join':
        if (msg.client.id !== this.config.localClient.id) {
          presence.addCollaborator(msg.client);
        }
        break;

      case 'presence.leave':
        presence.removeCollaborator(msg.clientId);
        break;
    }
  }
}
