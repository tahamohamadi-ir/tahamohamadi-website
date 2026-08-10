/**
 * CSS Compiler — Generates clean scoped CSS rules from document styles
 *
 * Implements generated CSS + CSS Variables compilation (Blueprint Part 19).
 *
 * @module builder/style/css-compiler
 */

import type { PageDocument, NodeId } from '../schema/document';
import type { NodeStyleRules, ResponsiveStyleBlock } from '../schema/style';
import { resolveNodeStyle } from './style-resolver';

/**
 * Convert camelCase CSS property to kebab-case.
 */
function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Compile a React.CSSProperties map into CSS declaration string.
 */
export function compileStyleDeclarations(css: React.CSSProperties): string {
  const lines: string[] = [];
  for (const [prop, val] of Object.entries(css)) {
    if (val !== undefined && val !== null && val !== '') {
      lines.push(`  ${camelToKebab(prop)}: ${val};`);
    }
  }
  return lines.join('\n');
}

/**
 * Compile entire page document styles into a scoped CSS stylesheet string.
 */
export function compileDocumentCSS(doc: PageDocument): string {
  const cssBlocks: string[] = [];

  // Compile tokens to CSS variables
  const tokenLines: string[] = [];
  // Default tokens if available
  tokenLines.push('  --spacing-1: 0.25rem;');
  tokenLines.push('  --spacing-2: 0.5rem;');
  tokenLines.push('  --spacing-4: 1rem;');
  tokenLines.push('  --spacing-8: 2rem;');
  tokenLines.push('  --color-primary: #4f46e5;');

  cssBlocks.push(`:root {\n${tokenLines.join('\n')}\n}`);

  // Compile node styles
  for (const [nodeId, node] of Object.entries(doc.nodes)) {
    const className = `builder-node-${nodeId}`;

    // Base CSS
    const baseCss = resolveNodeStyle((node.props.style as ResponsiveStyleBlock) || {}, { activeBreakpoint: 'desktop' });
    const baseDecls = compileStyleDeclarations(baseCss);

    const decls = baseDecls ? `  box-sizing: border-box;\n${baseDecls}` : '  box-sizing: border-box;';
    cssBlocks.push(`.${className} {\n${decls}\n}`);
  }

  return cssBlocks.join('\n\n');
}
