import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCommandStack } from './useCommandStack';

describe('useCommandStack', () => {
    describe('basic push/undo/redo', () => {
        it('starts with canUndo and canRedo as false', () => {
            const { result } = renderHook(() => useCommandStack<string>());
            expect(result.current.canUndo).toBe(false);
            expect(result.current.canRedo).toBe(false);
            expect(result.current.current).toBeUndefined();
        });

        it('initializes with initial state', () => {
            const { result } = renderHook(() => useCommandStack<string>('initial'));
            expect(result.current.current).toBe('initial');
            expect(result.current.canUndo).toBe(false);
        });

        it('push sets current and enables undo', () => {
            const { result } = renderHook(() => useCommandStack<string>('A'));

            act(() => {
                result.current.push('B');
            });

            expect(result.current.current).toBe('B');
            expect(result.current.canUndo).toBe(true);
            expect(result.current.canRedo).toBe(false);
        });

        it('undo restores previous state and enables redo', () => {
            const { result } = renderHook(() => useCommandStack<string>('A'));

            act(() => {
                result.current.push('B');
            });
            act(() => {
                result.current.push('C');
            });

            let restored: string | undefined;
            act(() => {
                restored = result.current.undo();
            });

            expect(restored).toBe('B');
            expect(result.current.current).toBe('B');
            expect(result.current.canUndo).toBe(true);
            expect(result.current.canRedo).toBe(true);
        });

        it('redo re-applies next state', () => {
            const { result } = renderHook(() => useCommandStack<string>('A'));

            act(() => {
                result.current.push('B');
            });
            act(() => {
                result.current.undo();
            });

            let restored: string | undefined;
            act(() => {
                restored = result.current.redo();
            });

            expect(restored).toBe('B');
            expect(result.current.current).toBe('B');
            expect(result.current.canUndo).toBe(true);
            expect(result.current.canRedo).toBe(false);
        });

        it('undo returns undefined when stack is empty', () => {
            const { result } = renderHook(() => useCommandStack<string>('A'));

            let restored: string | undefined;
            act(() => {
                restored = result.current.undo();
            });

            expect(restored).toBeUndefined();
            expect(result.current.current).toBe('A');
        });

        it('redo returns undefined when stack is empty', () => {
            const { result } = renderHook(() => useCommandStack<string>('A'));

            let restored: string | undefined;
            act(() => {
                restored = result.current.redo();
            });

            expect(restored).toBeUndefined();
            expect(result.current.current).toBe('A');
        });

        it('push clears redo stack', () => {
            const { result } = renderHook(() => useCommandStack<string>('A'));

            act(() => {
                result.current.push('B');
            });
            act(() => {
                result.current.push('C');
            });
            act(() => {
                result.current.undo(); // back to B
            });

            expect(result.current.canRedo).toBe(true);

            act(() => {
                result.current.push('D'); // new branch from B
            });

            expect(result.current.canRedo).toBe(false);
            expect(result.current.current).toBe('D');
        });
    });

    describe('reset', () => {
        it('clears both stacks after save', () => {
            const { result } = renderHook(() => useCommandStack<string>('A'));

            act(() => {
                result.current.push('B');
            });
            act(() => {
                result.current.push('C');
            });
            act(() => {
                result.current.undo(); // C is now in redo
            });

            expect(result.current.canUndo).toBe(true);
            expect(result.current.canRedo).toBe(true);

            act(() => {
                result.current.reset();
            });

            expect(result.current.canUndo).toBe(false);
            expect(result.current.canRedo).toBe(false);
            // Current state should be preserved
            expect(result.current.current).toBe('B');
        });
    });

    describe('max depth enforcement', () => {
        it('enforces max history depth', () => {
            const { result } = renderHook(() =>
                useCommandStack<number>(0, { maxDepth: 3 })
            );

            // Push 5 states (0→1→2→3→4→5), undo stack should only keep 3
            act(() => result.current.push(1));
            act(() => result.current.push(2));
            act(() => result.current.push(3));
            act(() => result.current.push(4));
            act(() => result.current.push(5));

            // Current is 5, undo stack should have [2, 3, 4] (capped to 3)
            expect(result.current.current).toBe(5);

            act(() => result.current.undo()); // → 4
            act(() => result.current.undo()); // → 3
            act(() => result.current.undo()); // → 2

            expect(result.current.current).toBe(2);
            expect(result.current.canUndo).toBe(false);
        });
    });

    describe('keyboard shortcuts', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('Ctrl+Z triggers undo', () => {
            const { result } = renderHook(() => useCommandStack<string>('A'));

            act(() => {
                result.current.push('B');
            });

            act(() => {
                const event = new KeyboardEvent('keydown', {
                    key: 'z',
                    ctrlKey: true,
                    bubbles: true,
                });
                document.dispatchEvent(event);
            });

            expect(result.current.current).toBe('A');
        });

        it('Ctrl+Shift+Z triggers redo', () => {
            const { result } = renderHook(() => useCommandStack<string>('A'));

            act(() => {
                result.current.push('B');
            });
            act(() => {
                result.current.undo();
            });

            act(() => {
                const event = new KeyboardEvent('keydown', {
                    key: 'Z',
                    ctrlKey: true,
                    shiftKey: true,
                    bubbles: true,
                });
                document.dispatchEvent(event);
            });

            expect(result.current.current).toBe('B');
        });

        it('Ctrl+Y triggers redo', () => {
            const { result } = renderHook(() => useCommandStack<string>('A'));

            act(() => {
                result.current.push('B');
            });
            act(() => {
                result.current.undo();
            });

            act(() => {
                const event = new KeyboardEvent('keydown', {
                    key: 'y',
                    ctrlKey: true,
                    bubbles: true,
                });
                document.dispatchEvent(event);
            });

            expect(result.current.current).toBe('B');
        });

        it('does not register shortcuts when disabled', () => {
            const { result } = renderHook(() =>
                useCommandStack<string>('A', { enableKeyboardShortcuts: false })
            );

            act(() => {
                result.current.push('B');
            });

            act(() => {
                const event = new KeyboardEvent('keydown', {
                    key: 'z',
                    ctrlKey: true,
                    bubbles: true,
                });
                document.dispatchEvent(event);
            });

            // Should still be B since shortcuts are disabled
            expect(result.current.current).toBe('B');
        });
    });

    describe('complex scenarios', () => {
        it('handles multiple undo then redo', () => {
            const { result } = renderHook(() => useCommandStack<number>(1));

            act(() => result.current.push(2));
            act(() => result.current.push(3));
            act(() => result.current.push(4));

            // Undo all the way back
            act(() => result.current.undo()); // → 3
            act(() => result.current.undo()); // → 2
            act(() => result.current.undo()); // → 1

            expect(result.current.current).toBe(1);
            expect(result.current.canUndo).toBe(false);
            expect(result.current.canRedo).toBe(true);

            // Redo all the way forward
            act(() => result.current.redo()); // → 2
            act(() => result.current.redo()); // → 3
            act(() => result.current.redo()); // → 4

            expect(result.current.current).toBe(4);
            expect(result.current.canUndo).toBe(true);
            expect(result.current.canRedo).toBe(false);
        });

        it('works with complex object state', () => {
            interface PageState {
                sections: { id: string; title: string }[];
            }

            const initial: PageState = { sections: [{ id: '1', title: 'Hero' }] };
            const { result } = renderHook(() => useCommandStack<PageState>(initial));

            const stateWithTwo: PageState = {
                sections: [
                    { id: '1', title: 'Hero' },
                    { id: '2', title: 'Content' },
                ],
            };

            act(() => {
                result.current.push(stateWithTwo);
            });

            expect(result.current.current).toEqual(stateWithTwo);

            act(() => {
                result.current.undo();
            });

            expect(result.current.current).toEqual(initial);
        });
    });
});
