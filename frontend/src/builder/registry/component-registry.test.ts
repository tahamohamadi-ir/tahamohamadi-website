import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentRegistryImpl as ComponentRegistry } from './component-registry';
import { defineComponent } from './component-registry';
import { z } from 'zod';

describe('ComponentRegistry', () => {
  let registry: ComponentRegistry;

  beforeEach(() => {
    registry = new ComponentRegistry();
  });

  it('registers and retrieves custom component definitions', () => {
    const customComp = defineComponent({
      type: 'test.card',
      version: 1,
      meta: { name: 'Test Card', category: 'content' },
      propsSchema: z.object({ title: z.string() }),
      defaults: { title: 'Default Card' },
      slots: { content: { accepts: ['*'] } },
      capabilities: { style: true, animation: true, interactions: false, dataBinding: false, responsive: true },
      inspector: ['content'],
      render: () => null,
    });

    registry.register(customComp);

    expect(registry.has('test.card')).toBe(true);
    expect(registry.get('test.card')?.meta.name).toBe('Test Card');
    expect(registry.getLibraryComponents()).toHaveLength(1);
  });
});
