'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseAutosaveOptions<T> {
    /** The data to autosave. Changes trigger debounced save. */
    data: T;
    /** Content status — only autosaves when status is "draft". */
    status: string;
    /** Async function that performs the actual save. */
    onSave: (data: T) => Promise<void>;
    /** Debounce delay in milliseconds. Defaults to 3000. */
    debounceMs?: number;
    /** Maximum number of retry attempts on transient errors. Defaults to 3. */
    maxRetries?: number;
    /** Initial backoff delay in ms for retries. Defaults to 1000. */
    retryBackoffMs?: number;
}

export interface UseAutosaveReturn {
    /** Current autosave status indicator. */
    autosaveStatus: AutosaveStatus;
    /** Timestamp of the last successful save, or null if never saved. */
    lastSavedAt: Date | null;
    /** Manually trigger a save (cancels any pending autosave). */
    save: () => Promise<void>;
}

/**
 * useAutosave — autosaves draft content with debounce, retry, and status indicators.
 *
 * Only triggers autosave when content status is "draft". Shows saving/saved/error
 * indicators. Cancels pending autosaves when the user manually saves. Retries on
 * transient errors with exponential backoff.
 */
export function useAutosave<T>(options: UseAutosaveOptions<T>): UseAutosaveReturn {
    const {
        data,
        status,
        onSave,
        debounceMs = 3000,
        maxRetries = 3,
        retryBackoffMs = 1000,
    } = options;

    const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle');
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isSavingRef = useRef(false);
    const dataRef = useRef(data);
    const onSaveRef = useRef(onSave);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Keep refs up to date
    dataRef.current = data;
    onSaveRef.current = onSave;

    const cancelPendingDebounce = useCallback(() => {
        if (debounceTimerRef.current !== null) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }
    }, []);

    const performSave = useCallback(
        async (dataToSave: T): Promise<void> => {
            if (isSavingRef.current) return;
            isSavingRef.current = true;
            setAutosaveStatus('saving');

            let attempt = 0;
            let success = false;

            while (attempt <= maxRetries && !success) {
                try {
                    await onSaveRef.current(dataToSave);
                    success = true;
                    setAutosaveStatus('saved');
                    setLastSavedAt(new Date());
                } catch (error) {
                    attempt++;
                    if (attempt > maxRetries) {
                        setAutosaveStatus('error');
                    } else {
                        // Exponential backoff: retryBackoffMs * 2^(attempt-1)
                        const delay = retryBackoffMs * Math.pow(2, attempt - 1);
                        await new Promise((resolve) => setTimeout(resolve, delay));
                    }
                }
            }

            isSavingRef.current = false;
        },
        [maxRetries, retryBackoffMs]
    );

    // Manual save — cancels pending autosave
    const save = useCallback(async (): Promise<void> => {
        cancelPendingDebounce();
        await performSave(dataRef.current);
    }, [cancelPendingDebounce, performSave]);

    // Debounced autosave on data changes (only for draft content)
    const isFirstRender = useRef(true);

    useEffect(() => {
        // Skip first render to avoid saving initial data
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        // Only autosave drafts
        if (status !== 'draft') {
            cancelPendingDebounce();
            return;
        }

        // Don't schedule if already saving
        if (isSavingRef.current) return;

        cancelPendingDebounce();

        debounceTimerRef.current = setTimeout(() => {
            debounceTimerRef.current = null;
            performSave(dataRef.current);
        }, debounceMs);

        return () => {
            // Cleanup on unmount or re-trigger
        };
    }, [data, status, debounceMs, cancelPendingDebounce, performSave]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cancelPendingDebounce();
        };
    }, [cancelPendingDebounce]);

    return {
        autosaveStatus,
        lastSavedAt,
        save,
    };
}
