"use client";

import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, type SelectOption } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ComposerBlock, BlockType } from "./types";

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface BlockInspectorProps {
    block: ComposerBlock;
    onChange: (blockId: string, settings: Record<string, unknown>) => void;
    onDelete: (blockId: string) => void;
    onClose: () => void;
}

// ─── Settings Editor Components ────────────────────────────────────────────────

interface FieldProps {
    label: string;
    htmlFor?: string;
    children: React.ReactNode;
}

function Field({ label, htmlFor, children }: FieldProps) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
        </div>
    );
}

// ─── Hero Settings Editor ──────────────────────────────────────────────────────

interface HeroEditorProps {
    settings: Record<string, unknown>;
    onChange: (settings: Record<string, unknown>) => void;
}

function HeroEditor({ settings, onChange }: HeroEditorProps) {
    return (
        <div className="space-y-4">
            <Field label="Title" htmlFor="hero-title">
                <Input
                    id="hero-title"
                    value={(settings.title as string) ?? ""}
                    onChange={(e) => onChange({ ...settings, title: e.target.value })}
                    placeholder="Hero title"
                />
            </Field>
            <Field label="Subtitle" htmlFor="hero-subtitle">
                <Input
                    id="hero-subtitle"
                    value={(settings.subtitle as string) ?? ""}
                    onChange={(e) => onChange({ ...settings, subtitle: e.target.value })}
                    placeholder="Hero subtitle"
                />
            </Field>
            <Field label="Media ID" htmlFor="hero-media-id">
                <Input
                    id="hero-media-id"
                    value={(settings.media_id as string) ?? ""}
                    onChange={(e) => onChange({ ...settings, media_id: e.target.value })}
                    placeholder="Select media asset"
                />
            </Field>
            <Field label="CTA URL" htmlFor="hero-cta-url">
                <Input
                    id="hero-cta-url"
                    type="url"
                    value={(settings.cta_url as string) ?? ""}
                    onChange={(e) => onChange({ ...settings, cta_url: e.target.value })}
                    placeholder="https://..."
                />
            </Field>
        </div>
    );
}

// ─── Text Settings Editor ──────────────────────────────────────────────────────

interface TextEditorProps {
    settings: Record<string, unknown>;
    onChange: (settings: Record<string, unknown>) => void;
}

const ALIGNMENT_OPTIONS: SelectOption[] = [
    { value: "start", label: "Start" },
    { value: "center", label: "Center" },
    { value: "end", label: "End" },
];

function TextEditor({ settings, onChange }: TextEditorProps) {
    return (
        <div className="space-y-4">
            <Field label="Content" htmlFor="text-content">
                <Textarea
                    id="text-content"
                    value={(settings.content as string) ?? ""}
                    onChange={(e) => onChange({ ...settings, content: e.target.value })}
                    placeholder="Enter text content..."
                    rows={5}
                />
            </Field>
            <Field label="Alignment" htmlFor="text-alignment">
                <Select
                    id="text-alignment"
                    value={(settings.alignment as string) ?? "start"}
                    onChange={(e) => onChange({ ...settings, alignment: e.target.value })}
                    options={ALIGNMENT_OPTIONS}
                />
            </Field>
        </div>
    );
}

// ─── Gallery Settings Editor ───────────────────────────────────────────────────

interface GalleryEditorProps {
    settings: Record<string, unknown>;
    onChange: (settings: Record<string, unknown>) => void;
}

const GALLERY_LAYOUT_OPTIONS: SelectOption[] = [
    { value: "grid", label: "Grid" },
    { value: "carousel", label: "Carousel" },
];

function GalleryEditor({ settings, onChange }: GalleryEditorProps) {
    const mediaIds = (settings.media_ids as string[]) ?? [];

    function handleMediaIdsChange(value: string) {
        const ids = value
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);
        onChange({ ...settings, media_ids: ids });
    }

    return (
        <div className="space-y-4">
            <Field label="Media IDs (comma-separated)" htmlFor="gallery-media-ids">
                <Textarea
                    id="gallery-media-ids"
                    value={mediaIds.join(", ")}
                    onChange={(e) => handleMediaIdsChange(e.target.value)}
                    placeholder="media-id-1, media-id-2, ..."
                    rows={3}
                />
            </Field>
            <Field label="Layout" htmlFor="gallery-layout">
                <Select
                    id="gallery-layout"
                    value={(settings.layout as string) ?? "grid"}
                    onChange={(e) => onChange({ ...settings, layout: e.target.value })}
                    options={GALLERY_LAYOUT_OPTIONS}
                />
            </Field>
        </div>
    );
}

