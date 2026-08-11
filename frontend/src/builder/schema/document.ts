/**
 * Page Document Model — Core Schema Types
 *
 * This is the canonical Source of Truth for all page content.
 * No library-specific data should ever leak into these types.
 *
 * Architecture Decision Records:
 *   ADR-002: Semantic JSON is Source of Truth
 *   ADR-003: Normalized node model + semantic slots
 *
 * @module builder/schema/document
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** Unique identifier for a node within a document. */
export type NodeId = string;

/** Unique identifier for a style definition. */
export type StyleId = string;

/** Unique identifier for a binding definition. */
export type BindingId = string;

/** Unique identifier for an interaction definition. */
export type InteractionId = string;

/** Unique identifier for an animation definition. */
export type AnimationId = string;

/** Unique identifier for a breakpoint. */
export type BreakpointId = string;

// ---------------------------------------------------------------------------
// Design Token Reference
// ---------------------------------------------------------------------------

/** A reference to a design token instead of a raw value. */
export interface TokenRef {
  $token: string;
}

/** A style value that can be either a raw value or a token reference. */
export type StyleValue = string | number | TokenRef;

// ---------------------------------------------------------------------------
// Visibility Rule
// ---------------------------------------------------------------------------

export interface VisibilityRule {
  /** The condition expression ID controlling visibility. */
  conditionId?: string;
  /** Whether the node is hidden in all breakpoints. */
  hidden?: boolean;
  /** Breakpoints where the node is hidden. */
  hiddenBreakpoints?: BreakpointId[];
}

// ---------------------------------------------------------------------------
// Page Node
// ---------------------------------------------------------------------------

/**
 * A single node in the normalized document tree.
 *
 * Nodes are stored in a flat map keyed by `id` for O(1) lookup,
 * selective subscriptions, smaller patches, and easier collaboration.
 */
export interface PageNode {
  /** Unique node identifier. */
  id: NodeId;

  /**
   * Namespaced component type.
   * Examples: "core.page", "layout.section", "content.heading", "ui.button"
   */
  type: string;

  /** Component schema version for migration support. */
  componentVersion: number;

  /** Component-specific props. Schema defined by the component definition. */
  props: Record<string, unknown>;

  /**
   * Semantic slots mapping slot names to ordered arrays of child node IDs.
   * Example: { children: ["node-1", "node-2"], header: ["node-3"] }
   */
  slots: Record<string, NodeId[]>;

  /** References to style definitions for this node. */
  styleRefs: StyleId[];

  /** Data binding references mapping prop names to binding IDs. */
  bindingRefs?: Record<string, BindingId>;

  /** Visibility rules for conditional rendering. */
  visibility?: VisibilityRule;

  /** Condition ID for conditional rendering. */
  conditionId?: string;

  /** Interaction IDs attached to this node. */
  interactionIds?: InteractionId[];

  /** Animation IDs attached to this node. */
  animationIds?: AnimationId[];

  /** Editor-only metadata (not rendered in production). */
  metadata?: NodeMetadata;
}

export interface NodeMetadata {
  /** Human-readable name shown in layers panel. */
  name?: string;
  /** Whether the node is locked from editing. */
  locked?: boolean;
  /** Whether the node is hidden in the editor (but may render in production). */
  hiddenInEditor?: boolean;
}

// ---------------------------------------------------------------------------
// Style Definitions
// ---------------------------------------------------------------------------

export interface StyleDefinition {
  /** Base styles applied at all breakpoints. */
  base: Record<string, StyleValue>;
  /** Breakpoint-specific overrides merged on top of base. */
  breakpoints?: Record<BreakpointId, Record<string, StyleValue>>;
  /** Pseudo-state overrides. */
  states?: Record<string, Record<string, StyleValue>>;
}

// ---------------------------------------------------------------------------
// Data Binding
// ---------------------------------------------------------------------------

export interface BindingDefinition {
  id: BindingId;
  /** The data source query ID this binding reads from. */
  source: string;
  /** JSON path to the value within the source result. */
  path: string[];
  /** Fallback value if the binding resolves to undefined. */
  fallback?: unknown;
}

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------

export interface InteractionTrigger {
  type: string;
  target?: string;
}

export interface InteractionAction {
  type: string;
  [key: string]: unknown;
}

export interface InteractionDefinition {
  trigger: InteractionTrigger;
  condition?: Record<string, unknown>;
  actions: InteractionAction[];
}

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

export interface AnimationKeyframe {
  target: string;
  from: Record<string, number | string>;
  to: Record<string, number | string>;
  duration: number;
  delay?: number;
  easing?: string;
}

export interface AnimationTrigger {
  type: string;
  once?: boolean;
  threshold?: number;
}

export interface AnimationDefinition {
  trigger: AnimationTrigger;
  timeline: AnimationKeyframe[];
}

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

export interface QueryDefinition {
  id: string;
  source: string;
  select?: string[];
  where?: Record<string, unknown>;
  orderBy?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Breakpoint
// ---------------------------------------------------------------------------

export interface BreakpointDefinition {
  id: BreakpointId;
  label: string;
  /** Max-width in pixels. `null` for the base (desktop) breakpoint. */
  maxWidth: number | null;
  /** Order for cascade — lower number = wider screen. */
  order: number;
}

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------

export interface PageSeo {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  structuredData?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Page Document (Root)
// ---------------------------------------------------------------------------

/**
 * The complete, serializable page document.
 *
 * This is the single source of truth persisted in the database as JSONB.
 * No editor session state (selection, hover, zoom, etc.) belongs here.
 */
export interface PageDocument {
  /** Schema version for document-level migrations. */
  schemaVersion: string;

  /** Document metadata. */
  document: {
    id: string;
    siteId?: string;
    title: string;
    locale?: string;
    direction?: 'ltr' | 'rtl';
    isTemplate?: boolean;
    parentId?: string;
  };

  /** ID of the root node in the nodes map. */
  rootNodeId: NodeId;

  /** Flat normalized map of all nodes. */
  nodes: Record<NodeId, PageNode>;

  /** Style definitions referenced by nodes. */
  styles: Record<StyleId, StyleDefinition>;

  /** Data binding definitions. */
  bindings: Record<BindingId, BindingDefinition>;

  /** Query definitions for dynamic data. */
  queries: Record<string, QueryDefinition>;

  /** Condition expressions for conditional rendering. */
  conditions: Record<string, Record<string, unknown>>;

  /** Interaction definitions. */
  interactions: Record<InteractionId, InteractionDefinition>;

  /** Animation definitions. */
  animations: Record<AnimationId, AnimationDefinition>;

  /** SEO metadata. */
  seo: PageSeo;

  /** Available breakpoints for responsive design. */
  breakpoints?: BreakpointDefinition[];
}

// ---------------------------------------------------------------------------
// Default Breakpoints
// ---------------------------------------------------------------------------

export const DEFAULT_BREAKPOINTS: BreakpointDefinition[] = [
  { id: 'bp_desktop', label: 'Desktop', maxWidth: null, order: 0 },
  { id: 'bp_tablet', label: 'Tablet', maxWidth: 1024, order: 1 },
  { id: 'bp_mobile', label: 'Mobile', maxWidth: 640, order: 2 },
];

// ---------------------------------------------------------------------------
// Schema Version
// ---------------------------------------------------------------------------

export const CURRENT_SCHEMA_VERSION = '1.0.0';
