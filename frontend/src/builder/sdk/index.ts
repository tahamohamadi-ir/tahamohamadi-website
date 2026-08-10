/**
 * Builder Component SDK — Public developer extensibility interface
 *
 * Allows third-party component developers and plugin authors to safely define,
 * register, version, and migrate custom page builder components (Blueprint Part 7 & 12).
 *
 * @module builder/sdk
 */

import type { ComponentDefinition } from '../registry/registry-types';
import { componentRegistry, defineComponent as defineComp } from '../registry/component-registry';

export interface ComponentPlugin {
  id: string;
  version: string;
  sdkVersion: string;
  components: ComponentDefinition[];
}

/**
 * Define a custom component definition with full type safety.
 */
export function defineCustomComponent<
  TProps extends Record<string, unknown> = Record<string, unknown>,
>(definition: ComponentDefinition<TProps>): ComponentDefinition<TProps> {
  return defineComp(definition);
}

/**
 * Register a custom component into the builder component registry.
 */
export function registerCustomComponent(definition: ComponentDefinition): void {
  componentRegistry.register(definition);
}

/**
 * Register a component plugin bundle into the registry.
 */
export function registerPlugin(plugin: ComponentPlugin): void {
  for (const comp of plugin.components) {
    componentRegistry.register(comp);
  }
}

/**
 * Execute versioned prop migrations for a node payload.
 */
export function migrateNodeProps(
  type: string,
  fromVersion: number,
  props: Record<string, unknown>,
): Record<string, unknown> {
  return componentRegistry.migrateProps(type, fromVersion, props);
}

export type { ComponentDefinition, ComponentRenderProps } from '../registry/registry-types';
