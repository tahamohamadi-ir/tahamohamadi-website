/**
 * Builder Schema — Public Exports
 * @module builder/schema
 */

export type {
  NodeId,
  StyleId,
  BindingId,
  InteractionId,
  AnimationId,
  BreakpointId,
  TokenRef,
  StyleValue,
  VisibilityRule,
  PageNode,
  NodeMetadata,
  StyleDefinition,
  BindingDefinition,
  InteractionTrigger,
  InteractionAction,
  InteractionDefinition,
  AnimationKeyframe,
  AnimationTrigger,
  AnimationDefinition,
  QueryDefinition,
  BreakpointDefinition,
  PageSeo,
  PageDocument,
} from './document';

export { DEFAULT_BREAKPOINTS, CURRENT_SCHEMA_VERSION } from './document';

export { NODE_TYPES, CATEGORY_LABELS, getNodeCategory, getNodeName } from './node-types';
export type { NodeType } from './node-types';

export {
  PageDocumentSchema,
  PageNodeSchema,
  StyleDefinitionSchema,
  validatePageDocument,
} from './validation';
export type { PageDocumentInput } from './validation';

export * from './document';
export * from './node-types';
export * from './validation';
export * from './style';
