import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentRegistryImpl as ComponentRegistry } from './component-registry';
import { defineComponent } from './component-registry';

describe('Component Version Migrations', () => {
  let registry: ComponentRegistry;

  beforeEach(() => {
    registry = new ComponentRegistry();
  });

  it('runs sequential version migrations v1 -> v2 -> v3', () => {
    const compV3 = defineComponent({
      type: 'test.widget',
      version: 3,
      meta: { name: 'Widget', category: 'content' },
      defaults: { headingText: '' },
      slots: {},
      capabilities: { style: true },
      inspector: ['content'],
      render: () => null,
      migrations: {
        1: (props) => ({ ...props, title: props.title || 'Migrated Title' }),
        2: (props) => ({ headingText: props.title, legacy: true }),
      },
    });

    registry.register(compV3);

    const v1Props = { title: 'Old Title' };
    const migrated = registry.migrateProps('test.widget', 1, v1Props);

    expect(migrated).toEqual({ headingText: 'Old Title', legacy: true });
  });
});
