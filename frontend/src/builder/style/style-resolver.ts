/**
 * Style Resolver — Resolves effective styles for a node across breakpoints & pseudo states
 *
 * Implements the inheritance precedence chain (Blueprint Part 17):
 * Base Style -> Breakpoint Override -> Pseudo State Override
 *
 * @module builder/style/style-resolver
 */

import type {
  NodeStyleRules,
  ResponsiveStyleBlock,
  BreakpointId,
  PseudoState,
  StyleValue,
} from '../schema/style';
import { isTokenRef } from '../schema/style';

export interface StyleResolverContext {
  activeBreakpoint?: BreakpointId;
  activeState?: PseudoState;
  tokenDictionary?: Record<string, string>;
}

/**
 * Resolve token reference into concrete CSS string if token dictionary is available.
 */
export function resolveStyleValue(
  value: StyleValue | undefined,
  tokenDictionary?: Record<string, string>,
): string | number | undefined {
  if (value === undefined) return undefined;
  if (isTokenRef(value)) {
    if (tokenDictionary && tokenDictionary[value.$token]) {
      return tokenDictionary[value.$token];
    }
    // Fall back to CSS variable format var(--token-name)
    const varName = value.$token.replace(/\./g, '-');
    return `var(--${varName})`;
  }
  return value;
}

/**
 * Resolve responsive style block into a flat CSS properties map for rendering.
 */
export function resolveNodeStyle(
  styleBlock: ResponsiveStyleBlock | NodeStyleRules | undefined,
  context: StyleResolverContext = {},
): React.CSSProperties {
  if (!styleBlock) return {};

  const { activeBreakpoint = 'desktop', activeState, tokenDictionary } = context;

  // Check if styleBlock is full ResponsiveStyleBlock or flat NodeStyleRules
  const block: ResponsiveStyleBlock = 'base' in styleBlock
    ? (styleBlock as ResponsiveStyleBlock)
    : { base: styleBlock as NodeStyleRules };

  // 1. Base style
  let effective: NodeStyleRules = { ...block.base };

  // 2. Apply Breakpoint Override (desktop -> tablet -> mobile inheritance)
  if (block.breakpoints) {
    if (activeBreakpoint === 'tablet') {
      effective = { ...effective, ...block.breakpoints.tablet };
    } else if (activeBreakpoint === 'mobile') {
      effective = {
        ...effective,
        ...block.breakpoints.tablet,
        ...block.breakpoints.mobile,
      };
    }
  }

  // 3. Apply Pseudo State Override
  if (activeState && block.states && block.states[activeState]) {
    effective = { ...effective, ...block.states[activeState] };
  }

  // Convert NodeStyleRules to React.CSSProperties
  const css: React.CSSProperties = {};

  for (const [key, val] of Object.entries(effective)) {
    if (key === 'layoutMode' || key === 'customProperties') continue;

    const resolved = resolveStyleValue(val as StyleValue, tokenDictionary);
    if (resolved !== undefined) {
      (css as Record<string, unknown>)[key] = resolved;
    }
  }

  // Layout mode overrides
  if (effective.layoutMode === 'flex') {
    css.display = css.display || 'flex';
  } else if (effective.layoutMode === 'grid') {
    css.display = css.display || 'grid';
  } else if (effective.layoutMode === 'freeform') {
    css.position = css.position || 'relative';
  }

  return css;
}
