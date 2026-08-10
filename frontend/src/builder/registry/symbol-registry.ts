import { SymbolDefinition, GlobalClass } from '../schema';

class SymbolRegistry {
  private symbols = new Map<string, SymbolDefinition>();
  private globalClasses = new Map<string, GlobalClass>();

  // --- Symbols ---

  registerSymbol(symbol: SymbolDefinition): void {
    this.symbols.set(symbol.id, symbol);
  }

  getSymbol(id: string): SymbolDefinition | undefined {
    return this.symbols.get(id);
  }

  hasSymbol(id: string): boolean {
    return this.symbols.has(id);
  }

  getAllSymbols(): SymbolDefinition[] {
    return Array.from(this.symbols.values());
  }

  deleteSymbol(id: string): void {
    this.symbols.delete(id);
  }

  clearSymbols(): void {
    this.symbols.clear();
  }

  // --- Global Classes ---

  registerGlobalClass(globalClass: GlobalClass): void {
    this.globalClasses.set(globalClass.id, globalClass);
  }

  getGlobalClass(id: string): GlobalClass | undefined {
    return this.globalClasses.get(id);
  }

  hasGlobalClass(id: string): boolean {
    return this.globalClasses.has(id);
  }

  getAllGlobalClasses(): GlobalClass[] {
    return Array.from(this.globalClasses.values());
  }

  deleteGlobalClass(id: string): void {
    this.globalClasses.delete(id);
  }

  clearGlobalClasses(): void {
    this.globalClasses.clear();
  }
}

export const symbolRegistry = new SymbolRegistry();
