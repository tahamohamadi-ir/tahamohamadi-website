/**
 * Schema Validation — Zod schemas for developer ergonomics
 *
 * JSON Schema (Ajv) is the persistence contract; Zod provides
 * TypeScript-native DX for runtime validation on the client.
 *
 * @module builder/schema/validation
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Token Reference
// ---------------------------------------------------------------------------

export const TokenRefSchema = z.object({
  $token: z.string().min(1),
});

export const StyleValueSchema = z.union([
  z.string(),
  z.number(),
  TokenRefSchema,
]);

// ---------------------------------------------------------------------------
// Node Metadata
// ---------------------------------------------------------------------------

export const NodeMetadataSchema = z
  .object({
    name: z.string().optional(),
    locked: z.boolean().optional(),
    hiddenInEditor: z.boolean().optional(),
  })
  .strict();

// ---------------------------------------------------------------------------
// Visibility Rule
// ---------------------------------------------------------------------------

export const VisibilityRuleSchema = z
  .object({
    conditionId: z.string().optional(),
    hidden: z.boolean().optional(),
    hiddenBreakpoints: z.array(z.string()).optional(),
  })
  .strict();

// ---------------------------------------------------------------------------
// Page Node
// ---------------------------------------------------------------------------

export const PageNodeSchema = z
  .object({
    id: z.string().min(1),
    type: z.string().min(1).regex(/^[a-z]+\.[a-z]/, {
      message: 'Node type must be namespaced (e.g. "layout.section")',
    }),
    componentVersion: z.number().int().min(1),
    props: z.record(z.string(), z.unknown()),
    slots: z.record(z.string(), z.array(z.string())),
    styleRefs: z.array(z.string()),
    bindingRefs: z.record(z.string(), z.string()).optional(),
    visibility: VisibilityRuleSchema.optional(),
    conditionId: z.string().optional(),
    interactionIds: z.array(z.string()).optional(),
    animationIds: z.array(z.string()).optional(),
    metadata: NodeMetadataSchema.optional(),
  })
  .strict();

// ---------------------------------------------------------------------------
// Style Definition
// ---------------------------------------------------------------------------

export const StyleDefinitionSchema = z.object({
  base: z.record(z.string(), StyleValueSchema),
  breakpoints: z.record(z.string(), z.record(z.string(), StyleValueSchema)).optional(),
  states: z.record(z.string(), z.record(z.string(), StyleValueSchema)).optional(),
});

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------

export const PageSeoSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    canonical: z.string().url().optional(),
    robots: z.string().optional(),
    ogTitle: z.string().optional(),
    ogDescription: z.string().optional(),
    ogImage: z.string().optional(),
    twitterCard: z.string().optional(),
    structuredData: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

// ---------------------------------------------------------------------------
// Breakpoint
// ---------------------------------------------------------------------------

export const BreakpointDefinitionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  maxWidth: z.number().positive().nullable(),
  order: z.number().int().min(0),
});

// ---------------------------------------------------------------------------
// Document Metadata
// ---------------------------------------------------------------------------

export const DocumentMetaSchema = z.object({
  id: z.string().min(1),
  siteId: z.string().optional(),
  title: z.string().min(1),
  locale: z.string().optional(),
  direction: z.enum(['ltr', 'rtl']).optional(),
});

// ---------------------------------------------------------------------------
// Full Page Document
// ---------------------------------------------------------------------------

export const PageDocumentSchema = z
  .object({
    schemaVersion: z.string(),
    document: DocumentMetaSchema,
    rootNodeId: z.string().min(1),
    nodes: z.record(z.string(), PageNodeSchema),
    styles: z.record(z.string(), StyleDefinitionSchema),
    bindings: z.record(z.string(), z.unknown()),
    queries: z.record(z.string(), z.unknown()),
    conditions: z.record(z.string(), z.unknown()),
    interactions: z.record(z.string(), z.unknown()),
    animations: z.record(z.string(), z.unknown()),
    seo: PageSeoSchema,
    breakpoints: z.array(BreakpointDefinitionSchema).optional(),
  })
  .strict();

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

export type PageDocumentInput = z.infer<typeof PageDocumentSchema>;

/**
 * Validate a page document and return typed errors.
 */
export function validatePageDocument(data: unknown): {
  success: boolean;
  data?: PageDocumentInput;
  errors?: z.ZodError;
} {
  const result = PageDocumentSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}
