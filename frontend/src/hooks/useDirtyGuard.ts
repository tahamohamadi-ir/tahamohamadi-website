'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseDirtyGuardOptions {
    /** Message shown in the browser's native beforeunload dialog. */
    message?: string;
    /** Whether the guard is enabled. Defaults to true. */
    enabled?: boolean;
}

export interface UseDirtyGuardReturn {
    /** Whether the form/page has unsaved changes. */
    isDirty: boolean;
    /** Mark the form as dirty (has unsaved changes). */
    markDirty: () => void;
    /** Mark the form as clean (changes saved). */
    markClean: () => void;
    /** Set dirty state directly. */
    setDirty: (dirty: boolean) => void;
    /**
     * Call before in-app navigation. Returns true if navigation should proceed.
     * Shows a confirm dialog if there are unsaved changes.
     */
    confirmNavigation: () => boolean;
}

/**
 * useDirtyGuard — warns the user when navigating away from a page with unsaved changes.
 *
 * Handles two scenarios:
 * 1. Browser navigation (closing tab, refreshing, external link) via `beforeunload` event
 * 2. In-app navigation via `confirmNavigation()` which uses window.confirm
 *
 * Usage:
 * ```tsx
 * const { isDirty, markDirty, markClean, confirmNavigation } = useDirtyGuard();
 *
 * // Mark dirty when user edits content
 * function onEdit() { markDirty(); }
 *
 * // Mark clean after save
 * function onSave() { await save(); markClean(); }
 *
 * // Before navigating in-app
 * function onNavigate(href: string) {
 *   if (confirmNavigation()) {
 *     router.push(href);
 *   }
 * }
 * ```
 */
export function useDirtyGuard(options: UseDirtyGuardOptions = {}): UseDirtyGuardReturn {
    const { message = 'You have unsaved changes. Leave?', enabled = true } = options;

    const [isDirty, setIsDirty] = useState(false);
    const isDirtyRef = useRef(isDirty);

    // Keep ref in sync with state for use in event handler
    useEffect(() => {
        isDirtyRef.current = isDirty;
    }, [isDirty]);

    // Browser beforeunload handler
    useEffect(() => {
        if (!enabled) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!isDirtyRef.current) return;

            e.preventDefault();
            // Modern browsers ignore the returnValue string but still require it to be set
            // eslint-disable-next-line no-param-reassign
            e.returnValue = message;
            return message;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [enabled, message]);

    const markDirty = useCallback(() => {
        setIsDirty(true);
    }, []);

    const markClean = useCallback(() => {
        setIsDirty(false);
    }, []);

    const setDirty = useCallback((dirty: boolean) => {
        setIsDirty(dirty);
    }, []);

    const confirmNavigation = useCallback((): boolean => {
        if (!isDirtyRef.current || !enabled) return true;
        return window.confirm(message);
    }, [enabled, message]);

    return {
        isDirty,
        markDirty,
        markClean,
        setDirty,
        confirmNavigation,
    };
}
