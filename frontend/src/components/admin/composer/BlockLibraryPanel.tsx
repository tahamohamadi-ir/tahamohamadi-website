"use client";

import { BLOCK_LIBRARY } from "./library-data";
import type { BlockType } from "./types";

interface BlockLibraryPanelProps {
    onAddBlock: (blockType: BlockType) => void;
    disabled?: boolean;
}

export function BlockLibraryPanel({ onAddBlock, disabled }: BlockLibraryPanelProps) {
    return (
        <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 px-1">Blocks</h3>
            {disabled && (
                <p className="text-xs text-gray-400 px-1">Select a section first</p>
            )}
            <div className="grid grid-cols-2 gap-2">
                {BLOCK_LIBRARY.map((item) => (
                    <button
                        key={item.block_type}
                        type="button"
                        disabled={disabled}
                        onClick={() => onAddBlock(item.block_type)}
                        className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 bg-white p-3 text-center transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-xs font-medium text-gray-600">
                            {item.icon.charAt(0).toUpperCase()}
                        </span>
                        <p className="text-xs font-medium text-gray-900">{item.label}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}
