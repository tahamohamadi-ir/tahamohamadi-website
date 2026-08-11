/**
 * Interaction Registry
 *
 * Stores all supported triggers and actions in the system.
 * Plugins can register custom actions or triggers here.
 *
 * @module builder/interactions/interaction-registry
 */

import type { ActionDefinition } from './interaction-types';
import type { ExecutionContext } from './expression-engine';

export type ActionHandler = (
  action: ActionDefinition,
  context: ExecutionContext,
  event?: Event,
) => void | Promise<void>;

class InteractionRegistry {
  private actions = new Map<string, ActionHandler>();

  /**
   * Register a new action type and its handler.
   */
  registerAction(type: string, handler: ActionHandler) {
    if (this.actions.has(type)) {
      console.warn(`[InteractionRegistry] Overwriting existing action: ${type}`);
    }
    this.actions.set(type, handler);
  }

  /**
   * Get an action handler by type.
   */
  getAction(type: string): ActionHandler | undefined {
    return this.actions.get(type);
  }

  /**
   * Execute an action if registered.
   */
  async executeAction(
    action: ActionDefinition,
    context: ExecutionContext,
    event?: Event,
  ): Promise<void> {
    const handler = this.actions.get(action.type);
    if (!handler) {
      console.warn(`[InteractionRegistry] Unknown action type: ${action.type}`);
      return;
    }

    try {
      await handler(action, context, event);
    } catch (e) {
      console.error(`[InteractionRegistry] Error executing action ${action.type}:`, e);
    }
  }
}

export const interactionRegistry = new InteractionRegistry();

// ---------------------------------------------------------------------------
// Register Built-in Actions
// ---------------------------------------------------------------------------

interactionRegistry.registerAction('navigate', (action) => {
  const to = action.payload?.to;
  if (typeof to === 'string') {
    window.location.href = to;
  }
});

interactionRegistry.registerAction('scrollTo', (action) => {
  const targetId = action.target;
  if (targetId) {
    const el = document.querySelector(`[data-builder-node="${targetId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
});

interactionRegistry.registerAction('copyToClipboard', async (action) => {
  const text = action.payload?.text;
  if (typeof text === 'string') {
    await navigator.clipboard.writeText(text);
  }
});
