/**
 * History Engine — Undo/Redo with coalescing and transactions
 *
 * Based on Blueprint Part 32:
 * - Each entry stores patches + inverse patches
 * - Text typing coalesces into single entries
 * - Transaction support for grouping related commands
 * - Configurable history limit
 *
 * @module builder/core/history
 */

import type { BuilderCommand, CommandResult, Patch } from './command-bus';

// ---------------------------------------------------------------------------
// History Entry
// ---------------------------------------------------------------------------

export interface HistoryEntry {
  /** Unique entry ID. */
  id: string;
  /** The command type that produced this entry. */
  commandType: string;
  /** Forward patches to apply. */
  patches: Patch;
  /** Inverse patches for undoing. */
  inversePatches: Patch;
  /** Timestamp of the entry. */
  timestamp: number;
  /** Affected node IDs. */
  affectedNodeIds: string[];
  /** Transaction ID if part of a transaction group. */
  transactionId?: string;
}

// ---------------------------------------------------------------------------
// History Options
// ---------------------------------------------------------------------------

export interface HistoryOptions {
  /** Maximum number of undo entries to keep. Default: 100. */
  maxEntries?: number;
  /** Time window in ms to coalesce same-type commands. Default: 500. */
  coalesceWindow?: number;
  /** Command types that should be coalesced. */
  coalesceTypes?: Set<string>;
  /** Callback to apply patches (for undo/redo). */
  applyPatches: (patches: Patch) => void;
}

// ---------------------------------------------------------------------------
// History Engine
// ---------------------------------------------------------------------------

let entryIdCounter = 0;

export class HistoryEngine {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private options: Required<Omit<HistoryOptions, 'coalesceTypes'>> & {
    coalesceTypes: Set<string>;
  };

  // Transaction state
  private activeTransaction: {
    id: string;
    entries: HistoryEntry[];
  } | null = null;

  constructor(options: HistoryOptions) {
    this.options = {
      maxEntries: options.maxEntries ?? 100,
      coalesceWindow: options.coalesceWindow ?? 500,
      coalesceTypes: options.coalesceTypes ?? new Set(['node.updateProps']),
      applyPatches: options.applyPatches,
    };
  }

  /**
   * Push a new history entry from a command execution.
   * Called by the CommandBus after successful command execution.
   */
  push(command: BuilderCommand, result: CommandResult): void {
    const now = Date.now();
    const entry: HistoryEntry = {
      id: `hist_${++entryIdCounter}`,
      commandType: command.type,
      patches: result.patches,
      inversePatches: result.inversePatches,
      timestamp: now,
      affectedNodeIds: result.affectedNodeIds,
      transactionId: command.transactionId ?? this.activeTransaction?.id,
    };

    // If inside a transaction, accumulate entries
    if (this.activeTransaction) {
      this.activeTransaction.entries.push(entry);
      return;
    }

    // Try coalescing with the last entry
    if (this.shouldCoalesce(entry)) {
      const last = this.undoStack[this.undoStack.length - 1];
      last.patches = [...last.patches, ...entry.patches];
      last.inversePatches = [...entry.inversePatches, ...last.inversePatches];
      last.affectedNodeIds = [
        ...new Set([...last.affectedNodeIds, ...entry.affectedNodeIds]),
      ];
      last.timestamp = now;
    } else {
      this.undoStack.push(entry);
    }

    // Clear redo stack on new action
    this.redoStack = [];

    // Enforce max entries
    while (this.undoStack.length > this.options.maxEntries) {
      this.undoStack.shift();
    }
  }

  /**
   * Undo the last action.
   */
  undo(): HistoryEntry | null {
    const entry = this.undoStack.pop();
    if (!entry) return null;

    // Apply inverse patches
    this.options.applyPatches(entry.inversePatches);
    this.redoStack.push(entry);

    return entry;
  }

  /**
   * Redo the last undone action.
   */
  redo(): HistoryEntry | null {
    const entry = this.redoStack.pop();
    if (!entry) return null;

    // Apply forward patches
    this.options.applyPatches(entry.patches);
    this.undoStack.push(entry);

    return entry;
  }

  /**
   * Start a transaction — all commands until commit are grouped as one undo entry.
   */
  beginTransaction(id?: string): string {
    const txId = id ?? `tx_${++entryIdCounter}`;
    this.activeTransaction = { id: txId, entries: [] };
    return txId;
  }

  /**
   * Commit the active transaction as a single history entry.
   */
  commitTransaction(): void {
    if (!this.activeTransaction) return;

    const { entries } = this.activeTransaction;
    if (entries.length === 0) {
      this.activeTransaction = null;
      return;
    }

    // Merge all transaction entries into one
    const merged: HistoryEntry = {
      id: `hist_${++entryIdCounter}`,
      commandType: `transaction(${entries.map((e) => e.commandType).join(', ')})`,
      patches: entries.flatMap((e) => e.patches),
      inversePatches: entries
        .slice()
        .reverse()
        .flatMap((e) => e.inversePatches),
      timestamp: Date.now(),
      affectedNodeIds: [
        ...new Set(entries.flatMap((e) => e.affectedNodeIds)),
      ],
      transactionId: this.activeTransaction.id,
    };

    this.undoStack.push(merged);
    this.redoStack = [];
    this.activeTransaction = null;

    while (this.undoStack.length > this.options.maxEntries) {
      this.undoStack.shift();
    }
  }

  /**
   * Abort the active transaction, undoing all its entries.
   */
  rollbackTransaction(): void {
    if (!this.activeTransaction) return;

    const { entries } = this.activeTransaction;
    // Undo in reverse order
    for (const entry of entries.reverse()) {
      this.options.applyPatches(entry.inversePatches);
    }

    this.activeTransaction = null;
  }

  /**
   * Check if we can undo.
   */
  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if we can redo.
   */
  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Get the number of entries in the undo stack.
   */
  get undoCount(): number {
    return this.undoStack.length;
  }

  /**
   * Get the number of entries in the redo stack.
   */
  get redoCount(): number {
    return this.redoStack.length;
  }

  /**
   * Clear all history.
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.activeTransaction = null;
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private shouldCoalesce(entry: HistoryEntry): boolean {
    if (this.undoStack.length === 0) return false;

    const last = this.undoStack[this.undoStack.length - 1];

    // Same command type
    if (last.commandType !== entry.commandType) return false;

    // Must be a coalesceable type
    if (!this.options.coalesceTypes.has(entry.commandType)) return false;

    // Within time window
    if (entry.timestamp - last.timestamp > this.options.coalesceWindow) return false;

    // Same affected nodes
    const sameNodes =
      entry.affectedNodeIds.length === last.affectedNodeIds.length &&
      entry.affectedNodeIds.every((id) => last.affectedNodeIds.includes(id));

    return sameNodes;
  }
}
