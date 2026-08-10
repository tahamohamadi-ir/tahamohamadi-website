import { describe, it, expect, beforeEach } from 'vitest';
import { symbolRegistry } from './symbol-registry';
import { SymbolDefinition, GlobalClass } from '../schema';

describe('SymbolRegistry', () => {
  beforeEach(() => {
    symbolRegistry.clearSymbols();
    symbolRegistry.clearGlobalClasses();
  });

  it('registers and retrieves symbols', () => {
    const symbol: SymbolDefinition = {
      id: 'sym_1',
      name: 'Hero CTA',
      rootNodeId: 'node_1',
      nodes: {
        node_1: {
          id: 'node_1',
          type: 'ui.button',
          componentVersion: 1,
          props: { label: 'Click Me' },
          slots: {},
          styleRefs: [],
        },
      },
      version: 1,
    };

    symbolRegistry.registerSymbol(symbol);

    expect(symbolRegistry.hasSymbol('sym_1')).toBe(true);
    expect(symbolRegistry.getSymbol('sym_1')).toEqual(symbol);
    expect(symbolRegistry.getAllSymbols()).toHaveLength(1);

    symbolRegistry.deleteSymbol('sym_1');
    expect(symbolRegistry.hasSymbol('sym_1')).toBe(false);
  });

  it('registers and retrieves global classes', () => {
    const globalClass: GlobalClass = {
      id: 'gc_1',
      name: 'Primary Text',
      style: {
        base: { color: 'blue' },
      },
    };

    symbolRegistry.registerGlobalClass(globalClass);

    expect(symbolRegistry.hasGlobalClass('gc_1')).toBe(true);
    expect(symbolRegistry.getGlobalClass('gc_1')).toEqual(globalClass);
    expect(symbolRegistry.getAllGlobalClasses()).toHaveLength(1);

    symbolRegistry.deleteGlobalClass('gc_1');
    expect(symbolRegistry.hasGlobalClass('gc_1')).toBe(false);
  });
});
