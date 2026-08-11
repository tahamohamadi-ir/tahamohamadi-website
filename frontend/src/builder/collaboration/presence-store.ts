/**
 * Presence Store
 *
 * Manages the state of remote users in a collaborative editing session.
 * Tracks connected users, their selections, and cursor positions.
 *
 * @module builder/collaboration/presence-store
 */

import { createStore } from 'zustand';
import type { NodeId } from '../schema/document';

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  avatarUrl?: string;
}

export interface PresenceState {
  /** The local user's connection ID */
  localClientId: string | null;
  /** Map of connected collaborators */
  collaborators: Record<string, Collaborator>;
  /** Selected node IDs per client */
  selections: Record<string, NodeId[]>;
  /** Hovered node ID per client */
  hovers: Record<string, NodeId | null>;
}

export interface PresenceActions {
  setLocalClientId: (id: string) => void;
  addCollaborator: (client: Collaborator) => void;
  removeCollaborator: (clientId: string) => void;
  updateSelection: (clientId: string, selectedIds: NodeId[]) => void;
  updateHover: (clientId: string, hoveredId: NodeId | null) => void;
  clear: () => void;
}

export type PresenceStore = PresenceState & PresenceActions;

const initialState: PresenceState = {
  localClientId: null,
  collaborators: {},
  selections: {},
  hovers: {},
};

export const createPresenceStore = () =>
  createStore<PresenceStore>((set) => ({
    ...initialState,

    setLocalClientId: (id) => set({ localClientId: id }),

    addCollaborator: (client) =>
      set((state) => ({
        collaborators: { ...state.collaborators, [client.id]: client },
      })),

    removeCollaborator: (clientId) =>
      set((state) => {
        const newCollaborators = { ...state.collaborators };
        delete newCollaborators[clientId];

        const newSelections = { ...state.selections };
        delete newSelections[clientId];

        const newHovers = { ...state.hovers };
        delete newHovers[clientId];

        return {
          collaborators: newCollaborators,
          selections: newSelections,
          hovers: newHovers,
        };
      }),

    updateSelection: (clientId, selectedIds) =>
      set((state) => ({
        selections: { ...state.selections, [clientId]: selectedIds },
      })),

    updateHover: (clientId, hoveredId) =>
      set((state) => ({
        hovers: { ...state.hovers, [clientId]: hoveredId },
      })),

    clear: () => set(initialState),
  }));

export type PresenceStoreApi = ReturnType<typeof createPresenceStore>;
