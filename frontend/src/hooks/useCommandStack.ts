'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_HISTORY_DEPTH = 50;

export interface UseCommandStackOptions<T = unknown> {
    /** Maximum number of undo entries. Defaults to 50. */
    maxDepth?: number;
    /** Whether to register global keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z). Defaults to true. */
    enableKeyboardShortcuts?: boolean;
    /** Receives the restored state after an undo, including keyboard shortcuts. */
    onUndo?: (state: T) => void;
    /** Receives the restored state after a redo, including keyboard shortcuts. */
    onRedo?: (state: T) => void;
}

export interface UseCommandStackReturn<T> {
    /** Whether there are states to undo to. */
    canUndo: boolean;
    /** Whether there are states to redo to. */
    canRedo: boolean;
    /** Push a new state snapshot onto the undo stack. Clears the redo stack. */
    push: (state: T) => void;
    /** Undo: restore the previous state. Returns the restored state or undefined if nothing to undo. */
    undo: () => T | undefined;
    /** Redo: re-apply the next state. Returns the restored state or undefined if nothing to redo. */
    redo: () => T | undefined;
    /** Reset both undo and redo stacks (call after successful save). */
    reset: () => void;
    /** The current state at the top of the stack (last pushed or restored state). */
    current: T | undefined;
}

/**
 * useCommandStack — local undo/redo state history for the Composer Canvas.
 *
 * Manages a stack of state snapshots allowing the user to undo and redo mutations.
 * The stack resets after a successful save. Supports Ctrl+Z / Cmd+Z and
 * Ctrl+Shift+Z / Cmd+Shift+Z keyboard shortcuts.
 *
 * @param initialState - Optional initial state to seed the stack with.
 * @param options - Configuration options.
 */
export function useCommandStack<T>(
    initialState?: T,
    options: UseCommandStackOptions<T> = {}
): UseCommandStackReturn<T> {
    const { maxDepth = MAX_HISTORY_DEPTH, enableKeyboardShortcuts = true } = options;

    const undoStackRef = useRef<T[]>([]);
    const redoStackRef = useRef<T[]>([]);
    const currentRef = useRef<T | undefined>(initialState);
    const onUndoRef = useRef(options.onUndo);
    const onRedoRef = useRef(options.onRedo);
    onUndoRef.current = options.onUndo;
    onRedoRef.current = options.onRedo;

    // Use state to trigger re-renders when stack lengths change
    const [, forceUpdate] = useState(0);
    const rerender = useCallback(() => forceUpdate((c) => c + 1), []);

    const push = useCallback(
        (state: T) => {
            // If there's a current state, push it onto undo stack
            if (currentRef.current !== undefined) {
                undoStackRef.current = [...undoStackRef.current, currentRef.current];
                // Enforce max depth
                if (undoStackRef.current.length > maxDepth) {
                    undoStackRef.current = undoStackRef.current.slice(
                        undoStackRef.current.length - maxDepth
                    );
                }
            }
            // Set new current
            currentRef.current = state;
            // Clear redo stack on new action
            redoStackRef.current = [];
            rerender();
        },
        [maxDepth, rerender]
    );

    const undo = useCallback((): T | undefined => {
        if (undoStackRef.current.length === 0) {
            return undefined;
        }
        // Push current to redo
        if (currentRef.current !== undefined) {
            redoStackRef.current = [...redoStackRef.current, currentRef.current];
        }
        // Pop from undo
        const previousState = undoStackRef.current[undoStackRef.current.length - 1];
        undoStackRef.current = undoStackRef.current.slice(0, -1);
        currentRef.current = previousState;
        onUndoRef.current?.(previousState);
        rerender();
        return previousState;
    }, [rerender]);

    const redo = useCallback((): T | undefined => {
        if (redoStackRef.current.length === 0) {
            return undefined;
        }
        // Push current to undo
        if (currentRef.current !== undefined) {
            undoStackRef.current = [...undoStackRef.current, currentRef.current];
        }
        // Pop from redo
        const nextState = redoStackRef.current[redoStackRef.current.length - 1];
        redoStackRef.current = redoStackRef.current.slice(0, -1);
        currentRef.current = nextState;
        onRedoRef.current?.(nextState);
        rerender();
        return nextState;
    }, [rerender]);

    const reset = useCallback(() => {
        undoStackRef.current = [];
        redoStackRef.current = [];
        // Keep the current state — it represents the saved state now
        rerender();
    }, [rerender]);

    // Keyboard shortcuts
    useEffect(() => {
        if (!enableKeyboardShortcuts) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const isCtrlOrCmd = e.ctrlKey || e.metaKey;
            if (!isCtrlOrCmd) return;

            if (e.key === 'z' || e.key === 'Z') {
                if (e.shiftKey) {
                    // Ctrl+Shift+Z / Cmd+Shift+Z → Redo
                    e.preventDefault();
                    redo();
                } else {
                    // Ctrl+Z / Cmd+Z → Undo
                    e.preventDefault();
                    undo();
                }
            }
            // Also support Ctrl+Y for redo (Windows convention)
            if (e.key === 'y' || e.key === 'Y') {
                if (!e.shiftKey) {
                    e.preventDefault();
                    redo();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [enableKeyboardShortcuts, undo, redo]);

    return {
        canUndo: undoStackRef.current.length > 0,
        canRedo: redoStackRef.current.length > 0,
        push,
        undo,
        redo,
        reset,
        current: currentRef.current,
    };
}
