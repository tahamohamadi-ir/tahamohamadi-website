import type { NodeId, PageNode, StyleDefinition } from './document';

/**
 * Symbol Definition Model
 * 
 * A Symbol is a reusable component subtree that maintains a link
 * to a single master definition. When the master is updated,
 * all instances of the symbol across all pages are updated.
 */
export interface SymbolDefinition {
  /** Unique identifier for the symbol master */
  id: string;
  
  /** Human-readable name for the symbol (e.g., "Main Navbar") */
  name: string;
  
  /** Root node ID of the symbol subtree */
  rootNodeId: NodeId;
  
  /** The normalized node map containing the root node and all descendants */
  nodes: Record<NodeId, PageNode>;
  
  /** Master version for optimistic concurrency and cache busting */
  version: number;
}

/**
 * Global Class Definition Model
 * 
 * A Global Class allows applying a reusable set of responsive styles
 * across multiple nodes without duplicating style definitions.
 */
export interface GlobalClass {
  /** Unique ID for the class (e.g., "class_123") */
  id: string;
  
  /** Human-readable name (e.g., "Heading Large") */
  name: string;
  
  /** The responsive style definition */
  style: StyleDefinition;
}
