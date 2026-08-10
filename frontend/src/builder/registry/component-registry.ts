/**
 * Component Registry — Central registry for all builder components
 *
 * Not just a Map — includes versions, migrations, slot constraints,
 * capability flags, and AI metadata (Blueprint Part 13).
 *
 * @module builder/registry/component-registry
 */

import type { ComponentDefinition } from './registry-types';

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export class ComponentRegistryImpl {
  private definitions = new Map<string, ComponentDefinition>();
  private typeVersions = new Map<string, Map<number, ComponentDefinition>>();


  /**
   * Register a component definition.
   */
  register(definition: ComponentDefinition): void {
    const { type, version } = definition;

    if (this.definitions.has(type)) {
      const existing = this.definitions.get(type)!;
      if (existing.version === version) {
        console.warn(
          `[ComponentRegistry] Component "${type}" v${version} is being re-registered.`,
        );
      }
    }

    this.definitions.set(type, definition);

    // Track versions
    if (!this.typeVersions.has(type)) {
      this.typeVersions.set(type, new Map());
    }
    this.typeVersions.get(type)!.set(version, definition);
  }

  /**
   * Get the latest definition for a component type.
   */
  get(type: string): ComponentDefinition | undefined {
    return this.definitions.get(type);
  }

  /**
   * Get a specific version of a component definition.
   */
  getVersion(type: string, version: number): ComponentDefinition | undefined {
    return this.typeVersions.get(type)?.get(version);
  }

  /**
   * Check if a component type is registered.
   */
  has(type: string): boolean {
    return this.definitions.has(type);
  }

  /**
   * Get all registered component types.
   */
  getAll(): ComponentDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Get components filtered by category.
   */
  getByCategory(category: string): ComponentDefinition[] {
    return this.getAll().filter((def) => def.meta.category === category);
  }

  /**
   * Get components visible in the library (non-hidden).
   */
  getLibraryComponents(): ComponentDefinition[] {
    return this.getAll().filter((def) => !def.meta.hidden);
  }

  /**
   * Get all categories.
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    for (const def of this.definitions.values()) {
      categories.add(def.meta.category);
    }
    return Array.from(categories).sort();
  }

  /**
   * Validate that a child component type is accepted in a parent's slot.
   */
  validateSlotAcceptance(
    parentType: string,
    slotName: string,
    childType: string,
  ): { valid: boolean; reason?: string } {
    const parentDef = this.get(parentType);
    if (!parentDef) {
      return { valid: false, reason: `Unknown parent type: ${parentType}` };
    }

    const slotConstraint = parentDef.slots[slotName];
    if (!slotConstraint) {
      return { valid: false, reason: `Slot "${slotName}" not defined on ${parentType}` };
    }

    // Check rejects first
    if (slotConstraint.rejects?.some((pattern) => matchTypePattern(childType, pattern))) {
      return { valid: false, reason: `${childType} is rejected in slot "${slotName}"` };
    }

    // Check accepts (if specified)
    if (slotConstraint.accepts && slotConstraint.accepts.length > 0) {
      const accepted = slotConstraint.accepts.some((pattern) =>
        matchTypePattern(childType, pattern),
      );
      if (!accepted) {
        return {
          valid: false,
          reason: `${childType} is not accepted in slot "${slotName}". Accepted: ${slotConstraint.accepts.join(', ')}`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Migrate component props from an old version to the current version.
   */
  migrateProps(
    type: string,
    fromVersion: number,
    props: Record<string, unknown>,
  ): Record<string, unknown> {
    const def = this.get(type);
    if (!def || !def.migrations) return props;

    let currentProps = { ...props };
    let currentVersion = fromVersion;

    while (currentVersion < def.version) {
      const migrationFn = def.migrations[currentVersion];
      if (!migrationFn) {
        console.warn(
          `[ComponentRegistry] No migration for "${type}" from v${currentVersion}`,
        );
        break;
      }
      currentProps = migrationFn(currentProps);
      currentVersion++;
    }

    return currentProps;
  }

  /**
   * Clear all registrations (useful for testing).
   */
  clear(): void {
    this.definitions.clear();
    this.typeVersions.clear();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Match a component type against a glob-like pattern.
 * Supports wildcards: "content.*" matches "content.heading", "content.text", etc.
 * Exact match: "ui.button" only matches "ui.button".
 */
function matchTypePattern(type: string, pattern: string): boolean {
  if (pattern === '*') return true;
  if (pattern === type) return true;

  if (pattern.endsWith('.*')) {
    const prefix = pattern.slice(0, -2);
    return type.startsWith(prefix + '.');
  }

  return false;
}

// ---------------------------------------------------------------------------
// Convenience helper
// ---------------------------------------------------------------------------

/**
 * Define a component (type-safe wrapper).
 */
export function defineComponent<
  TProps extends Record<string, unknown> = Record<string, unknown>,
>(definition: ComponentDefinition<TProps>): ComponentDefinition<TProps> {
  return definition;
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const componentRegistry = new ComponentRegistryImpl();
