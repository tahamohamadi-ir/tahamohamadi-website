"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export interface UseAutosaveOptions<T> {
    /** The data to autosave. Changes trigger debounced save. */
    data: T;
    /** Content status — only autosaves when status is "draft". */
    status: string;
    /** Async function that performs the actual save. */
    onSave: (data: T) => Promise<void>;
    /** Called when a save fails so the editor can display its existing formatted error. */
    onError?: (error: unknown) => void;
    /** Called after the final successful save in a burst of edits. */
    onSuccess?: () => void;
    /** Debounce delay in milliseconds. Defaults to 3000. */
    debounceMs?: number;
}

export interface UseAutosaveReturn {
    autosaveStatus: AutosaveStatus;
    lastSavedAt: Date | null;
    /** Manually trigger a save (cancels any pending autosave). */
    save: () => Promise<boolean>;
}

/** Autosaves Draft content after a debounce without automatic retries. */
export function useAutosave<T>(options: UseAutosaveOptions<T>): UseAutosaveReturn {
    const { data, status, onSave, onError, onSuccess, debounceMs = 3000 } = options;
    const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle");
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const activeSavePromiseRef = useRef<Promise<boolean> | null>(null);
    const queueLatestRef = useRef(false);
    const mountedRef = useRef(true);
    const dataRef = useRef(data);
    const statusRef = useRef(status);
    const onSaveRef = useRef(onSave);
    const onErrorRef = useRef(onError);
    const onSuccessRef = useRef(onSuccess);

    dataRef.current = data;
    statusRef.current = status;
    onSaveRef.current = onSave;
    onErrorRef.current = onError;
    onSuccessRef.current = onSuccess;

    const cancelPendingDebounce = useCallback(() => {
        if (debounceTimerRef.current !== null) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }
    }, []);

    const performSave = useCallback((initialData: T): Promise<boolean> => {
        if (activeSavePromiseRef.current) {
            queueLatestRef.current = true;
            return activeSavePromiseRef.current;
        }

        const drainSaves = async () => {
            let dataToSave = initialData;
            while (true) {
                if (mountedRef.current) setAutosaveStatus("saving");
                try {
                    await onSaveRef.current(dataToSave);
                    if (mountedRef.current) {
                        setAutosaveStatus("saved");
                        setLastSavedAt(new Date());
                    }
                } catch (error) {
                    queueLatestRef.current = false;
                    if (mountedRef.current) setAutosaveStatus("error");
                    onErrorRef.current?.(error);
                    return false;
                }

                const shouldSaveLatest = queueLatestRef.current;
                queueLatestRef.current = false;
                const hasNewerData = dataRef.current !== dataToSave;
                if (shouldSaveLatest && mountedRef.current && statusRef.current === "draft") {
                    dataToSave = dataRef.current;
                    continue;
                }
                if (!hasNewerData) onSuccessRef.current?.();
                return true;
            }
        };

        const activeSave = drainSaves().finally(() => {
            activeSavePromiseRef.current = null;
        });
        activeSavePromiseRef.current = activeSave;
        return activeSave;
    }, []);

    const save = useCallback(async (): Promise<boolean> => {
        cancelPendingDebounce();
        return performSave(dataRef.current);
    }, [cancelPendingDebounce, performSave]);

    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        cancelPendingDebounce();
        if (status !== "draft") return;

        debounceTimerRef.current = setTimeout(() => {
            debounceTimerRef.current = null;
            void performSave(dataRef.current);
        }, debounceMs);
    }, [data, status, debounceMs, cancelPendingDebounce, performSave]);

    useEffect(() => () => {
        mountedRef.current = false;
        cancelPendingDebounce();
    }, [cancelPendingDebounce]);

    return { autosaveStatus, lastSavedAt, save };
}
