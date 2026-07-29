import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDirtyGuard } from './useDirtyGuard';

describe('useDirtyGuard', () => {
    let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
    let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        addEventListenerSpy = vi.spyOn(window, 'addEventListener');
        removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should start with isDirty = false', () => {
        const { result } = renderHook(() => useDirtyGuard());
        expect(result.current.isDirty).toBe(false);
    });

    it('markDirty sets isDirty to true', () => {
        const { result } = renderHook(() => useDirtyGuard());
        act(() => {
            result.current.markDirty();
        });
        expect(result.current.isDirty).toBe(true);
    });

    it('markClean sets isDirty to false', () => {
        const { result } = renderHook(() => useDirtyGuard());
        act(() => {
            result.current.markDirty();
        });
        expect(result.current.isDirty).toBe(true);
        act(() => {
            result.current.markClean();
        });
        expect(result.current.isDirty).toBe(false);
    });

    it('setDirty sets the dirty state directly', () => {
        const { result } = renderHook(() => useDirtyGuard());
        act(() => {
            result.current.setDirty(true);
        });
        expect(result.current.isDirty).toBe(true);
        act(() => {
            result.current.setDirty(false);
        });
        expect(result.current.isDirty).toBe(false);
    });

    it('registers beforeunload event listener', () => {
        renderHook(() => useDirtyGuard());
        expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });

    it('removes beforeunload listener on unmount', () => {
        const { unmount } = renderHook(() => useDirtyGuard());
        unmount();
        expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });

    it('does not register beforeunload when enabled=false', () => {
        renderHook(() => useDirtyGuard({ enabled: false }));
        expect(addEventListenerSpy).not.toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });

    describe('beforeunload behavior', () => {
        it('does not prevent default when clean', () => {
            renderHook(() => useDirtyGuard());

            const handler = addEventListenerSpy.mock.calls.find(
                (call) => call[0] === 'beforeunload'
            )?.[1] as EventListener;

            const event = new Event('beforeunload') as BeforeUnloadEvent;
            const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
            handler(event);

            expect(preventDefaultSpy).not.toHaveBeenCalled();
        });

        it('prevents default when dirty', () => {
            const { result } = renderHook(() => useDirtyGuard());
            act(() => {
                result.current.markDirty();
            });

            const handler = addEventListenerSpy.mock.calls.find(
                (call) => call[0] === 'beforeunload'
            )?.[1] as EventListener;

            const event = new Event('beforeunload') as BeforeUnloadEvent;
            const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
            handler(event);

            expect(preventDefaultSpy).toHaveBeenCalled();
        });
    });

    describe('confirmNavigation', () => {
        it('returns true when clean (no confirm dialog)', () => {
            const confirmSpy = vi.spyOn(window, 'confirm');
            const { result } = renderHook(() => useDirtyGuard());

            const shouldNavigate = result.current.confirmNavigation();

            expect(shouldNavigate).toBe(true);
            expect(confirmSpy).not.toHaveBeenCalled();
        });

        it('shows confirm dialog when dirty and returns true on accept', () => {
            const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
            const { result } = renderHook(() => useDirtyGuard());
            act(() => {
                result.current.markDirty();
            });

            const shouldNavigate = result.current.confirmNavigation();

            expect(confirmSpy).toHaveBeenCalledWith('You have unsaved changes. Leave?');
            expect(shouldNavigate).toBe(true);
        });

        it('shows confirm dialog when dirty and returns false on cancel', () => {
            const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
            const { result } = renderHook(() => useDirtyGuard());
            act(() => {
                result.current.markDirty();
            });

            const shouldNavigate = result.current.confirmNavigation();

            expect(confirmSpy).toHaveBeenCalled();
            expect(shouldNavigate).toBe(false);
        });

        it('uses custom message', () => {
            const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
            const { result } = renderHook(() =>
                useDirtyGuard({ message: 'Custom unsaved message' })
            );
            act(() => {
                result.current.markDirty();
            });

            result.current.confirmNavigation();

            expect(confirmSpy).toHaveBeenCalledWith('Custom unsaved message');
        });

        it('returns true without showing confirm when enabled=false', () => {
            const confirmSpy = vi.spyOn(window, 'confirm');
            const { result } = renderHook(() => useDirtyGuard({ enabled: false }));
            act(() => {
                result.current.markDirty();
            });

            const shouldNavigate = result.current.confirmNavigation();

            expect(shouldNavigate).toBe(true);
            expect(confirmSpy).not.toHaveBeenCalled();
        });
    });
});
