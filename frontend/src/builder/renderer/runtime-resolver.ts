/**
 * Runtime Resolver — Maps node types to React components
 *
 * This is the bridge between the normalized document and the React rendering tree.
 * It resolves a node's type string to a registered ComponentDefinition.
 *
 * @module builder/renderer/runtime-resolver
 */

import { componentRegistry } from '../registry/component-registry';
import type { ComponentDefinition } from '../registry/registry-types';
import type { PageNode } from '../schema/document';

/**
 * Resolve a node to its component definition.
 *
 * If the node's componentVersion is outdated, props will be migrated
 * to the current version.
 */
export function resolveComponent(node: PageNode): {
  definition: ComponentDefinition | null;
  resolvedProps: Record<string, unknown>;
} {
  const definition = componentRegistry.get(node.type);

  if (!definition) {
    console.warn(
      `[RuntimeResolver] Unknown component type: "${node.type}". Node "${node.id}" will render as fallback.`,
    );
    return { definition: null, resolvedProps: node.props };
  }

  // Check if migration is needed
  let resolvedProps = node.props;
  if (node.componentVersion < definition.version && definition.migrations) {
    resolvedProps = componentRegistry.migrateProps(
      node.type,
      node.componentVersion,
      node.props,
    );
  }

  return { definition, resolvedProps };
}

/**
 * Resolve all slot children for a node, returning a Record<slotName, NodeId[]>.
 */
export function resolveSlots(node: PageNode): Record<string, string[]> {
  return node.slots;
}
