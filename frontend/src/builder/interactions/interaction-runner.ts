/**
 * Interaction Runner
 *
 * Listens for DOM events and evaluates registered interactions.
 * If the interaction condition evaluates to true, it executes the actions.
 *
 * @module builder/interactions/interaction-runner
 */

import { evaluateExpression } from './expression-engine';
import type { ExecutionContext } from './expression-engine';
import type { InteractionDefinition } from './interaction-types';
import { interactionRegistry } from './interaction-registry';

export class InteractionRunner {
  private interactions: InteractionDefinition[] = [];
  private context: ExecutionContext = {};

  constructor(initialContext?: ExecutionContext) {
    if (initialContext) {
      this.context = { ...initialContext };
    }
  }

  /**
   * Load interactions from the page document.
   */
  setInteractions(interactions: InteractionDefinition[]) {
    this.interactions = interactions;
  }

  /**
   * Update the execution context (e.g., when route params or state change).
   */
  updateContext(newContext: Partial<ExecutionContext>) {
    this.context = { ...this.context, ...newContext };
  }

  /**
   * Handle an incoming event (e.g., click, hover).
   */
  async handleEvent(
    eventType: string,
    targetNodeId: string,
    event?: Event,
  ) {
    // Find all interactions matching this trigger
    const matched = this.interactions.filter(
      (i) => i.trigger.type === eventType && i.trigger.target === targetNodeId,
    );

    for (const interaction of matched) {
      // Check condition
      if (interaction.condition) {
        const isTrue = evaluateExpression(interaction.condition, this.context);
        if (!isTrue) {
          continue;
        }
      }

      // Execute actions sequentially
      for (const action of interaction.actions) {
        await interactionRegistry.executeAction(action, this.context, event);
      }
    }
  }
}
