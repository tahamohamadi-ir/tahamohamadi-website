/**
 * Interaction Types
 *
 * Blueprint Part 21: Interaction Engine
 * Defines Triggers, Actions, and their runtime models.
 *
 * @module builder/interactions/interaction-types
 */

import type { ASTNode } from './expression-engine';

export type TriggerType =
  | 'pointer.click'
  | 'pointer.doubleClick'
  | 'pointer.enter'
  | 'pointer.leave'
  | 'focus'
  | 'blur'
  | 'viewport.enter'
  | 'viewport.leave'
  | 'form.submit'
  | 'timer';

export interface TriggerDefinition {
  type: TriggerType;
  /** 'self' | 'document' | 'window' | string (nodeId) */
  target?: string;
  /** For timers or debounced triggers */
  delay?: number;
  /** Only fire once */
  once?: boolean;
}

export type ActionType =
  | 'navigate'
  | 'scrollTo'
  | 'modal.open'
  | 'modal.close'
  | 'state.set'
  | 'state.toggle'
  | 'class.add'
  | 'class.remove'
  | 'class.toggle'
  | 'animation.play'
  | 'form.submit'
  | 'copyToClipboard';

export interface ActionDefinition {
  type: ActionType;
  /** The target node or element to act upon (if applicable) */
  target?: string;
  /** Payload / arguments for the action */
  payload?: Record<string, unknown>;
}

export interface InteractionDefinition {
  id: string;
  trigger: TriggerDefinition;
  /** Condition evaluating to true to run actions */
  condition?: ASTNode;
  actions: ActionDefinition[];
}
