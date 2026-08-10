import { describe, it, expect } from 'vitest';
import { defineCustomComponent, registerCustomComponent, registerPlugin, migrateNodeProps } from './index';
import { componentRegistry } from '../registry';
import { z } from 'zod';

describe('Component SDK', () => {
  it('registers custom components and plugins', () => {
    const comp = defineCustomComponent({
      type: 'custom.banner',
      version: 1,
      meta: { name: 'Banner', category: 'marketing' },
      propsSchema: z.object({ text: z.string() }),
      defaults: { text: 'Hello' },
      slots: {},
      capabilities: { style: true },
      inspector: ['content'],
      render: () => null,
    });

    registerCustomComponent(comp);
    expect(componentRegistry.has('custom.banner')).toBe(true);

    const plugin = {
      id: 'plugin-cta',
      version: '1.0.0',
      sdkVersion: '1.0.0',
      components: [
        defineCustomComponent({
          type: 'plugin.cta',
          version: 1,
          meta: { name: 'Plugin CTA', category: 'marketing' },
          defaults: {},
          slots: {},
          capabilities: { style: true },
          inspector: ['content'],
          render: () => null,
        }),
      ],
    };

    registerPlugin(plugin);
    expect(componentRegistry.has('plugin.cta')).toBe(true);
  });
});
