/**
 * Builder Style Engine Module Exports
 * @module builder/style
 */

export { resolveNodeStyle, resolveStyleValue } from './style-resolver';
export type { StyleResolverContext } from './style-resolver';

export { compileDocumentCSS, compileStyleDeclarations } from './css-compiler';
