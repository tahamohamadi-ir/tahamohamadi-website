/**
 * Component Registry Types — defineComponent API
 *
 * Based on Blueprint Part 12, 13.
 *
 * @module builder/registry/registry-types
 */

import type { ComponentType } from 'react';
import type { NodeId } from '../schema/document';

// ---------------------------------------------------------------------------
// Slot Constraint
// ---------------------------------------------------------------------------

export interface SlotConstraint {
  /** Component types accepted in this slot (glob patterns, e.g. "content.*"). */
  accepts?: string[];
  /** Component types NOT allowed in this slot. */
  rejects?: string[];
  /** Minimum number of children. Default: 0. */
  min?: number;
  /** Maximum number of children. Default: Infinity. */
  max?: number;
}

// ---------------------------------------------------------------------------
// Inspector Section
// ---------------------------------------------------------------------------

export type InspectorSection =
  | 'content'
  | 'layout'
  | 'style'
  | 'animation'
  | 'interaction'
  | 'data'
  | 'settings';

// ---------------------------------------------------------------------------
// Capability Flags
// ---------------------------------------------------------------------------

export interface ComponentCapabilities {
  style?: boolean;
  animation?: boolean;
  interactions?: boolean;
  dataBinding?: boolean;
  responsive?: boolean;
  richText?: boolean;
}

// ---------------------------------------------------------------------------
// AI Metadata
// ---------------------------------------------------------------------------

export interface ComponentAIMetadata {
  purpose?: string;
  bestFor?: string[];
  avoidInside?: string[];
  semanticRole?: string;
}

// ---------------------------------------------------------------------------
// Component Definition
// ---------------------------------------------------------------------------

export interface ComponentDefinition<
  TProps extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Namespaced component type. Must be unique. */
  type: string;

  /** Component schema version. Must be a positive integer. */
  version: number;

  /** Human-readable metadata for the editor UI. */
  meta: {
    name: string;
    description?: string;
    category: string;
    icon?: string;
    /** Hidden from the component library (e.g., core.page). */
    hidden?: boolean;
  };

  /** Zod or JSON Schema for props validation. */
  propsSchema?: unknown;

  /** Default prop values when a new instance is created. */
  defaults: Partial<TProps>;

  /** Slot constraints for this component. */
  slots: Record<string, SlotConstraint>;

  /** Capability flags. */
  capabilities: ComponentCapabilities;

  /** Inspector sections shown when this component is selected. */
  inspector: InspectorSection[];

  /** The React component used to render this node. */
  render: ComponentType<ComponentRenderProps<any>>;

  /** Migration functions: key = from version, value = migration fn. */
  migrations?: Record<number, (props: Record<string, unknown>) => Record<string, unknown>>;

  /** AI metadata for intelligent suggestions. */
  ai?: ComponentAIMetadata;
}

// ---------------------------------------------------------------------------
// Render Props (passed to the React component)
// ---------------------------------------------------------------------------

export interface ComponentRenderProps<
  TProps extends Record<string, unknown> = Record<string, unknown>,
> {
  /** The node ID. */
  nodeId: NodeId;
  /** Resolved props. */
  props: TProps;
  /** Render function for slots. */
  slots: Record<string, React.ReactNode>;
  /** Whether we're in editor mode vs. published mode. */
  isEditor: boolean;
  /** Whether this node is currently selected. */
  isSelected: boolean;
  /** Callback to update props directly from inline editor. */
  onPropsChange?: (patch: Partial<TProps>) => void;
}
