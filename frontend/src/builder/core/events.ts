/**
 * Event Bus — Lightweight pub/sub for internal editor communication
 *
 * Decouples subsystems (canvas, inspector, layers, history) from each other.
 * No external dependencies.
 *
 * @module builder/core/events
 */

export type EventHandler<T = unknown> = (payload: T) => void;

export interface BuilderEventMap {
  // Document events
  'document:loaded': { documentId: string };
  'document:changed': { affectedNodeIds: string[] };
  'document:saved': { revision: number };

  // Node events
  'node:inserted': { nodeId: string; parentId: string; slotName: string };
  'node:deleted': { nodeId: string };
  'node:moved': { nodeId: string; fromParent: string; toParent: string };
  'node:propsChanged': { nodeId: string; changedKeys: string[] };

  // Selection events
  'selection:changed': { nodeIds: string[] };
  'selection:cleared': void;

  // History events
  'history:pushed': { commandType: string };
  'history:undone': { commandType: string };
  'history:redone': { commandType: string };

  // Editor events
  'editor:ready': void;
  'editor:error': { message: string; details?: unknown };
}

type EventName = keyof BuilderEventMap;

/**
 * A simple, synchronous event bus for the builder editor.
 *
 * All events are typed via BuilderEventMap.
 */
export class EventBus {
  private listeners = new Map<string, Set<EventHandler>>();

  /**
   * Subscribe to an event.
   * @returns An unsubscribe function.
   */
  on<K extends EventName>(
    event: K,
    handler: EventHandler<BuilderEventMap[K]>,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const handlers = this.listeners.get(event)!;
    handlers.add(handler as EventHandler);

    return () => {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  /**
   * Subscribe to an event, but only fire once.
   */
  once<K extends EventName>(
    event: K,
    handler: EventHandler<BuilderEventMap[K]>,
  ): () => void {
    const unsubscribe = this.on(event, (payload) => {
      unsubscribe();
      handler(payload);
    });
    return unsubscribe;
  }

  /**
   * Emit an event to all registered handlers.
   */
  emit<K extends EventName>(event: K, payload: BuilderEventMap[K]): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;

    for (const handler of handlers) {
      try {
        handler(payload);
      } catch (error) {
        console.error(`[EventBus] Error in handler for "${event}":`, error);
      }
    }
  }

  /**
   * Remove all listeners for a specific event, or all events.
   */
  clear(event?: EventName): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get the number of listeners for an event.
   */
  listenerCount(event: EventName): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

/** Singleton event bus for the builder. */
export const builderEvents = new EventBus();
