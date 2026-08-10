/**
 * Style & Responsive Schema Definitions
 *
 * Defines design token references, responsive breakpoints, pseudo-states,
 * and semantic layout rules (Blueprint Parts 15-20).
 *
 * @module builder/schema/style
 */

export type BreakpointId = 'desktop' | 'tablet' | 'mobile';
export type PseudoState = 'hover' | 'focus' | 'active' | 'disabled';
export type LayoutMode = 'flow' | 'flex' | 'grid' | 'freeform';

export interface TokenRef {
  $token: string;
}

export type StyleValue = string | number | TokenRef;

export function isTokenRef(val: unknown): val is TokenRef {
  return typeof val === 'object' && val !== null && '$token' in val;
}

export interface BoxSpacing {
  top?: StyleValue;
  right?: StyleValue;
  bottom?: StyleValue;
  left?: StyleValue;
}

export interface NodeStyleRules {
  // Layout & Positioning
  layoutMode?: LayoutMode;
  display?: StyleValue;
  flexDirection?: StyleValue;
  justifyContent?: StyleValue;
  alignItems?: StyleValue;
  flexWrap?: StyleValue;
  gap?: StyleValue;

  gridTemplateColumns?: StyleValue;
  gridTemplateRows?: StyleValue;
  gridColumn?: StyleValue;
  gridRow?: StyleValue;

  position?: StyleValue; // static | relative | absolute | sticky
  top?: StyleValue;
  right?: StyleValue;
  bottom?: StyleValue;
  left?: StyleValue;
  zIndex?: StyleValue;

  // Sizing
  width?: StyleValue;
  minWidth?: StyleValue;
  maxWidth?: StyleValue;
  height?: StyleValue;
  minHeight?: StyleValue;
  maxHeight?: StyleValue;

  // Spacing
  padding?: BoxSpacing | StyleValue;
  margin?: BoxSpacing | StyleValue;

  // Typography
  fontFamily?: StyleValue;
  fontSize?: StyleValue;
  fontWeight?: StyleValue;
  lineHeight?: StyleValue;
  letterSpacing?: StyleValue;
  textAlign?: StyleValue;
  color?: StyleValue;

  // Background & Borders
  backgroundColor?: StyleValue;
  borderRadius?: StyleValue;
  borderWidth?: StyleValue;
  borderColor?: StyleValue;
  borderStyle?: StyleValue;
  boxShadow?: StyleValue;
  opacity?: StyleValue;
  overflow?: StyleValue;

  // Custom CSS properties extension
  customProperties?: Record<string, StyleValue>;
}

export interface ResponsiveStyleBlock {
  base: NodeStyleRules;
  breakpoints?: Partial<Record<BreakpointId, NodeStyleRules>>;
  states?: Partial<Record<PseudoState, NodeStyleRules>>;
}
