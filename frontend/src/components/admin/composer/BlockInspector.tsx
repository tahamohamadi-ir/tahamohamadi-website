"use client";

import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ComposerBlock } from "./types";
import { BLOCK_EDITORS, FieldErrorsContext } from "./editors";

export interface BlockInspectorProps {
    block: ComposerBlock;
    onChange: (blockId: string, settings: Record<string, unknown>) => void;
    onDelete: (blockId: string) => void;
    onClose: () => void;
    fieldErrors?: Record<string, string[]>;
}

export function BlockInspector({ block, onChange, onDelete, onClose, fieldErrors = {} }: BlockInspectorProps) {
    const Editor = BLOCK_EDITORS[block.block_type];
    const validationEntries = Object.entries(fieldErrors);

    function handleSettingsChange(newSettings: Record<string, unknown>) {
        onChange(block.id, newSettings);
    }

    return (
        <aside
            className="flex h-full w-80 flex-col border-l border-gray-200 bg-white"
            aria-label="Block Inspector"
            role="complementary"
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <h2 className="text-sm font-semibold text-gray-900 capitalize">
                    {block.block_type.replace("_", " ")} Settings
                </h2>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label="Close inspector"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Settings Editor */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                {validationEntries.length > 0 && (
                    <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900" role="alert" aria-label="Validation Summary">
                        <h3 className="font-semibold">Validation Summary</h3>
                        <p>Review {validationEntries.length} {validationEntries.length === 1 ? "field" : "fields"} in this block.</p>
                        <ul className="mt-2 list-disc pl-5">
                            {validationEntries.map(([field, errors]) => (
                                <li key={field}>{field === "_block" ? "Block" : field.replaceAll("_", " ")}: {errors.join(" ")}</li>
                            ))}
                        </ul>
                    </div>
                )}
                <FieldErrorsContext.Provider value={fieldErrors}>
                    {Editor ? (
                        <Editor settings={block.settings} onChange={handleSettingsChange} />
                    ) : (
                        <p className="text-sm text-gray-500">No editor available for this block type.</p>
                    )}
                </FieldErrorsContext.Provider>
            </div>

            {/* Footer with delete */}
            <div className="border-t border-gray-200 px-4 py-3">
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => onDelete(block.id)}
                >
                    <Trash2 className="h-4 w-4" />
                    Delete Block
                </Button>
            </div>
        </aside>
    );
}
