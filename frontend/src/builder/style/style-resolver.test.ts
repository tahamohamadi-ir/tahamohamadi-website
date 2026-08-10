import { describe, it, expect } from 'vitest';
import { resolveNodeStyle, resolveStyleValue } from './style-resolver';
import { compileDocumentCSS } from './css-compiler';
import { createEmptyDocument } from '../state';

describe('Style Engine', () => {
  it('resolves token references correctly', () => {
    const value = { $token: 'color.primary.500' };
    const resolved = resolveStyleValue(value, { 'color.primary.500': '#4F46E5' });
    expect(resolved).toBe('#4F46E5');

    const fallback = resolveStyleValue(value);
    expect(fallback).toBe('var(--color-primary-500)');
  });

  it('resolves base and breakpoint style overrides', () => {
    const styleBlock = {
      base: { backgroundColor: '#ffffff', gap: '1rem', layoutMode: 'flex' as const },
      breakpoints: {
        mobile: { gap: '0.5rem' },
      },
    };

    const desktopCss = resolveNodeStyle(styleBlock, { activeBreakpoint: 'desktop' });
    expect(desktopCss.backgroundColor).toBe('#ffffff');
    expect(desktopCss.gap).toBe('1rem');
    expect(desktopCss.display).toBe('flex');

    const mobileCss = resolveNodeStyle(styleBlock, { activeBreakpoint: 'mobile' });
    expect(mobileCss.gap).toBe('0.5rem');
  });

  it('compiles document CSS stylesheet', () => {
    const doc = createEmptyDocument('test_doc');
    const css = compileDocumentCSS(doc);
    expect(css).toContain(':root');
    expect(css).toContain('builder-node-node_root');
  });
});
