"use client";

import { Trash2, X, Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, type SelectOption } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    cloneElement,
    createContext,
    isValidElement,
    useContext,
    useState,
    type ReactElement,
} from "react";
import { MediaPicker } from "@/components/admin/media/MediaPicker";
import type { ComposerBlock, BlockType } from "./types";

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface BlockInspectorProps {
    block: ComposerBlock;
    onChange: (blockId: string, settings: Record<string, unknown>) => void;
    onDelete: (blockId: string) => void;
    onClose: () => void;
    fieldErrors?: Record<string, string[]>;
}

// ─── Settings Editor Components ────────────────────────────────────────────────

interface FieldProps {
    label: string;
    htmlFor?: string;
    children: React.ReactNode;
}

const FIELD_NAMES_BY_CONTROL: Record<string, string[]> = {
    "hero-title-fa": ["heading_fa"], "hero-title-en": ["heading_en"],
    "hero-subtitle-fa": ["subheading_fa"], "hero-subtitle-en": ["subheading_en"],
    "hero-cta-fa": ["cta_text_fa"], "hero-cta-en": ["cta_text_en"],
    "hero-cta-url": ["cta_url", "cta_link"], "hero-media-id": ["media_id"],
    "hero-title": ["title"], "hero-subtitle": ["subtitle"], "hero-cta-label": ["cta_label"],
    "text-content": ["content"], "text-content-fa": ["body_fa"], "text-content-en": ["body_en"],
    "text-alignment": ["alignment"], "gallery-media-ids": ["media_ids"], "gallery-layout": ["layout"],
    "cta-label": ["label"], "cta-url": ["url"], "cta-variant": ["variant"],
    "collection-source": ["source"], "collection-filter": ["filter"],
    "collection-limit": ["limit"], "collection-order": ["order"],
    "quote-text": ["text"], "quote-attribution": ["attribution"], "divider-style": ["style"],
    "research-title": ["title"], "research-description": ["description"], "research-icon": ["icon"],
    "anim-duration": ["duration"], "anim-delay": ["delay"], "anim-easing": ["easing"],
    "anim-trigger": ["trigger"], "sr-title": ["title"], "sr-desc": ["description"],
    "sr-dir": ["direction"], "px-title": ["title"], "px-sub": ["subtitle"],
    "px-media": ["media_url"], "px-speed": ["speed"], "ts-content": ["content"],
    "ts-stagger": ["stagger_delay"], "fi-items": ["items"], "hc-title": ["title"],
    "hc-desc": ["description"], "hc-icon": ["icon"], "hc-effect": ["hover_effect"],
    "ca-label": ["label"], "ca-target": ["target_number"], "ca-suffix": ["suffix"],
    "ir-media": ["media_url"], "ir-alt": ["alt"], "ir-dir": ["reveal_direction"],
    "st-type": ["transition_type"],
};

const FieldErrorsContext = createContext<Record<string, string[]>>({});

function Field({ label, htmlFor, children }: FieldProps) {
    const fieldErrors = useContext(FieldErrorsContext);
    const fieldName = htmlFor
        ? FIELD_NAMES_BY_CONTROL[htmlFor]?.find((candidate) => fieldErrors[candidate]?.length)
        : undefined;
    const errors = fieldName ? fieldErrors[fieldName] : [];
    const errorId = htmlFor && errors.length > 0 ? `${htmlFor}-error` : undefined;
    const control = isValidElement(children) && errors.length > 0
        ? cloneElement(children as ReactElement<Record<string, unknown>>, {
            "aria-invalid": true,
            "aria-describedby": errorId,
        })
        : children;

    return (
        <div className="space-y-1.5">
            <Label htmlFor={htmlFor}>{label}</Label>
            {control}
            {errors.length > 0 && (
                <p id={errorId} className="text-xs text-red-700">{errors.join(" ")}</p>
            )}
        </div>
    );
}

// ─── Hero Settings Editor ──────────────────────────────────────────────────────

interface HeroEditorProps {
    settings: Record<string, unknown>;
    onChange: (settings: Record<string, unknown>) => void;
}