// ─── CTA Settings Editor ───────────────────────────────────────────────────────

interface CtaEditorProps {
    settings: Record<string, unknown>;
    onChange: (settings: Record<string, unknown>) => void;
}

const CTA_VARIANT_OPTIONS: SelectOption[] = [
    { value: "primary", label: "Primary" },
    { value: "secondary", label: "Secondary" },
];

function CtaEditor({ settings, onChange }: CtaEditorProps) {
    return (
        <div className="space-y-4">
            <Field label="Label" htmlFor="cta-label">
                <Input
                    id="cta-label"
                    value={(settings.label as string) ?? ""}
                    onChange={(e) => onChange({ ...settings, label: e.target.value })}
                    placeholder="Button text"
                />
            </Field>
            <Field label="URL" htmlFor="cta-url">
                <Input
                    id="cta-url"
                    type="url"
                    value={(settings.url as string) ?? ""}
                    onChange={(e) => onChange({ ...settings, url: e.target.value })}
                    placeholder="https://..."
                />
            </Field>
            <Field label="Variant" htmlFor="cta-variant">
                <Select
                    id="cta-variant"
                    value={(settings.variant as string) ?? "primary"}
                    onChange={(e) => onChange({ ...settings, variant: e.target.value })}
                    options={CTA_VARIANT_OPTIONS}
                />
            </Field>
        </div>
    );
}

// ─── Collection Settings Editor ────────────────────────────────────────────────

interface CollectionEditorProps {
    settings: Record<string, unknown>;
    onChange: (settings: Record<string, unknown>) => void;
}

const COLLECTION_SOURCE_OPTIONS: SelectOption[] = [
    { value: "blog", label: "Blog" },
    { value: "portfolio", label: "Portfolio" },
];

function CollectionEditor({ settings, onChange }: CollectionEditorProps) {
    return (
        <div className="space-y-4">
            <Field label="Source" htmlFor="collection-source">
                <Select
                    id="collection-source"
                    value={(settings.source as string) ?? "blog"}
                    onChange={(e) => onChange({ ...settings, source: e.target.value })}
                    options={COLLECTION_SOURCE_OPTIONS}
                />
            </Field>
            <Field label="Filter (JSON)" htmlFor="collection-filter">
                <Textarea
                    id="collection-filter"
                    value={settings.filter ? JSON.stringify(settings.filter, null, 2) : ""}
                    onChange={(e) => {
                        try {
                            const parsed = e.target.value.trim() ? JSON.parse(e.target.value) : {};
                            onChange({ ...settings, filter: parsed });
                        } catch {
                            // Allow editing without crashing on intermediate invalid JSON
                        }
                    }}
                    placeholder='{"topic": "ai"}'
                    rows={3}
                />
            </Field>
            <Field label="Limit" htmlFor="collection-limit">
                <Input
                    id="collection-limit"
                    type="number"
                    min={1}
                    max={50}
                    value={(settings.limit as number) ?? ""}
                    onChange={(e) =>
                        onChange({
                            ...settings,
                            limit: e.target.value ? parseInt(e.target.value, 10) : undefined,
                        })
                    }
                    placeholder="Number of items"
                />
            </Field>
        </div>
    );
}

// ─── Quote Settings Editor ─────────────────────────────────────────────────────

interface QuoteEditorProps {
    settings: Record<string, unknown>;
    onChange: (settings: Record<string, unknown>) => void;
}

function QuoteEditor({ settings, onChange }: QuoteEditorProps) {
    return (
        <div className="space-y-4">
            <Field label="Quote Text" htmlFor="quote-text">
                <Textarea
                    id="quote-text"
                    value={(settings.text as string) ?? ""}
                    onChange={(e) => onChange({ ...settings, text: e.target.value })}
                    placeholder="Enter the quote..."
                    rows={3}
                />
            </Field>
            <Field label="Author" htmlFor="quote-author">
                <Input
                    id="quote-author"
                    value={(settings.author as string) ?? ""}
                    onChange={(e) => onChange({ ...settings, author: e.target.value })}
                    placeholder="Author name"
                />
            </Field>
            <Field label="Source" htmlFor="quote-source">
                <Input
                    id="quote-source"
                    value={(settings.source as string) ?? ""}
                    onChange={(e) => onChange({ ...settings, source: e.target.value })}
                    placeholder="Source reference"
                />
            </Field>
        </div>
    );
}

