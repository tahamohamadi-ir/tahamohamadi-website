/**
 * Safe Expression Engine — Evaluates typed AST expressions safely
 *
 * Blueprint Part 22: Safe Expression Engine
 * NO eval() OR new Function() IS ALLOWED.
 *
 * @module builder/interactions/expression-engine
 */

export type Operator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'and'
  | 'or'
  | 'not'
  | 'in'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'isEmpty';

export interface ContextRefNode {
  ctx: string;
}

export interface ValueNode {
  value: unknown;
}

export interface ASTNode {
  op?: Operator;
  args?: (ASTNode | ContextRefNode | ValueNode | unknown)[];
  ctx?: string;
  value?: unknown;
}

export interface ExecutionContext {
  user?: Record<string, unknown>;
  route?: {
    path?: string;
    params?: Record<string, unknown>;
    query?: Record<string, unknown>;
  };
  componentState?: Record<string, unknown>;
  pageVariables?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Safely resolve a nested dot-notated property path from execution context.
 * e.g., "user.authenticated" -> context.user.authenticated
 */
export function resolveContextPath(path: string, context: ExecutionContext): unknown {
  const parts = path.split('.');
  let current: unknown = context;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Evaluates an AST Node against an execution context safely.
 */
export function evaluateExpression(node: unknown, context: ExecutionContext): unknown {
  if (node === null || node === undefined) {
    return node;
  }

  // Primitive value
  if (typeof node !== 'object') {
    return node;
  }

  const ast = node as ASTNode;

  // Context Reference Node: { ctx: "user.authenticated" }
  if ('ctx' in ast && typeof ast.ctx === 'string') {
    return resolveContextPath(ast.ctx, context);
  }

  // Value Node wrapper: { value: 123 }
  if ('value' in ast && !('op' in ast)) {
    return ast.value;
  }

  // Operator Node
  if (!ast.op) {
    return node;
  }

  const evaluatedArgs = (ast.args || []).map((arg) => evaluateExpression(arg, context));

  switch (ast.op) {
    case 'eq':
      return evaluatedArgs[0] === evaluatedArgs[1];
    case 'neq':
      return evaluatedArgs[0] !== evaluatedArgs[1];
    case 'gt':
      return Number(evaluatedArgs[0]) > Number(evaluatedArgs[1]);
    case 'gte':
      return Number(evaluatedArgs[0]) >= Number(evaluatedArgs[1]);
    case 'lt':
      return Number(evaluatedArgs[0]) < Number(evaluatedArgs[1]);
    case 'lte':
      return Number(evaluatedArgs[0]) <= Number(evaluatedArgs[1]);
    case 'and':
      return evaluatedArgs.every(Boolean);
    case 'or':
      return evaluatedArgs.some(Boolean);
    case 'not':
      return !evaluatedArgs[0];
    case 'in':
      if (Array.isArray(evaluatedArgs[1])) {
        return evaluatedArgs[1].includes(evaluatedArgs[0]);
      }
      return false;
    case 'contains':
      if (typeof evaluatedArgs[0] === 'string') {
        return evaluatedArgs[0].includes(String(evaluatedArgs[1]));
      }
      if (Array.isArray(evaluatedArgs[0])) {
        return evaluatedArgs[0].includes(evaluatedArgs[1]);
      }
      return false;
    case 'startsWith':
      return String(evaluatedArgs[0]).startsWith(String(evaluatedArgs[1]));
    case 'endsWith':
      return String(evaluatedArgs[0]).endsWith(String(evaluatedArgs[1]));
    case 'isEmpty': {
      const val = evaluatedArgs[0];
      if (val === null || val === undefined) return true;
      if (typeof val === 'string' || Array.isArray(val)) return val.length === 0;
      if (typeof val === 'object') return Object.keys(val).length === 0;
      return false;
    }
    default:
      console.warn(`[SafeExpressionEngine] Unknown operator: ${ast.op}`);
      return false;
  }
}
