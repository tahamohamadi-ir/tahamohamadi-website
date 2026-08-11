import { describe, it, expect } from 'vitest';
import { evaluateExpression, resolveContextPath } from './expression-engine';

describe('Safe Expression Engine', () => {
  describe('resolveContextPath', () => {
    it('resolves nested properties', () => {
      const ctx = { user: { profile: { name: 'Ali' } } };
      expect(resolveContextPath('user.profile.name', ctx)).toBe('Ali');
    });

    it('returns undefined for missing properties', () => {
      const ctx = { user: {} };
      expect(resolveContextPath('user.profile.name', ctx)).toBeUndefined();
    });

    it('returns undefined for null/undefined objects in path', () => {
      const ctx = { user: null };
      expect(resolveContextPath('user.profile.name', ctx)).toBeUndefined();
    });
  });

  describe('evaluateExpression', () => {
    const context = {
      user: { authenticated: true, role: 'admin', age: 30 },
      route: { path: '/dashboard', params: { id: '123' } },
      componentState: { isOpen: false, tabs: ['a', 'b', 'c'] },
    };

    it('evaluates primitive values', () => {
      expect(evaluateExpression(42, context)).toBe(42);
      expect(evaluateExpression('hello', context)).toBe('hello');
      expect(evaluateExpression(true, context)).toBe(true);
    });

    it('evaluates context references', () => {
      expect(evaluateExpression({ ctx: 'user.authenticated' }, context)).toBe(true);
      expect(evaluateExpression({ ctx: 'user.age' }, context)).toBe(30);
    });

    it('evaluates value nodes', () => {
      expect(evaluateExpression({ value: 'static' }, context)).toBe('static');
    });

    it('evaluates eq / neq operators', () => {
      expect(
        evaluateExpression(
          { op: 'eq', args: [{ ctx: 'user.role' }, { value: 'admin' }] },
          context,
        ),
      ).toBe(true);

      expect(
        evaluateExpression(
          { op: 'neq', args: [{ ctx: 'user.role' }, { value: 'guest' }] },
          context,
        ),
      ).toBe(true);
    });

    it('evaluates gt / lt operators', () => {
      expect(
        evaluateExpression(
          { op: 'gt', args: [{ ctx: 'user.age' }, { value: 18 }] },
          context,
        ),
      ).toBe(true);

      expect(
        evaluateExpression(
          { op: 'lte', args: [{ ctx: 'user.age' }, { value: 30 }] },
          context,
        ),
      ).toBe(true);
    });

    it('evaluates and / or / not operators', () => {
      expect(
        evaluateExpression(
          {
            op: 'and',
            args: [
              { op: 'eq', args: [{ ctx: 'user.authenticated' }, { value: true }] },
              { op: 'gt', args: [{ ctx: 'user.age' }, { value: 18 }] },
            ],
          },
          context,
        ),
      ).toBe(true);

      expect(
        evaluateExpression(
          {
            op: 'or',
            args: [
              { op: 'eq', args: [{ ctx: 'user.role' }, { value: 'guest' }] },
              { op: 'eq', args: [{ ctx: 'user.role' }, { value: 'admin' }] },
            ],
          },
          context,
        ),
      ).toBe(true);

      expect(
        evaluateExpression(
          { op: 'not', args: [{ ctx: 'componentState.isOpen' }] },
          context,
        ),
      ).toBe(true);
    });

    it('evaluates in / contains / isEmpty', () => {
      expect(
        evaluateExpression(
          { op: 'in', args: [{ value: 'b' }, { ctx: 'componentState.tabs' }] },
          context,
        ),
      ).toBe(true);

      expect(
        evaluateExpression(
          { op: 'contains', args: [{ ctx: 'componentState.tabs' }, { value: 'c' }] },
          context,
        ),
      ).toBe(true);

      expect(
        evaluateExpression(
          { op: 'isEmpty', args: [{ ctx: 'route.query' }] },
          context,
        ),
      ).toBe(true);
    });
  });
});
