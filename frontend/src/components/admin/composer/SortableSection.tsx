"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
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
} from "@dnd-kit/sortable";
import { SortableBlock } from "./SortableBlock";
import type { ComposerSection, ComposerBlock } from "./types";

interface SortableSectionProps {
    section: ComposerSection;
    isSelected: boolean;
    selectedBlockId: string | null;
    onSelectSection: () => void;
    onSelectBlock: (blockId: string) => void;
    onDeleteSection: () => void;
    onDuplicateSection: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onDeleteBlock: (blockId: string) => void;
    onDuplicateBlock: (blockId: string) => void;
    onMoveBlockUp: (blockId: string) => void;
    onMoveBlockDown: (blockId: string) => void;
    onReorderBlocks: (sectionId: string, activeId: string, overId: string) => void;
    isFirst: boolean;
    isLast: boolean;
}

export function SortableSection({
    section,
    isSelected,
    selectedBlockId,
    onSelectSection,
    onSelectBlock,
    onDeleteSection,
    onDuplicateSection,
    onMoveUp,
    onMoveDown,
    onDeleteBlock,
    onDuplicateBlock,
    onMoveBlockUp,
    onMoveBlockDown,
    onReorderBlocks,
    isFirst,
    isLast,
}: SortableSectionProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        // Let framer-motion handle opacity if we want, or keep it here
        opacity: isDragging ? 0.5 : 1,
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const blockIds = section.blocks.map((b) => b.id);

    function handleBlockDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            onReorderBlocks(section.id, String(active.id), String(over.id));
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: isDragging ? 0.5 : 1, scale: isSelected ? 1.01 : 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            ref={setNodeRef}
            style={style}
            className={`rounded-lg border-2 transition-colors ${isSelected
                    ? "border-blue-500 bg-blue-50/30 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
        >
            {/* Section header */}
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
                {/* Drag handle */}
                <button
                    type="button"
                    className="cursor-grab touch-none rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:cursor-grabbing"
                    aria-label={`Drag to reorder ${section.layout} section`}
                    {...attributes}
                    {...listeners}
                >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M2 4h12v1H2zm0 4h12v1H2zm0 4h12v1H2z" />
                    </svg>
                </button>

                {/* Section info */}
                <button
                    type="button"
                    onClick={onSelectSection}
                    className="flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded px-1"
                >
                    <span className="text-sm font-semibold text-gray-800 capitalize">
                        {section.layout.replace("-", " ")}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                        {section.blocks.length} block{section.blocks.length !== 1 ? "s" : ""}
                    </span>
                </button>

                {/* Section actions */}
                <div className="flex items-center gap-0.5">
                    <button
                        type="button"
                        onClick={onMoveUp}
                        disabled={isFirst}
                        aria-label="Move section up"
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={onMoveDown}
                        disabled={isLast}
                        aria-label="Move section down"
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={onDuplicateSection}
                        aria-label="Duplicate section"
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={onDeleteSection}
                        aria-label="Delete section"
                        className="rounded p-1.5 text-gray-400 hover:bg-red-100 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Blocks area */}
            <div className="p-3 space-y-2">
                {section.blocks.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-400">
                        No blocks. Add blocks from the library panel.
                    </p>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleBlockDragEnd}
                    >
                        <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
                            {section.blocks.map((block, index) => (
                                <SortableBlock
                                    key={block.id}
                                    block={block}
                                    isSelected={selectedBlockId === block.id}
                                    onSelect={() => onSelectBlock(block.id)}
                                    onDelete={() => onDeleteBlock(block.id)}
                                    onDuplicate={() => onDuplicateBlock(block.id)}
                                    onMoveUp={() => onMoveBlockUp(block.id)}
                                    onMoveDown={() => onMoveBlockDown(block.id)}
                                    isFirst={index === 0}
                                    isLast={index === section.blocks.length - 1}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </motion.div>
    );
}
