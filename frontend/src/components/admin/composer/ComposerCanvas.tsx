"use client";

import { useCallback, useRef, useState } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import { SortableSection } from "./SortableSection";
import { SectionLibraryPanel } from "./SectionLibraryPanel";
import { BlockLibraryPanel } from "./BlockLibraryPanel";
import type {
    ComposerSection,
    ComposerBlock,
    SectionLayout,
    BlockType,
} from "./types";

// ─── Utility ─────────────────────────────────────────────────────────────────

let idCounter = 0;
function generateId(prefix: string): string {
    idCounter += 1;
    return `${prefix}-${Date.now()}-${idCounter}`;
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface ComposerCanvasProps {
    /** Initial sections (e.g. loaded from API) */
    initialSections?: ComposerSection[];
    /** Called when composition changes */
    onChange?: (sections: ComposerSection[]) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ComposerCanvas({
    initialSections = [],
    onChange,
}: ComposerCanvasProps) {
    const [sections, setSections] = useState<ComposerSection[]>(initialSections);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

    // Ref for focus preservation after keyboard reorder
    const focusTargetRef = useRef<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // ─── Helpers ─────────────────────────────────────────────────────────────

    const updateSections = useCallback(
        (updater: (prev: ComposerSection[]) => ComposerSection[]) => {
            setSections((prev) => {
                const next = updater(prev);
                onChange?.(next);
                return next;
            });
        },
        [onChange]
    );

    function reorderSections(activeId: string, overId: string) {
        updateSections((prev) => {
            const oldIndex = prev.findIndex((s) => s.id === activeId);
            const newIndex = prev.findIndex((s) => s.id === overId);
            if (oldIndex === -1 || newIndex === -1) return prev;
            const reordered = arrayMove(prev, oldIndex, newIndex);
            return reordered.map((s, i) => ({ ...s, ordering: i }));
        });
    }

    // ─── Section operations ──────────────────────────────────────────────────

    function addSection(layout: SectionLayout) {
        const newSection: ComposerSection = {
            id: generateId("section"),
            layout,
            enabled: true,
            ordering: sections.length,
            blocks: [],
        };
        updateSections((prev) => [...prev, newSection]);
        setSelectedSectionId(newSection.id);
        setSelectedBlockId(null);
    }

    function deleteSection(sectionId: string) {
        updateSections((prev) =>
            prev
                .filter((s) => s.id !== sectionId)
                .map((s, i) => ({ ...s, ordering: i }))
        );
        if (selectedSectionId === sectionId) {
            setSelectedSectionId(null);
            setSelectedBlockId(null);
        }
    }

    function duplicateSection(sectionId: string) {
        updateSections((prev) => {
            const idx = prev.findIndex((s) => s.id === sectionId);
            if (idx === -1) return prev;
            const source = prev[idx];
            const newSection: ComposerSection = {
                ...source,
                id: generateId("section"),
                ordering: idx + 1,
                blocks: source.blocks.map((b) => ({
                    ...b,
                    id: generateId("block"),
                })),
            };
            const next = [...prev];
            next.splice(idx + 1, 0, newSection);
            return next.map((s, i) => ({ ...s, ordering: i }));
        });
    }

    function moveSectionUp(sectionId: string) {
        updateSections((prev) => {
            const idx = prev.findIndex((s) => s.id === sectionId);
            if (idx <= 0) return prev;
            const reordered = arrayMove(prev, idx, idx - 1);
            return reordered.map((s, i) => ({ ...s, ordering: i }));
        });
        focusTargetRef.current = sectionId;
    }

    function moveSectionDown(sectionId: string) {
        updateSections((prev) => {
            const idx = prev.findIndex((s) => s.id === sectionId);
            if (idx === -1 || idx >= prev.length - 1) return prev;
            const reordered = arrayMove(prev, idx, idx + 1);
            return reordered.map((s, i) => ({ ...s, ordering: i }));
        });
        focusTargetRef.current = sectionId;
    }

    // ─── Block operations ────────────────────────────────────────────────────

    function addBlock(blockType: BlockType) {
        if (!selectedSectionId) return;
        const newBlock: ComposerBlock = {
            id: generateId("block"),
            block_type: blockType,
            settings: {},
            ordering: 0,
        };
        updateSections((prev) =>
            prev.map((section) => {
                if (section.id !== selectedSectionId) return section;
                const blocks = [...section.blocks, newBlock].map((b, i) => ({
                    ...b,
                    ordering: i,
                }));
                return { ...section, blocks };
            })
        );
        setSelectedBlockId(newBlock.id);
    }

    function deleteBlock(sectionId: string, blockId: string) {
        updateSections((prev) =>
            prev.map((section) => {
                if (section.id !== sectionId) return section;
                const blocks = section.blocks
                    .filter((b) => b.id !== blockId)
                    .map((b, i) => ({ ...b, ordering: i }));
                return { ...section, blocks };
            })
        );
        if (selectedBlockId === blockId) {
            setSelectedBlockId(null);
        }
    }

    function duplicateBlock(sectionId: string, blockId: string) {
        updateSections((prev) =>
            prev.map((section) => {
                if (section.id !== sectionId) return section;
                const idx = section.blocks.findIndex((b) => b.id === blockId);
                if (idx === -1) return section;
                const source = section.blocks[idx];
                const newBlock: ComposerBlock = {
                    ...source,
                    id: generateId("block"),
                };
                const blocks = [...section.blocks];
                blocks.splice(idx + 1, 0, newBlock);
                return { ...section, blocks: blocks.map((b, i) => ({ ...b, ordering: i })) };
            })
        );
    }

    function moveBlockUp(sectionId: string, blockId: string) {
        updateSections((prev) =>
            prev.map((section) => {
                if (section.id !== sectionId) return section;
                const idx = section.blocks.findIndex((b) => b.id === blockId);
                if (idx <= 0) return section;
                const blocks = arrayMove(section.blocks, idx, idx - 1).map((b, i) => ({
                    ...b,
                    ordering: i,
                }));
                return { ...section, blocks };
            })
        );
        focusTargetRef.current = blockId;
    }

    function moveBlockDown(sectionId: string, blockId: string) {
        updateSections((prev) =>
            prev.map((section) => {
                if (section.id !== sectionId) return section;
                const idx = section.blocks.findIndex((b) => b.id === blockId);
                if (idx === -1 || idx >= section.blocks.length - 1) return section;
                const blocks = arrayMove(section.blocks, idx, idx + 1).map((b, i) => ({
                    ...b,
                    ordering: i,
                }));
                return { ...section, blocks };
            })
        );
        focusTargetRef.current = blockId;
    }

    function reorderBlocks(sectionId: string, activeId: string, overId: string) {
        updateSections((prev) =>
            prev.map((section) => {
                if (section.id !== sectionId) return section;
                const oldIndex = section.blocks.findIndex((b) => b.id === activeId);
                const newIndex = section.blocks.findIndex((b) => b.id === overId);
                if (oldIndex === -1 || newIndex === -1) return section;
                const blocks = arrayMove(section.blocks, oldIndex, newIndex).map(
                    (b, i) => ({ ...b, ordering: i })
                );
                return { ...section, blocks };
            })
        );
    }

    // ─── Section drag ────────────────────────────────────────────────────────

    function handleSectionDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            reorderSections(String(active.id), String(over.id));
        }
    }

    const sectionIds = sections.map((s) => s.id);

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="flex gap-6 h-full">
            {/* Left: Library panels */}
            <aside className="w-64 shrink-0 space-y-6 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4">
                <SectionLibraryPanel onAddSection={addSection} />
                <div className="border-t border-gray-200" />
                <BlockLibraryPanel
                    onAddBlock={addBlock}
                    disabled={!selectedSectionId}
                />
            </aside>

            {/* Center: Canvas */}
            <div className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                    {sections.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-16 text-center">
                            <p className="text-sm text-gray-500">
                                No sections yet. Add a section from the library to get started.
                            </p>
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleSectionDragEnd}
                        >
                            <SortableContext
                                items={sectionIds}
                                strategy={verticalListSortingStrategy}
                            >
                                {sections.map((section, index) => (
                                    <SortableSection
                                        key={section.id}
                                        section={section}
                                        isSelected={selectedSectionId === section.id}
                                        selectedBlockId={
                                            selectedSectionId === section.id ? selectedBlockId : null
                                        }
                                        onSelectSection={() => {
                                            setSelectedSectionId(section.id);
                                            setSelectedBlockId(null);
                                        }}
                                        onSelectBlock={(blockId) => {
                                            setSelectedSectionId(section.id);
                                            setSelectedBlockId(blockId);
                                        }}
                                        onDeleteSection={() => deleteSection(section.id)}
                                        onDuplicateSection={() => duplicateSection(section.id)}
                                        onMoveUp={() => moveSectionUp(section.id)}
                                        onMoveDown={() => moveSectionDown(section.id)}
                                        onDeleteBlock={(blockId) => deleteBlock(section.id, blockId)}
                                        onDuplicateBlock={(blockId) => duplicateBlock(section.id, blockId)}
                                        onMoveBlockUp={(blockId) => moveBlockUp(section.id, blockId)}
                                        onMoveBlockDown={(blockId) => moveBlockDown(section.id, blockId)}
                                        onReorderBlocks={reorderBlocks}
                                        isFirst={index === 0}
                                        isLast={index === sections.length - 1}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
            </div>
        </div>
    );
}