// ─── Divider Settings Editor ───────────────────────────────────────────────────

interface DividerEditorProps {
    settings: Record<string, unknown>;
    onChange: (settings: Record<string, unknown>) => void;
}

const DIVIDER_STYLE_OPTIONS: SelectOption[] = [
    { value: "line", label: "Line" },
    { value: "dots", label: "Dots" },
    { value: "space", label: "Space" },
];

function DividerEditor({ settings, onChange }: DividerEditorProps) {
    return (
        <div className="space-y-4">
            <Field label="Style" htmlFor="divider-style">
                <Select
                    id="divider-style"
                    value={(settings.style as string) ?? "line"}
                    onChange={(e) => onChange({ ...settings, style: e.target.value })}
                    options={DIVIDER_STYLE_OPTIONS}
                />
            </Field>
        </div>
    );
}

// ─── Research Focus Settings Editor ────────────────────────────────────────────

interface ResearchFocusEditorProps {
    settings: Record<string, unknown>;
    onChange: (settings: Record<string, unknown>) => void;
}

interface ResearchArea {
    name: string;
    description: string;
}

function ResearchFocusEditor({ settings, onChange }: ResearchFocusEditorProps) {
    const areas = (settings.areas as ResearchArea[]) ?? [];

    function updateArea(index: number, field: keyof ResearchArea, value: string) {
        const updated = [...areas];
        updated[index] = { ...updated[index], [field]: value };
        onChange({ ...settings, areas: updated });
    }

    function addArea() {
        onChange({ ...settings, areas: [...areas, { name: "", description: "" }] });
    }

    function removeArea(index: number) {
        const updated = areas.filter((_, i) => i !== index);
        onChange({ ...settings, areas: updated });
    }

    return (
        <div className="space-y-4">
            <Field label="Title" htmlFor="research-title">
                <Input
                    id="research-title"
                    value={(settings.title as string) ?? ""}
                    onChange={(e) => onChange({ ...settings, title: e.target.value })}
                    placeholder="Research focus title"
                />
            </Field>

            <div className="space-y-2">
                <Label>Research Areas</Label>
                {areas.map((area, index) => (
                    <div key={index} className="rounded-md border border-gray-200 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">Area {index + 1}</span>
                            <button
                                type="button"
                                onClick={() => removeArea(index)}
                                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                aria-label={`Remove area ${index + 1}`}
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <Input
                            value={area.name}
                            onChange={(e) => updateArea(index, "name", e.target.value)}
                            placeholder="Area name"
                            aria-label={`Area ${index + 1} name`}
                        />
                        <Textarea
                            value={area.description}
                            onChange={(e) => updateArea(index, "description", e.target.value)}
                            placeholder="Area description"
                            rows={2}
                            aria-label={`Area ${index + 1} description`}
                        />
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addArea} className="w-full">
                    Add Research Area
                </Button>
            </div>
        </div>
    );
}

// ─── Editor Registry ───────────────────────────────────────────────────────────

const BLOCK_EDITORS: Record<
    BlockType,
    React.ComponentType<{ settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }>
> = {
    hero: HeroEditor,
    text: TextEditor,
    gallery: GalleryEditor,
    cta: CtaEditor,
    collection: CollectionEditor,
    quote: QuoteEditor,
    divider: DividerEditor,
    research_focus: ResearchFocusEditor,
};

// ─── Block Inspector Component ─────────────────────────────────────────────────

export function BlockInspector({ block, onChange, onDelete, onClose }: BlockInspectorProps) {
    const Editor = BLOCK_EDITORS[block.block_type];

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
                {Editor ? (
                    <Editor settings={block.settings} onChange={handleSettingsChange} />
                ) : (
                    <p className="text-sm text-gray-500">No editor available for this block type.</p>
                )}
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
