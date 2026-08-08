"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { AnimatePresence } from "framer-motion";
import { SortableSection } from "./SortableSection";
import { SectionLibraryPanel } from "./SectionLibraryPanel";
import { BlockLibraryPanel } from "./BlockLibraryPanel";
import type {
    ComposerSection,
    ComposerBlock,
    SectionLayout,
    BlockType,
} from "./types";
import { createBlockSettings } from "./block-defaults";

// ─── Utility ─────────────────────────────────────────────────────────────────

let idCounter = 0;
const EMPTY_SECTIONS: ComposerSection[] = [];
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

type PendingDeletion =
    | { kind: "section"; sectionId: string }
    | { kind: "block"; sectionId: string; blockId: string };

// ─── Component ───────────────────────────────────────────────────────────────

export function ComposerCanvas({
    initialSections = EMPTY_SECTIONS,
    onChange,
}: ComposerCanvasProps) {
    const [sections, setSections] = useState<ComposerSection[]>(initialSections);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [announcement, setAnnouncement] = useState("");
    const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(null);

    // Ref for focus preservation after keyboard reorder
    const focusTargetRef = useRef<string | null>(null);

    useEffect(() => {
        setSections(initialSections);
    }, [initialSections]);

    useEffect(() => {
        const target = focusTargetRef.current;
        if (!target) return;
        document.querySelector<HTMLElement>(`[data-composer-focus-target="${target}"]`)?.focus();
        focusTargetRef.current = null;
    }, [sections]);

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
        focusTargetRef.current = `section:${activeId}`;
        setAnnouncement("Section reordered");
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
        focusTargetRef.current = `section:${newSection.id}`;
        setAnnouncement("Section added");
    }

    function deleteSection(sectionId: string) {
        updateSections((prev) => {
            const index = prev.findIndex((section) => section.id === sectionId);
            const focusSection = prev[index + 1] ?? prev[index - 1];
            if (focusSection) focusTargetRef.current = `section:${focusSection.id}`;
            return prev
                .filter((section) => section.id !== sectionId)
                .map((section, i) => ({ ...section, ordering: i }));
        });
        if (selectedSectionId === sectionId) {
            setSelectedSectionId(null);
            setSelectedBlockId(null);
        }
        setAnnouncement("Section deleted");
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
            focusTargetRef.current = `section:${newSection.id}`;
            return next.map((s, i) => ({ ...s, ordering: i }));
        });
        setAnnouncement("Section duplicated");
    }

    function moveSectionUp(sectionId: string) {
        updateSections((prev) => {
            const idx = prev.findIndex((s) => s.id === sectionId);
            if (idx <= 0) return prev;
            const reordered = arrayMove(prev, idx, idx - 1);
            return reordered.map((s, i) => ({ ...s, ordering: i }));
        });
        focusTargetRef.current = `section:${sectionId}`;
        setAnnouncement("Section moved up");
    }

    function moveSectionDown(sectionId: string) {
        updateSections((prev) => {
            const idx = prev.findIndex((s) => s.id === sectionId);
            if (idx === -1 || idx >= prev.length - 1) return prev;
            const reordered = arrayMove(prev, idx, idx + 1);
            return reordered.map((s, i) => ({ ...s, ordering: i }));
        });
        focusTargetRef.current = `section:${sectionId}`;
        setAnnouncement("Section moved down");
    }

    // ─── Block operations ────────────────────────────────────────────────────

    function addBlock(blockType: BlockType) {
        if (!selectedSectionId) return;
        const newBlock: ComposerBlock = {
            id: generateId("block"),
            block_type: blockType,
            settings: createBlockSettings(blockType),
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
        focusTargetRef.current = `block:${newBlock.id}`;
        setAnnouncement("Block added");
    }

    function deleteBlock(sectionId: string, blockId: string) {
        updateSections((prev) =>
            prev.map((section) => {
                if (section.id !== sectionId) return section;
                const index = section.blocks.findIndex((block) => block.id === blockId);
                const focusBlock = section.blocks[index + 1] ?? section.blocks[index - 1];
                focusTargetRef.current = focusBlock
                    ? `block:${focusBlock.id}`
                    : `section:${section.id}`;
                const blocks = section.blocks
                    .filter((b) => b.id !== blockId)
                    .map((b, i) => ({ ...b, ordering: i }));
                return { ...section, blocks };
            })
        );
        if (selectedBlockId === blockId) {
            setSelectedBlockId(null);
        }
        setAnnouncement("Block deleted");
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
                focusTargetRef.current = `block:${newBlock.id}`;
                return { ...section, blocks: blocks.map((b, i) => ({ ...b, ordering: i })) };
            })
        );
        setAnnouncement("Block duplicated");
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
        focusTargetRef.current = `block:${blockId}`;
        setAnnouncement("Block moved up");
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
        focusTargetRef.current = `block:${blockId}`;
        setAnnouncement("Block moved down");
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
        focusTargetRef.current = `block:${activeId}`;
        setAnnouncement("Block reordered");
    }

    // ─── Section drag ────────────────────────────────────────────────────────

    function handleSectionDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            reorderSections(String(active.id), String(over.id));
        }
    }

    function confirmDeletion() {
        if (!pendingDeletion) return;
        if (pendingDeletion.kind === "section") {
            deleteSection(pendingDeletion.sectionId);
        } else {
            deleteBlock(pendingDeletion.sectionId, pendingDeletion.blockId);
        }
        setPendingDeletion(null);
    }

    const sectionIds = sections.map((s) => s.id);

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="flex gap-6 h-full">
            <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                {announcement}
            </div>
            {pendingDeletion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
                    <div className="w-full max-w-sm rounded-lg border bg-white p-4 shadow-lg" role="dialog" aria-modal="true" aria-label={`Delete ${pendingDeletion.kind}`}>
                        <p className="text-sm text-gray-800">This action cannot be undone from the Canvas.</p>
                        <div className="mt-4 flex justify-end gap-2">
                            <button type="button" onClick={() => setPendingDeletion(null)} className="rounded px-3 py-2 text-sm">Cancel</button>
                            <button type="button" onClick={confirmDeletion} className="rounded bg-red-600 px-3 py-2 text-sm text-white" aria-label="Confirm delete">Delete</button>
                        </div>
                    </div>
                </div>
            )}
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
                                <AnimatePresence>
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
                                            onDeleteSection={() => setPendingDeletion({ kind: "section", sectionId: section.id })}
                                            onDuplicateSection={() => duplicateSection(section.id)}
                                            onMoveUp={() => moveSectionUp(section.id)}
                                            onMoveDown={() => moveSectionDown(section.id)}
                                            onDeleteBlock={(blockId) => setPendingDeletion({ kind: "block", sectionId: section.id, blockId })}
                                            onDuplicateBlock={(blockId) => duplicateBlock(section.id, blockId)}
                                            onMoveBlockUp={(blockId) => moveBlockUp(section.id, blockId)}
                                            onMoveBlockDown={(blockId) => moveBlockDown(section.id, blockId)}
                                            onReorderBlocks={reorderBlocks}
                                            isFirst={index === 0}
                                            isLast={index === sections.length - 1}
                                        />
                                    ))}
                                </AnimatePresence>
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
            </div>
        </div>
    );
}
