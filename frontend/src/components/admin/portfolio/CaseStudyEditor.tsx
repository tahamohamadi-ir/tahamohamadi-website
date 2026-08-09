"use client";

import { useCallback, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ComposerBlock, BlockType } from "../composer/types";
import { SortableBlock } from "../composer/SortableBlock";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Locale = "fa" | "en";

export interface GalleryItem {
    id: string;
    media_id: string;
    url?: string;
    alt?: string;
    caption?: string;
    ordering: number;
}

export interface CaseStudyData {
    id?: string;
    title_fa: string;
    title_en: string;
    slug_fa: string;
    slug_en: string;
    role_fa: string;
    role_en: string;
    client_fa: string;
    client_en: string;
    technologies: string[];
    statement_fa: string;
    statement_en: string;
    problem_fa: string;
    problem_en: string;
    outcome_fa: string;
    outcome_en: string;
    date_start: string;
    date_end: string;
    narrative_blocks: ComposerBlock[];
    gallery: GalleryItem[];
    featured: boolean;
    status: string;
    version?: number;
}

export interface CaseStudyEditorProps {
    caseStudy: CaseStudyData;
    locale: Locale;
    onSave: (data: CaseStudyData) => void;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

let idCounter = 0;
function generateId(prefix: string): string {
    idCounter += 1;
    return `${prefix}-${Date.now()}-${idCounter}`;
}

const NARRATIVE_BLOCK_TYPES: { type: BlockType; label: string }[] = [
    { type: "text", label: "Text" },
    { type: "gallery", label: "Gallery" },
    { type: "quote", label: "Quote" },
    { type: "divider", label: "Divider" },
    { type: "hero", label: "Hero" },
    { type: "cta", label: "CTA" },
];

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        draft: "bg-gray-100 text-gray-700",
        in_review: "bg-yellow-100 text-yellow-800",
        published: "bg-green-100 text-green-800",
        scheduled: "bg-blue-100 text-blue-800",
        archived: "bg-red-100 text-red-700",
    };
    const colorClass = colors[status] ?? "bg-gray-100 text-gray-700";

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colorClass}`}
        >
            {status.replace("_", " ")}
        </span>
    );
}

// ─── Tag Input ───────────────────────────────────────────────────────────────

interface TagInputProps {
    tags: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    id?: string;
}

function TagInput({ tags, onChange, placeholder, id }: TagInputProps) {
    const [inputValue, setInputValue] = useState("");

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            const value = inputValue.trim();
            if (value && !tags.includes(value)) {
                onChange([...tags, value]);
            }
            setInputValue("");
        } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
            onChange(tags.slice(0, -1));
        }
    }

    function removeTag(index: number) {
        onChange(tags.filter((_, i) => i !== index));
    }

    return (
        <div className="flex flex-wrap gap-1.5 rounded-md border border-gray-300 px-2 py-1.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            {tags.map((tag, i) => (
                <span
                    key={`${tag}-${i}`}
                    className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                >
                    {tag}
                    <button
                        type="button"
                        onClick={() => removeTag(i)}
                        className="rounded-full p-0.5 hover:bg-blue-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                        aria-label={`Remove ${tag}`}
                    >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </span>
            ))}
            <input
                id={id}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tags.length === 0 ? placeholder : ""}
                className="min-w-[120px] flex-1 border-none bg-transparent p-0 text-sm outline-none placeholder:text-gray-400"
            />
        </div>
    );
}

// ─── Gallery Item Component ──────────────────────────────────────────────────

interface GalleryItemCardProps {
    item: GalleryItem;
    onRemove: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    isFirst: boolean;
    isLast: boolean;
}

function GalleryItemCard({ item, onRemove, onMoveUp, onMoveDown, isFirst, isLast }: GalleryItemCardProps) {
    return (
        <div className="group flex items-center gap-3 rounded-md border border-gray-200 bg-white p-3">
            <div className="h-12 w-12 shrink-0 rounded bg-gray-100 flex items-center justify-center">
                {item.url ? (
                    <img src={item.url} alt={item.alt ?? ""} className="h-full w-full rounded object-cover" />
                ) : (
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{item.media_id}</p>
                {item.caption && <p className="text-xs text-gray-500 truncate">{item.caption}</p>}
            </div>
            <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <button
                    type="button" onClick={onMoveUp} disabled={isFirst}
                    aria-label="Move item up"
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                </button>
                <button
                    type="button" onClick={onMoveDown} disabled={isLast}
                    aria-label="Move item down"
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                <button
                    type="button" onClick={onRemove}
                    aria-label="Remove from gallery"
                    className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CaseStudyEditor({ caseStudy, locale, onSave }: CaseStudyEditorProps) {
    const [data, setData] = useState<CaseStudyData>(caseStudy);
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // ─── Field helpers ─────────────────────────────────────────────────────────

    const updateField = useCallback(
        <K extends keyof CaseStudyData>(field: K, value: CaseStudyData[K]) => {
            setData((prev) => ({ ...prev, [field]: value }));
        },
        []
    );

    // ─── Narrative block operations ────────────────────────────────────────────

    function addNarrativeBlock(blockType: BlockType) {
        const newBlock: ComposerBlock = {
            id: generateId("block"),
            block_type: blockType,
            settings: {},
            ordering: data.narrative_blocks.length,
        };
        updateField("narrative_blocks", [...data.narrative_blocks, newBlock]);
        setSelectedBlockId(newBlock.id);
    }

    function removeNarrativeBlock(blockId: string) {
        updateField(
            "narrative_blocks",
            data.narrative_blocks
                .filter((b) => b.id !== blockId)
                .map((b, i) => ({ ...b, ordering: i }))
        );
        if (selectedBlockId === blockId) setSelectedBlockId(null);
    }

    function duplicateNarrativeBlock(blockId: string) {
        const idx = data.narrative_blocks.findIndex((b) => b.id === blockId);
        if (idx === -1) return;
        const source = data.narrative_blocks[idx];
        const newBlock: ComposerBlock = { ...source, id: generateId("block") };
        const blocks = [...data.narrative_blocks];
        blocks.splice(idx + 1, 0, newBlock);
        updateField(
            "narrative_blocks",
            blocks.map((b, i) => ({ ...b, ordering: i }))
        );
    }

    function moveNarrativeBlockUp(blockId: string) {
        const idx = data.narrative_blocks.findIndex((b) => b.id === blockId);
        if (idx <= 0) return;
        const reordered = arrayMove(data.narrative_blocks, idx, idx - 1);
        updateField("narrative_blocks", reordered.map((b, i) => ({ ...b, ordering: i })));
    }

    function moveNarrativeBlockDown(blockId: string) {
        const idx = data.narrative_blocks.findIndex((b) => b.id === blockId);
        if (idx === -1 || idx >= data.narrative_blocks.length - 1) return;
        const reordered = arrayMove(data.narrative_blocks, idx, idx + 1);
        updateField("narrative_blocks", reordered.map((b, i) => ({ ...b, ordering: i })));
    }

    function handleBlockDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = data.narrative_blocks.findIndex((b) => b.id === active.id);
        const newIndex = data.narrative_blocks.findIndex((b) => b.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        const reordered = arrayMove(data.narrative_blocks, oldIndex, newIndex);
        updateField("narrative_blocks", reordered.map((b, i) => ({ ...b, ordering: i })));
    }

    // ─── Gallery operations ──────────────────────────────────────────────────────

    function addGalleryItem() {
        const newItem: GalleryItem = {
            id: generateId("gallery"),
            media_id: "",
            ordering: data.gallery.length,
        };
        updateField("gallery", [...data.gallery, newItem]);
    }

    function removeGalleryItem(itemId: string) {
        updateField(
            "gallery",
            data.gallery
                .filter((g) => g.id !== itemId)
                .map((g, i) => ({ ...g, ordering: i }))
        );
    }

    function moveGalleryItemUp(itemId: string) {
        const idx = data.gallery.findIndex((g) => g.id === itemId);
        if (idx <= 0) return;
        const reordered = arrayMove(data.gallery, idx, idx - 1);
        updateField("gallery", reordered.map((g, i) => ({ ...g, ordering: i })));
    }

    function moveGalleryItemDown(itemId: string) {
        const idx = data.gallery.findIndex((g) => g.id === itemId);
        if (idx === -1 || idx >= data.gallery.length - 1) return;
        const reordered = arrayMove(data.gallery, idx, idx + 1);
        updateField("gallery", reordered.map((g, i) => ({ ...g, ordering: i })));
    }

    function updateGalleryItemMediaId(itemId: string, mediaId: string) {
        updateField(
            "gallery",
            data.gallery.map((g) => (g.id === itemId ? { ...g, media_id: mediaId } : g))
        );
    }

    // ─── Save ──────────────────────────────────────────────────────────────────

    function handleSave() {
        onSave(data);
    }

    // ─── Locale helper ─────────────────────────────────────────────────────────

    const isRtl = locale === "fa";
    const blockIds = data.narrative_blocks.map((b) => b.id);

    // ─── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="mx-auto max-w-4xl space-y-8 pb-12" dir={isRtl ? "rtl" : "ltr"}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {data.id ? "Edit Case Study" : "New Case Study"}
                    </h1>
                    <div className="flex items-center gap-3">
                        <StatusBadge status={data.status} />
                        {data.featured && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                Featured
                            </span>
                        )}
                    </div>
                </div>
                <Button type="button" onClick={handleSave}>
                    Save Case Study
                </Button>
            </div>

            {/* ─── Metadata Section ──────────────────────────────────────────────────── */}
            <section className="rounded-lg border border-gray-200 bg-white p-6 space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Metadata</h2>

                {/* Titles */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="title_fa">Title (FA)</Label>
                        <Input
                            id="title_fa"
                            dir="rtl"
                            value={data.title_fa}
                            onChange={(e) => updateField("title_fa", e.target.value)}
                            placeholder="عنوان فارسی"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="title_en">Title (EN)</Label>
                        <Input
                            id="title_en"
                            dir="ltr"
                            value={data.title_en}
                            onChange={(e) => updateField("title_en", e.target.value)}
                            placeholder="English title"
                        />
                    </div>
                </div>

                {/* Slugs */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="slug_fa">Slug (FA)</Label>
                        <Input
                            id="slug_fa"
                            dir="ltr"
                            value={data.slug_fa}
                            onChange={(e) => updateField("slug_fa", e.target.value)}
                            placeholder="slug-farsi"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="slug_en">Slug (EN)</Label>
                        <Input
                            id="slug_en"
                            dir="ltr"
                            value={data.slug_en}
                            onChange={(e) => updateField("slug_en", e.target.value)}
                            placeholder="slug-english"
                        />
                    </div>
                </div>

                {/* Role */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="role_fa">Role (FA)</Label>
                        <Input
                            id="role_fa"
                            dir="rtl"
                            value={data.role_fa}
                            onChange={(e) => updateField("role_fa", e.target.value)}
                            placeholder="نقش"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="role_en">Role (EN)</Label>
                        <Input
                            id="role_en"
                            dir="ltr"
                            value={data.role_en}
                            onChange={(e) => updateField("role_en", e.target.value)}
                            placeholder="Lead Developer"
                        />
                    </div>
                </div>

                {/* Client */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="client_fa">Client (FA)</Label>
                        <Input
                            id="client_fa"
                            dir="rtl"
                            value={data.client_fa}
                            onChange={(e) => updateField("client_fa", e.target.value)}
                            placeholder="نام مشتری"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="client_en">Client (EN)</Label>
                        <Input
                            id="client_en"
                            dir="ltr"
                            value={data.client_en}
                            onChange={(e) => updateField("client_en", e.target.value)}
                            placeholder="Client name"
                        />
                    </div>
                </div>

                {/* Technologies */}
                <div className="space-y-1.5">
                    <Label htmlFor="technologies">Technologies</Label>
                    <TagInput
                        id="technologies"
                        tags={data.technologies}
                        onChange={(tags) => updateField("technologies", tags)}
                        placeholder="Type a technology and press Enter..."
                    />
                </div>

                {/* Statement */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="statement_fa">Statement (FA)</Label>
                        <Textarea
                            id="statement_fa"
                            dir="rtl"
                            value={data.statement_fa}
                            onChange={(e) => updateField("statement_fa", e.target.value)}
                            placeholder="بیانیه یا معرفی پروژه"
                            rows={3}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="statement_en">Statement (EN)</Label>
                        <Textarea
                            id="statement_en"
                            dir="ltr"
                            value={data.statement_en}
                            onChange={(e) => updateField("statement_en", e.target.value)}
                            placeholder="Project statement"
                            rows={3}
                        />
                    </div>
                </div>

                {/* Problem */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="problem_fa">Problem (FA)</Label>
                        <Textarea
                            id="problem_fa"
                            dir="rtl"
                            value={data.problem_fa}
                            onChange={(e) => updateField("problem_fa", e.target.value)}
                            placeholder="مسئله یا چالش"
                            rows={3}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="problem_en">Problem (EN)</Label>
                        <Textarea
                            id="problem_en"
                            dir="ltr"
                            value={data.problem_en}
                            onChange={(e) => updateField("problem_en", e.target.value)}
                            placeholder="Problem or challenge"
                            rows={3}
                        />
                    </div>
                </div>

                {/* Outcome */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="outcome_fa">Outcome (FA)</Label>
                        <Textarea
                            id="outcome_fa"
                            dir="rtl"
                            value={data.outcome_fa}
                            onChange={(e) => updateField("outcome_fa", e.target.value)}
                            placeholder="نتیجه پروژه"
                            rows={3}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="outcome_en">Outcome (EN)</Label>
                        <Textarea
                            id="outcome_en"
                            dir="ltr"
                            value={data.outcome_en}
                            onChange={(e) => updateField("outcome_en", e.target.value)}
                            placeholder="Project outcome"
                            rows={3}
                        />
                    </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="date_start">Start Date</Label>
                        <Input
                            id="date_start"
                            type="date"
                            value={data.date_start}
                            onChange={(e) => updateField("date_start", e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="date_end">End Date</Label>
                        <Input
                            id="date_end"
                            type="date"
                            value={data.date_end}
                            onChange={(e) => updateField("date_end", e.target.value)}
                        />
                        <p className="text-xs text-gray-500">Leave empty for ongoing projects</p>
                    </div>
                </div>

                {/* Featured Toggle and Status */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3 h-full pt-6">
                        <button
                            type="button"
                            role="switch"
                            aria-checked={data.featured}
                            aria-label="Featured case study"
                            onClick={() => updateField("featured", !data.featured)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${data.featured ? "bg-blue-600" : "bg-gray-200"
                                }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${data.featured ? "translate-x-5" : "translate-x-0"
                                    }`}
                            />
                        </button>
                        <Label className="cursor-pointer" onClick={() => updateField("featured", !data.featured)}>
                            Featured case study
                        </Label>
                    </div>
                    
                    <div className="space-y-1.5">
                        <Label htmlFor="status">Status</Label>
                        <select
                            id="status"
                            value={data.status ?? "draft"}
                            onChange={(event) => updateField("status", event.target.value)}
                            className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="draft">Draft</option>
                            <option value="in_review">In review</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="published">Published</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* ─── Narrative Blocks Section ──────────────────────────────────────────── */}
            <section className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Narrative</h2>
                    <span className="text-xs text-gray-500">{data.narrative_blocks.length} blocks</span>
                </div>

                {/* Block list with drag-and-drop */}
                {data.narrative_blocks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-12 text-center">
                        <p className="text-sm text-gray-500">
                            No narrative blocks yet. Add blocks to tell the story of this project.
                        </p>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleBlockDragEnd}
                    >
                        <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
                            <div className="space-y-2">
                                {data.narrative_blocks.map((block, index) => (
                                    <SortableBlock
                                        key={block.id}
                                        block={block}
                                        isSelected={selectedBlockId === block.id}
                                        onSelect={() => setSelectedBlockId(block.id)}
                                        onDelete={() => removeNarrativeBlock(block.id)}
                                        onDuplicate={() => duplicateNarrativeBlock(block.id)}
                                        onMoveUp={() => moveNarrativeBlockUp(block.id)}
                                        onMoveDown={() => moveNarrativeBlockDown(block.id)}
                                        isFirst={index === 0}
                                        isLast={index === data.narrative_blocks.length - 1}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}

                {/* Add block buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                    {NARRATIVE_BLOCK_TYPES.map(({ type, label }) => (
                        <Button
                            key={type}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addNarrativeBlock(type)}
                        >
                            + {label}
                        </Button>
                    ))}
                </div>
            </section>

            {/* ─── Gallery Section ───────────────────────────────────────────────────── */}
            <section className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Gallery</h2>
                    <span className="text-xs text-gray-500">{data.gallery.length} items</span>
                </div>

                {data.gallery.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-12 text-center">
                        <p className="text-sm text-gray-500">
                            No gallery items. Add media assets to showcase project visuals.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {data.gallery.map((item, index) => (
                            <div key={item.id} className="space-y-2">
                                <GalleryItemCard
                                    item={item}
                                    onRemove={() => removeGalleryItem(item.id)}
                                    onMoveUp={() => moveGalleryItemUp(item.id)}
                                    onMoveDown={() => moveGalleryItemDown(item.id)}
                                    isFirst={index === 0}
                                    isLast={index === data.gallery.length - 1}
                                />
                                {/* Inline media_id editor */}
                                {!item.media_id && (
                                    <div className="ml-[60px]">
                                        <Input
                                            placeholder="Enter media asset ID..."
                                            value={item.media_id}
                                            onChange={(e) => updateGalleryItemMediaId(item.id, e.target.value)}
                                            className="text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <Button type="button" variant="outline" size="sm" onClick={addGalleryItem}>
                    + Add Gallery Item
                </Button>
            </section>
        </div>
    );
}
