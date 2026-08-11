import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InteractionRunner } from './interaction-runner';
import { interactionRegistry } from './interaction-registry';

describe('Interaction Runner', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('executes actions when trigger matches and condition is true', async () => {
    const runner = new InteractionRunner({ user: { authenticated: true } });
    
    // Mock the registry executeAction
    const executeSpy = vi.spyOn(interactionRegistry, 'executeAction').mockResolvedValue();

    runner.setInteractions([
      {
        id: 'int-1',
        trigger: { type: 'pointer.click', target: 'button-1' },
        condition: { op: 'eq', args: [{ ctx: 'user.authenticated' }, { value: true }] },
        actions: [
          { type: 'modal.open', target: 'login-modal' }
        ]
      }
    ]);

    await runner.handleEvent('pointer.click', 'button-1');

    expect(executeSpy).toHaveBeenCalledTimes(1);
    expect(executeSpy).toHaveBeenCalledWith(
      { type: 'modal.open', target: 'login-modal' },
      { user: { authenticated: true } },
      undefined
    );
  });

  it('skips actions when condition evaluates to false', async () => {
    const runner = new InteractionRunner({ user: { authenticated: false } });
    const executeSpy = vi.spyOn(interactionRegistry, 'executeAction').mockResolvedValue();

    runner.setInteractions([
      {
        id: 'int-1',
        trigger: { type: 'pointer.click', target: 'button-1' },
        condition: { op: 'eq', args: [{ ctx: 'user.authenticated' }, { value: true }] },
        actions: [{ type: 'modal.open' }]
      }
    ]);

    await runner.handleEvent('pointer.click', 'button-1');
    expect(executeSpy).not.toHaveBeenCalled();
  });

  it('executes multiple actions in sequence if condition is omitted', async () => {
    const runner = new InteractionRunner();
    const executeSpy = vi.spyOn(interactionRegistry, 'executeAction').mockResolvedValue();

    runner.setInteractions([
      {
        id: 'int-1',
        trigger: { type: 'viewport.enter', target: 'section-1' },
        actions: [
          { type: 'class.add', target: 'section-1', payload: { className: 'visible' } },
          { type: 'animation.play', target: 'section-1' }
        ]
      }
    ]);

    await runner.handleEvent('viewport.enter', 'section-1');
    expect(executeSpy).toHaveBeenCalledTimes(2);
  });
});
