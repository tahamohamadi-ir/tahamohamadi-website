/**
 * Document Store — Zustand store for the normalized page document
 *
 * This is the PERSISTABLE state — the page schema that gets saved to the DB.
 * Editor session state (selection, hover, etc.) is in editor-store.ts.
 *
 * ADR-010: Zustand document/session state
 *
 * @module builder/state/document-store
 */

import { createStore } from 'zustand/vanilla';
import type { PageDocument, PageNode, NodeId, StyleDefinition, StyleId } from '../schema/document';
import { CURRENT_SCHEMA_VERSION, DEFAULT_BREAKPOINTS } from '../schema/document';
import type { Patch, PatchOp } from '../core/command-bus';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export interface DocumentState {
  /** The full page document (source of truth). */
  document: PageDocument;

  /** Whether the document has unsaved changes. */
  isDirty: boolean;

  /** Current revision number for optimistic concurrency. */
  revision: number;
}

export interface DocumentActions {
  /** Load a document from the server. */
  loadDocument: (doc: PageDocument, revision?: number) => void;

  /** Apply patches from command execution. */
  applyPatches: (patches: Patch) => void;

  /** Mark as saved. */
  markSaved: (revision: number) => void;

  /** Mark as dirty. */
  markDirty: () => void;

  /** Get a single node by ID. */
  getNode: (nodeId: NodeId) => PageNode | undefined;

  /** Get children of a node in a specific slot. */
  getSlotChildren: (nodeId: NodeId, slotName: string) => NodeId[];

  /** Get the root node. */
  getRootNode: () => PageNode | undefined;

  /** Get a style definition. */
  getStyle: (styleId: StyleId) => StyleDefinition | undefined;
}

export type DocumentStore = DocumentState & DocumentActions;

// ---------------------------------------------------------------------------
// Default empty document
// ---------------------------------------------------------------------------

export function createEmptyDocument(id?: string, isTemplate?: boolean, parentId?: string): PageDocument {
  const docId = id ?? 'page_new';
  const rootId = 'node_root';

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    document: {
      id: docId,
      title: 'Untitled Page',
      locale: 'fa-IR',
      direction: 'rtl',
      isTemplate: isTemplate ?? false,
      parentId,
    },
    rootNodeId: rootId,
    nodes: {
      [rootId]: {
        id: rootId,
        type: 'core.page',
        componentVersion: 1,
        props: {},
        slots: { children: [] },
        styleRefs: [],
        metadata: { name: 'Page' },
      },
    },
    styles: {},
    bindings: {},
    queries: {},
    conditions: {},
    interactions: {},
    animations: {},
    seo: {},
    breakpoints: DEFAULT_BREAKPOINTS,
  };
}

// ---------------------------------------------------------------------------
// Patch application
// ---------------------------------------------------------------------------

/**
 * Apply a single patch operation to a document (immutable).
 * Uses a simplified path resolution: "nodes.abc.props" → doc.nodes.abc.props
 */
function applyPatchOp(doc: PageDocument, op: PatchOp): PageDocument {
  const parts = op.path.split('.');
  // Deep clone (shallow on top-level)
  const result = { ...doc };

  const val = 'value' in op ? op.value : undefined;

  if (parts.length === 1) {
    // Top-level key
    if (op.op === 'remove') {
      const rest = { ...(result as Record<string, unknown>) };
      delete rest[parts[0]];
      return rest as unknown as PageDocument;
    }
    (result as Record<string, unknown>)[parts[0]] = val;
    return result;
  }

  // Navigate to the parent of the target
  if (parts[0] === 'nodes') {
    result.nodes = { ...result.nodes };

    if (parts.length === 2) {
      // nodes.{nodeId}
      if (op.op === 'remove') {
        const rest = { ...result.nodes };
        delete rest[parts[1]];
        result.nodes = rest;
      } else {
        result.nodes[parts[1]] = val as PageNode;
      }
      return result;
    }

    // nodes.{nodeId}.{field}...
    const nodeId = parts[1];
    if (!result.nodes[nodeId] && op.op !== 'add') return result;

    const node = { ...result.nodes[nodeId] };

    if (parts.length === 3) {
      // nodes.{nodeId}.props / nodes.{nodeId}.metadata / etc.
      (node as Record<string, unknown>)[parts[2]] = val;
    } else if (parts.length === 4) {
      // nodes.{nodeId}.slots.{slotName} / nodes.{nodeId}.props.{key}
      const container = { ...(node as Record<string, unknown>)[parts[2]] as Record<string, unknown> };
      container[parts[3]] = val;
      (node as Record<string, unknown>)[parts[2]] = container;
    }

    result.nodes[nodeId] = node as PageNode;
    return result;
  }

  if (parts[0] === 'styles') {
    result.styles = { ...result.styles };
    if (parts.length === 2) {
      if (op.op === 'remove') {
        const rest = { ...result.styles };
        delete rest[parts[1]];
        result.styles = rest;
      } else {
        result.styles[parts[1]] = val as StyleDefinition;
      }
    }
    return result;
  }

  // Fallback: set value at path
  let target: Record<string, unknown> = result as unknown as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) {
    target[parts[i]] = { ...(target[parts[i]] as Record<string, unknown>) };
    target = target[parts[i]] as Record<string, unknown>;
  }
  const lastKey = parts[parts.length - 1];
  if (op.op === 'remove') {
    delete target[lastKey];
  } else {
    target[lastKey] = val;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Store factory
// ---------------------------------------------------------------------------

export function createDocumentStore(initialDoc?: PageDocument) {
  return createStore<DocumentStore>((set, get) => ({
    document: initialDoc ?? createEmptyDocument(),
    isDirty: false,
    revision: 0,

    loadDocument: (doc, revision = 0) => {
      set({ document: doc, isDirty: false, revision });
    },

    applyPatches: (patches) => {
      set((state) => {
        let doc = state.document;
        for (const op of patches) {
          doc = applyPatchOp(doc, op);
        }
        return { document: doc, isDirty: true };
      });
    },

    markSaved: (revision) => {
      set({ isDirty: false, revision });
    },

    markDirty: () => {
      set({ isDirty: true });
    },

    getNode: (nodeId) => get().document.nodes[nodeId],

    getSlotChildren: (nodeId, slotName) =>
      get().document.nodes[nodeId]?.slots[slotName] ?? [],

    getRootNode: () => {
      const doc = get().document;
      return doc.nodes[doc.rootNodeId];
    },

    getStyle: (styleId) => get().document.styles[styleId],
  }));
}

export type DocumentStoreApi = ReturnType<typeof createDocumentStore>;
