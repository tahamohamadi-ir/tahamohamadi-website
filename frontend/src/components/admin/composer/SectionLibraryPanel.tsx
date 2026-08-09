"use client";

import { SECTION_LIBRARY } from "./library-data";
import type { SectionLayout } from "./types";

interface SectionLibraryPanelProps {
    onAddSection: (layout: SectionLayout) => void;
}

export function SectionLibraryPanel({ onAddSection }: SectionLibraryPanelProps) {
    return (
        <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 px-1">Sections</h3>
            <div className="grid grid-cols-1 gap-2">
                {SECTION_LIBRARY.map((item) => (
                    <button
                        key={item.layout}
                        type="button"
                        onClick={() => onAddSection(item.layout)}
                        aria-label={`Add ${item.label} section`}
                        data-composer-focus-target={`section-library:${item.layout}`}
                        className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs font-medium text-gray-600">
                            {item.icon.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900">{item.label}</p>
                            <p className="text-xs text-gray-500 truncate">{item.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