function HeroEditor({ settings, onChange }: HeroEditorProps) {
    const isLocalized = "heading_fa" in settings || "heading_en" in settings;

    if (isLocalized) {
        return (
            <div className="space-y-4">
                <Field label="Title — فارسی" htmlFor="hero-title-fa">
                    <Input id="hero-title-fa" dir="rtl" value={(settings.heading_fa as string) ?? ""} onChange={(e) => onChange({ ...settings, heading_fa: e.target.value })} />
                </Field>
                <Field label="Title — English" htmlFor="hero-title-en">
                    <Input id="hero-title-en" dir="ltr" value={(settings.heading_en as string) ?? ""} onChange={(e) => onChange({ ...settings, heading_en: e.target.value })} />
                </Field>
                <Field label="Subtitle — فارسی" htmlFor="hero-subtitle-fa">
                    <Input id="hero-subtitle-fa" dir="rtl" value={(settings.subheading_fa as string) ?? ""} onChange={(e) => onChange({ ...settings, subheading_fa: e.target.value })} />
                </Field>
                <Field label="Subtitle — English" htmlFor="hero-subtitle-en">
                    <Input id="hero-subtitle-en" dir="ltr" value={(settings.subheading_en as string) ?? ""} onChange={(e) => onChange({ ...settings, subheading_en: e.target.value })} />
                </Field>
                <Field label="CTA text — فارسی" htmlFor="hero-cta-fa">
                    <Input id="hero-cta-fa" dir="rtl" value={(settings.cta_text_fa as string) ?? ""} onChange={(e) => onChange({ ...settings, cta_text_fa: e.target.value })} />
                </Field>
                <Field label="CTA text — English" htmlFor="hero-cta-en">
                    <Input id="hero-cta-en" dir="ltr" value={(settings.cta_text_en as string) ?? ""} onChange={(e) => onChange({ ...settings, cta_text_en: e.target.value })} />
                </Field>
                <Field label="CTA URL" htmlFor="hero-cta-url">
                    <Input id="hero-cta-url" value={(settings.cta_link as string) ?? ""} onChange={(e) => onChange({ ...settings, cta_link: e.target.value })} placeholder="/about or https://…" />
                </Field>
                <Field label="Media ID" htmlFor="hero-media-id">
                    <Input id="hero-media-id" value={(settings.media_id as string) ?? ""} onChange={(e) => onChange({ ...settings, media_id: e.target.value || null })} placeholder="Media UUID" />
                </Field>
                <MediaPicker allowedTypes={["image"]} onSelect={(asset) => onChange({ ...settings, media_id: asset.id })} />
            </div>
        );
    }

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
                    onChange={(e) => onChange({ ...settings, media_id: e.target.value || null })}
                    placeholder="Select media asset"
                />
            </Field>
            <MediaPicker allowedTypes={["image"]} onSelect={(asset) => onChange({ ...settings, media_id: asset.id })} />
            <Field label="CTA Label" htmlFor="hero-cta-label">
                <Input
                    id="hero-cta-label"
                    value={(settings.cta_label as string) ?? ""}
                    onChange={(e) => onChange({ ...settings, cta_label: e.target.value || null })}
                    placeholder="Button text"
                />
            </Field>
            <Field label="CTA URL" htmlFor="hero-cta-url">
                <Input
                    id="hero-cta-url"
                    value={(settings.cta_url as string) ?? ""}
                    onChange={(e) => onChange({ ...settings, cta_url: e.target.value || null })}
                    placeholder="/about or https://…"
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
    const [isImproving, setIsImproving] = useState(false);
    const isLocalized = "body_fa" in settings || "body_en" in settings;

    const handleAiImprove = async () => {
        const text = settings.content as string;
        if (!text) return;

        setIsImproving(true);
        try {
            const res = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, action: "improve" }),
            });
            const data = await res.json();
            if (data.result) {
                onChange({ ...settings, content: data.result });
            }
        } catch (error) {
            console.error("AI Error:", error);
        } finally {
            setIsImproving(false);
        }
    };

    if (isLocalized) {
        return (
            <div className="space-y-4">
                <Field label="Content — فارسی" htmlFor="text-content-fa">
                    <Textarea id="text-content-fa" dir="rtl" value={(settings.body_fa as string) ?? ""} onChange={(e) => onChange({ ...settings, body_fa: e.target.value })} rows={6} />
                </Field>
                <Field label="Content — English" htmlFor="text-content-en">
                    <Textarea id="text-content-en" dir="ltr" value={(settings.body_en as string) ?? ""} onChange={(e) => onChange({ ...settings, body_en: e.target.value })} rows={6} />
                </Field>
                <Field label="Alignment" htmlFor="text-alignment">
                    <Select id="text-alignment" value={(settings.alignment as string) ?? "start"} onChange={(e) => onChange({ ...settings, alignment: e.target.value })} options={ALIGNMENT_OPTIONS} />
                </Field>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <Label htmlFor="text-content">Content</Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={handleAiImprove}
                        disabled={isImproving || !settings.content}
                    >
                        {isImproving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Wand2 className="h-3 w-3 mr-1" />}
                        AI Improve
                    </Button>
                </div>
                <Textarea
                    id="text-content"
                    value={(settings.content as string) ?? ""}
                    onChange={(e) => onChange({ ...settings, content: e.target.value })}
                    placeholder="Enter text content..."
                    rows={5}
                />
            </div>
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
            <MediaPicker
                allowedTypes={["image"]}
                onSelect={(asset) => {
                    if (!mediaIds.includes(asset.id)) {
                        onChange({ ...settings, media_ids: [...mediaIds, asset.id] });
                    }
                }}
            />
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
    { value: "portfolio", label: "Portfolio" },
    { value: "blog", label: "Blog" },
    { value: "posts", label: "Posts" },
    { value: "publications", label: "Publications" },
    { value: "research_projects", label: "Research projects" },
    { value: "research_interests", label: "Research interests" },
    { value: "skills", label: "Skills" },
    { value: "experience", label: "Experience" },
    { value: "education", label: "Education" },
    { value: "certifications", label: "Certifications" },
    { value: "affiliations", label: "Affiliations" },
    { value: "languages", label: "Languages" },
    { value: "resumes", label: "Resumes" },
];

const COLLECTION_ORDER_OPTIONS: SelectOption[] = [
    { value: "default", label: "Default" },
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
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
                    max={12}
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
            <Field label="Order" htmlFor="collection-order">
                <Select id="collection-order" value={(settings.order as string) ?? "default"} onChange={(e) => onChange({ ...settings, order: e.target.value })} options={COLLECTION_ORDER_OPTIONS} />
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
            <Field label="Attribution" htmlFor="quote-attribution">
                <Input
                    id="quote-attribution"
                    value={(settings.attribution as string) ?? ""}
                    onChange={(e) => onChange({ ...settings, attribution: e.target.value || null })}
                    placeholder="Author or source"
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

function ResearchFocusEditor({ settings, onChange }: ResearchFocusEditorProps) {
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

            <Field label="Description" htmlFor="research-description">
                <Textarea id="research-description" value={(settings.description as string) ?? ""} onChange={(e) => onChange({ ...settings, description: e.target.value })} rows={5} />
            </Field>
            <Field label="Icon" htmlFor="research-icon">
                <Input id="research-icon" value={(settings.icon as string) ?? ""} onChange={(e) => onChange({ ...settings, icon: e.target.value || null })} placeholder="Optional icon name" />
            </Field>
        </div>
    );
}

// ─── Editor Registry ───────────────────────────────────────────────────────────

const BLOCK_EDITORS = {
    hero: HeroEditor,
    text: TextEditor,
    gallery: GalleryEditor,
    cta: CtaEditor,
    collection: CollectionEditor,
    quote: QuoteEditor,
    divider: DividerEditor,
    research_focus: ResearchFocusEditor,
} as unknown as Record<
    BlockType,
    React.ComponentType<{ settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }>
>;

// ─── Animation Settings Editors ────────────────────────────────────────────────

const EASING_OPTIONS: SelectOption[] = [
    { value: "ease-in", label: "Ease In" },
    { value: "ease-out", label: "Ease Out" },
    { value: "ease-in-out", label: "Ease In Out" },
    { value: "linear", label: "Linear" },
    { value: "spring", label: "Spring" },
    { value: "cubic-bezier", label: "Cubic Bezier" },
];

const TRIGGER_OPTIONS: SelectOption[] = [
    { value: "scroll", label: "On Scroll" },
    { value: "load", label: "On Load" },
    { value: "hover", label: "On Hover" },
    { value: "click", label: "On Click" },
];

function numberOrFallback(value: string, fallback: number): number {
    if (value.trim() === "") return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function AnimationBaseFields({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
    return (
        <>
            <div className="grid grid-cols-2 gap-2">
                <Field label="Duration (ms)" htmlFor="anim-duration">
                    <Input
                        id="anim-duration"
                        type="number"
                        min={50}
                        max={3000}
                        value={(settings.duration as number) ?? 500}
                        onChange={(e) => onChange({ ...settings, duration: numberOrFallback(e.target.value, 500) })}
                    />
                </Field>
                <Field label="Delay (ms)" htmlFor="anim-delay">
                    <Input
                        id="anim-delay"
                        type="number"
                        min={0}
                        max={2000}
                        value={(settings.delay as number) ?? 0}
                        onChange={(e) => onChange({ ...settings, delay: numberOrFallback(e.target.value, 0) })}
                    />
                </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <Field label="Easing" htmlFor="anim-easing">
                    <Select
                        id="anim-easing"
                        value={(settings.easing as string) ?? "ease-out"}
                        onChange={(e) => onChange({ ...settings, easing: e.target.value })}
                        options={EASING_OPTIONS}
                    />
                </Field>
                <Field label="Trigger" htmlFor="anim-trigger">
                    <Select
                        id="anim-trigger"
                        value={(settings.trigger as string) ?? "scroll"}
                        onChange={(e) => onChange({ ...settings, trigger: e.target.value })}
                        options={TRIGGER_OPTIONS}
                    />
                </Field>
            </div>
        </>
    );
}

function ScrollRevealEditor({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
    return (
        <div className="space-y-4">
            <Field label="Title" htmlFor="sr-title">
                <Input id="sr-title" value={(settings.title as string) ?? ""} onChange={(e) => onChange({ ...settings, title: e.target.value })} />
            </Field>
            <Field label="Description" htmlFor="sr-desc">
                <Textarea id="sr-desc" value={(settings.description as string) ?? ""} onChange={(e) => onChange({ ...settings, description: e.target.value || null })} />
            </Field>
            <Field label="Direction" htmlFor="sr-dir">
                <Select
                    id="sr-dir"
                    value={(settings.direction as string) ?? "up"}
                    onChange={(e) => onChange({ ...settings, direction: e.target.value })}
                    options={[{value:"up",label:"Up"},{value:"down",label:"Down"},{value:"left",label:"Left"},{value:"right",label:"Right"}]}
                />
            </Field>
            <AnimationBaseFields settings={settings} onChange={onChange} />
        </div>
    );
}

function ParallaxEditor({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
    return (
        <div className="space-y-4">
            <Field label="Title" htmlFor="px-title">
                <Input id="px-title" value={(settings.title as string) ?? ""} onChange={(e) => onChange({ ...settings, title: e.target.value })} />
            </Field>
            <Field label="Subtitle" htmlFor="px-sub">
                <Input id="px-sub" value={(settings.subtitle as string) ?? ""} onChange={(e) => onChange({ ...settings, subtitle: e.target.value || null })} />
            </Field>
            <Field label="Media URL" htmlFor="px-media">
                <Input id="px-media" value={(settings.media_url as string) ?? ""} onChange={(e) => onChange({ ...settings, media_url: e.target.value || null })} />
            </Field>
            <Field label="Speed" htmlFor="px-speed">
                <Input id="px-speed" type="number" step="0.1" value={(settings.speed as number) ?? 0.5} onChange={(e) => onChange({ ...settings, speed: numberOrFallback(e.target.value, 0.5) })} />
            </Field>
            <AnimationBaseFields settings={settings} onChange={onChange} />
        </div>
    );
}

function TextStaggerEditor({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
    return (
        <div className="space-y-4">
            <Field label="Content" htmlFor="ts-content">
                <Textarea id="ts-content" value={(settings.content as string) ?? ""} onChange={(e) => onChange({ ...settings, content: e.target.value })} />
            </Field>
            <Field label="Stagger Delay (ms)" htmlFor="ts-stagger">
                <Input id="ts-stagger" type="number" value={(settings.stagger_delay as number) ?? 50} onChange={(e) => onChange({ ...settings, stagger_delay: numberOrFallback(e.target.value, 50) })} />
            </Field>
            <AnimationBaseFields settings={settings} onChange={onChange} />
        </div>
    );
}

function FadeInSequenceEditor({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
    const items = (settings.items as string[]) ?? [];
    return (
        <div className="space-y-4">
            <Field label="Items (JSON Array)" htmlFor="fi-items">
                <Textarea
                    id="fi-items"
                    value={JSON.stringify(items, null, 2)}
                    onChange={(e) => {
                        try { onChange({ ...settings, items: JSON.parse(e.target.value) }); } catch {}
                    }}
                />
            </Field>
            <AnimationBaseFields settings={settings} onChange={onChange} />
        </div>
    );
}

function HoverCardEditor({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
    return (
        <div className="space-y-4">
            <Field label="Title" htmlFor="hc-title">
                <Input id="hc-title" value={(settings.title as string) ?? ""} onChange={(e) => onChange({ ...settings, title: e.target.value })} />
            </Field>
            <Field label="Description" htmlFor="hc-desc">
                <Textarea id="hc-desc" value={(settings.description as string) ?? ""} onChange={(e) => onChange({ ...settings, description: e.target.value })} />
            </Field>
            <Field label="Icon" htmlFor="hc-icon">
                <Input id="hc-icon" value={(settings.icon as string) ?? ""} onChange={(e) => onChange({ ...settings, icon: e.target.value || null })} />
            </Field>
            <Field label="Hover Effect" htmlFor="hc-effect">
                <Select
                    id="hc-effect"
                    value={(settings.hover_effect as string) ?? "scale"}
                    onChange={(e) => onChange({ ...settings, hover_effect: e.target.value })}
                    options={[{value:"scale",label:"Scale"},{value:"lift",label:"Lift"},{value:"glow",label:"Glow"},{value:"flip",label:"Flip"}]}
                />
            </Field>
            <AnimationBaseFields settings={settings} onChange={onChange} />
        </div>
    );
}

function CounterAnimationEditor({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
    return (
        <div className="space-y-4">
            <Field label="Label" htmlFor="ca-label">
                <Input id="ca-label" value={(settings.label as string) ?? ""} onChange={(e) => onChange({ ...settings, label: e.target.value })} />
            </Field>
            <Field label="Target Number" htmlFor="ca-target">
                <Input id="ca-target" type="number" value={(settings.target_number as number) ?? 0} onChange={(e) => onChange({ ...settings, target_number: numberOrFallback(e.target.value, 0) })} />
            </Field>
            <Field label="Suffix" htmlFor="ca-suffix">
                <Input id="ca-suffix" value={(settings.suffix as string) ?? ""} onChange={(e) => onChange({ ...settings, suffix: e.target.value || null })} />
            </Field>
            <AnimationBaseFields settings={settings} onChange={onChange} />
        </div>
    );
}

function ImageRevealEditor({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
    return (
        <div className="space-y-4">
            <Field label="Media URL" htmlFor="ir-media">
                <Input id="ir-media" value={(settings.media_url as string) ?? ""} onChange={(e) => onChange({ ...settings, media_url: e.target.value })} />
            </Field>
            <Field label="Alt Text" htmlFor="ir-alt">
                <Input id="ir-alt" value={(settings.alt as string) ?? ""} onChange={(e) => onChange({ ...settings, alt: e.target.value || null })} />
            </Field>
            <Field label="Reveal Direction" htmlFor="ir-dir">
                <Select
                    id="ir-dir"
                    value={(settings.reveal_direction as string) ?? "left"}
                    onChange={(e) => onChange({ ...settings, reveal_direction: e.target.value })}
                    options={[{value:"left",label:"Left"},{value:"right",label:"Right"},{value:"top",label:"Top"},{value:"bottom",label:"Bottom"},{value:"center",label:"Center"}]}
                />
            </Field>
            <AnimationBaseFields settings={settings} onChange={onChange} />
        </div>
    );
}

function SectionTransitionEditor({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
    return (
        <div className="space-y-4">
            <Field label="Transition Type" htmlFor="st-type">
                <Select
                    id="st-type"
                    value={(settings.transition_type as string) ?? "fade"}
                    onChange={(e) => onChange({ ...settings, transition_type: e.target.value })}
                    options={[{value:"fade",label:"Fade"},{value:"slide",label:"Slide"},{value:"zoom",label:"Zoom"},{value:"clip",label:"Clip"}]}
                />
            </Field>
            <AnimationBaseFields settings={settings} onChange={onChange} />
        </div>
    );
}

Object.assign(BLOCK_EDITORS, {
    scroll_reveal: ScrollRevealEditor,
    parallax: ParallaxEditor,
    text_stagger: TextStaggerEditor,
    fade_in_sequence: FadeInSequenceEditor,
    hover_card: HoverCardEditor,
    counter_animation: CounterAnimationEditor,
    image_reveal: ImageRevealEditor,
    section_transition: SectionTransitionEditor,
});

// ─── Block Inspector Component ─────────────────────────────────────────────────

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
