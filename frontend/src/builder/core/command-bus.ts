/**
 * Command Bus — All document mutations pass through commands
 *
 * ADR-012: Command-only mutations
 *
 * NO UI component may directly mutate the document state.
 * Instead, all mutations are expressed as commands that produce
 * forward patches and inverse patches for undo/redo.
 *
 * @module builder/core/command-bus
 */

import type { PageDocument, NodeId } from '../schema/document';

// ---------------------------------------------------------------------------
// Patch types (JSON Patch inspired, simplified)
// ---------------------------------------------------------------------------

export type PatchOp =
  | { op: 'add'; path: string; value: unknown }
  | { op: 'remove'; path: string; oldValue?: unknown }
  | { op: 'replace'; path: string; value: unknown; oldValue?: unknown };

export type Patch = PatchOp[];

// ---------------------------------------------------------------------------
// Command types
// ---------------------------------------------------------------------------

export interface BuilderCommand {
  /** Namespaced command type, e.g. "node.insert", "node.updateProps" */
  type: string;
  /** Command-specific payload. */
  payload: Record<string, unknown>;
  /** Optional transaction ID for grouping related commands. */
  transactionId?: string;
}

export interface CommandResult {
  /** Forward patches applied to the document. */
  patches: Patch;
  /** Inverse patches for undoing the command. */
  inversePatches: Patch;
  /** IDs of nodes affected by this command. */
  affectedNodeIds: NodeId[];
}

/**
 * A command handler takes the current document state and a command,
 * and returns the result (patches + affected nodes).
 *
 * Handlers MUST be pure functions — they compute patches but do NOT
 * apply them. The CommandBus applies patches to the store.
 */
export type CommandHandler = (
  document: PageDocument,
  command: BuilderCommand,
) => CommandResult;

/**
 * A command validator checks if a command is valid before execution.
 * Returns null if valid, or an error message string.
 */
export type CommandValidator = (
  document: PageDocument,
  command: BuilderCommand,
) => string | null;

// ---------------------------------------------------------------------------
// Command Bus
// ---------------------------------------------------------------------------

export interface CommandBusOptions {
  /** Callback to get the current document state. */
  getDocument: () => PageDocument;
  /** Callback to apply patches to the document store. */
  applyPatches: (patches: Patch) => void;
  /** Callback to notify history of a new entry. */
  onCommandExecuted?: (
    command: BuilderCommand,
    result: CommandResult,
  ) => void;
  /** Callback on command validation failure. */
  onValidationError?: (command: BuilderCommand, error: string) => void;
}

export class CommandBus {
  private handlers = new Map<string, CommandHandler>();
  private validators = new Map<string, CommandValidator>();
  private options: CommandBusOptions;

  constructor(options: CommandBusOptions) {
    this.options = options;
  }

  /**
   * Register a command handler.
   */
  registerHandler(commandType: string, handler: CommandHandler): void {
    if (this.handlers.has(commandType)) {
      console.warn(
        `[CommandBus] Handler for "${commandType}" is being overwritten.`,
      );
    }
    this.handlers.set(commandType, handler);
  }

  /**
   * Register a command validator (optional per command type).
   */
  registerValidator(commandType: string, validator: CommandValidator): void {
    this.validators.set(commandType, validator);
  }

  /**
   * Execute a command.
   *
   * Flow: Validate → Handler → Apply Patches → Notify History
   */
  execute(command: BuilderCommand): CommandResult | null {
    const handler = this.handlers.get(command.type);
    if (!handler) {
      console.error(`[CommandBus] No handler registered for "${command.type}"`);
      return null;
    }

    // Validate
    const validator = this.validators.get(command.type);
    if (validator) {
      const error = validator(this.options.getDocument(), command);
      if (error) {
        this.options.onValidationError?.(command, error);
        return null;
      }
    }

    // Execute handler (pure computation)
    const document = this.options.getDocument();
    let result: CommandResult;
    try {
      result = handler(document, command);
    } catch (err) {
      console.error(
        `[CommandBus] Handler error for "${command.type}":`,
        err,
      );
      return null;
    }

    // Apply patches to store
    if (result.patches.length > 0) {
      this.options.applyPatches(result.patches);
    }

    // Notify history
    this.options.onCommandExecuted?.(command, result);

    return result;
  }

  /**
   * Execute inverse patches (for undo).
   */
  applyInverse(inversePatches: Patch): void {
    if (inversePatches.length > 0) {
      this.options.applyPatches(inversePatches);
    }
  }

  /**
   * Check if a command type has a registered handler.
   */
  hasHandler(commandType: string): boolean {
    return this.handlers.has(commandType);
  }
}
