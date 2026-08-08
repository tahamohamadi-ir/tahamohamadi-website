import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAutosave } from './useAutosave';

describe('useAutosave', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('basic behavior', () => {
        it('starts with idle status and null lastSavedAt', () => {
            const onSave = vi.fn().mockResolvedValue(undefined);
            const { result } = renderHook(() =>
                useAutosave({ data: { title: 'test' }, status: 'draft', onSave })
            );

            expect(result.current.autosaveStatus).toBe('idle');
            expect(result.current.lastSavedAt).toBeNull();
        });

        it('does not autosave on initial render', () => {
            const onSave = vi.fn().mockResolvedValue(undefined);
            renderHook(() =>
                useAutosave({ data: { title: 'test' }, status: 'draft', onSave })
            );

            vi.advanceTimersByTime(5000);
            expect(onSave).not.toHaveBeenCalled();
        });
    });

    describe('draft-only autosave', () => {
        it('autosaves when data changes and status is draft', async () => {
            const onSave = vi.fn().mockResolvedValue(undefined);
            const { result, rerender } = renderHook(
                ({ data, status }) => useAutosave({ data, status, onSave, debounceMs: 1000 }),
                { initialProps: { data: { title: 'v1' }, status: 'draft' } }
            );

            // Change data
            rerender({ data: { title: 'v2' }, status: 'draft' });

            // Before debounce fires
            expect(onSave).not.toHaveBeenCalled();

            // After debounce
            await act(async () => {
                vi.advanceTimersByTime(1000);
            });

            expect(onSave).toHaveBeenCalledTimes(1);
            expect(result.current.autosaveStatus).toBe('saved');
            expect(result.current.lastSavedAt).toBeInstanceOf(Date);
        });

        it('does NOT autosave when status is published', async () => {
            const onSave = vi.fn().mockResolvedValue(undefined);
            const { rerender } = renderHook(
                ({ data, status }) => useAutosave({ data, status, onSave, debounceMs: 1000 }),
                { initialProps: { data: { title: 'v1' }, status: 'published' } }
            );

            rerender({ data: { title: 'v2' }, status: 'published' });

            await act(async () => {
                vi.advanceTimersByTime(5000);
            });

            expect(onSave).not.toHaveBeenCalled();
        });

        it('does NOT autosave when status is in_review', async () => {
            const onSave = vi.fn().mockResolvedValue(undefined);
            const { rerender } = renderHook(
                ({ data, status }) => useAutosave({ data, status, onSave, debounceMs: 1000 }),
                { initialProps: { data: { title: 'v1' }, status: 'in_review' } }
            );

            rerender({ data: { title: 'v2' }, status: 'in_review' });

            await act(async () => {
                vi.advanceTimersByTime(5000);
            });

            expect(onSave).not.toHaveBeenCalled();
        });
    });

    describe('debounce behavior', () => {
        it('debounces multiple rapid changes', async () => {
            const onSave = vi.fn().mockResolvedValue(undefined);
            const { rerender } = renderHook(
                ({ data, status }) => useAutosave({ data, status, onSave, debounceMs: 2000 }),
                { initialProps: { data: { title: 'v1' }, status: 'draft' } }
            );

            // Rapid changes
            rerender({ data: { title: 'v2' }, status: 'draft' });
            vi.advanceTimersByTime(500);
            rerender({ data: { title: 'v3' }, status: 'draft' });
            vi.advanceTimersByTime(500);
            rerender({ data: { title: 'v4' }, status: 'draft' });

            // Should not have saved yet
            expect(onSave).not.toHaveBeenCalled();

            // Wait for debounce to fire after last change
            await act(async () => {
                vi.advanceTimersByTime(2000);
            });

            // Should only save once with the latest data
            expect(onSave).toHaveBeenCalledTimes(1);
        });
    });

    describe('manual save', () => {
        it('cancels pending autosave when manually saving', async () => {
            const onSave = vi.fn().mockResolvedValue(undefined);
            const { result, rerender } = renderHook(
                ({ data, status }) => useAutosave({ data, status, onSave, debounceMs: 3000 }),
                { initialProps: { data: { title: 'v1' }, status: 'draft' } }
            );

            // Trigger a change to start debounce
            rerender({ data: { title: 'v2' }, status: 'draft' });

            // Manually save before debounce fires
            await act(async () => {
                await result.current.save();
            });

            expect(onSave).toHaveBeenCalledTimes(1);

            // Advance past original debounce — should NOT fire again
            await act(async () => {
                vi.advanceTimersByTime(5000);
            });

            expect(onSave).toHaveBeenCalledTimes(1);
        });

        it('sets status to saved on successful manual save', async () => {
            const onSave = vi.fn().mockResolvedValue(undefined);
            const { result } = renderHook(() =>
                useAutosave({ data: { title: 'test' }, status: 'draft', onSave })
            );

            await act(async () => {
                await result.current.save();
            });

            expect(result.current.autosaveStatus).toBe('saved');
            expect(result.current.lastSavedAt).toBeInstanceOf(Date);
        });
    });

    describe('error handling and in-flight changes', () => {
        it('does not retry a failed draft save automatically', async () => {
            const onSave = vi.fn().mockRejectedValue(new Error('Server down'));

            const { result, rerender } = renderHook(
                ({ data, status }) =>
                    useAutosave({
                        data,
                        status,
                        onSave,
                        debounceMs: 1000,
                    }),
                { initialProps: { data: { title: 'v1' }, status: 'draft' } }
            );

            rerender({ data: { title: 'v2' }, status: 'draft' });

            await act(async () => {
                vi.advanceTimersByTime(1000);
                await Promise.resolve();
            });

            expect(onSave).toHaveBeenCalledTimes(1);
            expect(result.current.autosaveStatus).toBe('error');
            expect(result.current.lastSavedAt).toBeNull();
        });

        it('saves the latest edit once after a successful in-flight save', async () => {
            let resolveFirstSave: (() => void) | undefined;
            const onSave = vi
                .fn()
                .mockImplementationOnce(() => new Promise<void>((resolve) => { resolveFirstSave = resolve; }))
                .mockResolvedValueOnce(undefined);
            const { rerender } = renderHook(
                ({ data }) => useAutosave({ data, status: 'draft', onSave, debounceMs: 100 }),
                { initialProps: { data: { title: 'v1' } } },
            );

            rerender({ data: { title: 'v2' } });
            await act(async () => { vi.advanceTimersByTime(100); });
            expect(onSave).toHaveBeenCalledWith({ title: 'v2' });

            rerender({ data: { title: 'v3' } });
            await act(async () => { vi.advanceTimersByTime(100); });
            expect(onSave).toHaveBeenCalledTimes(1);

            await act(async () => { resolveFirstSave?.(); await Promise.resolve(); });
            expect(onSave).toHaveBeenCalledWith({ title: 'v3' });
            expect(onSave).toHaveBeenCalledTimes(2);
        });
    });

    describe('status transitions', () => {
        it('cancels pending autosave when status changes from draft to published', async () => {
            const onSave = vi.fn().mockResolvedValue(undefined);
            const { rerender } = renderHook(
                ({ data, status }) => useAutosave({ data, status, onSave, debounceMs: 2000 }),
                { initialProps: { data: { title: 'v1' }, status: 'draft' } }
            );

            // Change data as draft — starts debounce
            rerender({ data: { title: 'v2' }, status: 'draft' });

            // Change status to published before debounce fires
            rerender({ data: { title: 'v2' }, status: 'published' });

            await act(async () => {
                vi.advanceTimersByTime(5000);
            });

            expect(onSave).not.toHaveBeenCalled();
        });
    });
});
