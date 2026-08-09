"use client";

import { useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, type SelectOption } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MediaPicker } from "@/components/admin/media/MediaPicker";
import { Field, MediaReferencePicker, VisualVariantSelector } from "./shared";

export function HeroEditor({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
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
                <MediaReferencePicker
                    selected={typeof settings.media_id === "string" && settings.media_id.length > 0}
                    onSelect={(mediaId) => onChange({ ...settings, media_id: mediaId })}
                    onClear={() => onChange({ ...settings, media_id: null })}
                />
                <VisualVariantSelector
                    value={(settings.variant as string) ?? "default"}
                    onChange={(variant) => onChange({ ...settings, variant })}
                />
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
            <MediaReferencePicker
                selected={typeof settings.media_id === "string" && settings.media_id.length > 0}
                onSelect={(mediaId) => onChange({ ...settings, media_id: mediaId })}
                onClear={() => onChange({ ...settings, media_id: null })}
            />
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
            <VisualVariantSelector
                value={(settings.variant as string) ?? "default"}
                onChange={(variant) => onChange({ ...settings, variant })}
            />
        </div>
    );
}

const ALIGNMENT_OPTIONS: SelectOption[] = [
    { value: "start", label: "Start" },
    { value: "center", label: "Center" },
    { value: "end", label: "End" },
];

export function TextEditor({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
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
                <VisualVariantSelector
                    value={(settings.variant as string) ?? "default"}
                    onChange={(variant) => onChange({ ...settings, variant })}
                />
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
            <VisualVariantSelector
                value={(settings.variant as string) ?? "default"}
                onChange={(variant) => onChange({ ...settings, variant })}
            />
        </div>
    );
}

const GALLERY_LAYOUT_OPTIONS: SelectOption[] = [
    { value: "grid", label: "Grid" },
    { value: "carousel", label: "Carousel" },
];

export function GalleryEditor({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
    const mediaIds = (settings.media_ids as string[]) ?? [];

    return (
        <div className="space-y-4">
            <div className="space-y-2" aria-label="Selected gallery media">
                <p className="text-sm text-gray-700">
                    {mediaIds.length} media {mediaIds.length === 1 ? "item" : "items"} selected
                </p>
                {mediaIds.length > 0 && (
                    <ul className="space-y-1">
                        {mediaIds.map((mediaId, index) => (
                            <li key={mediaId} className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                                <span className="text-sm text-gray-700">Media item {index + 1}</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    aria-label={`Remove selected media ${index + 1}`}
                                    onClick={() => onChange({
                                        ...settings,
                                        media_ids: mediaIds.filter((_, itemIndex) => itemIndex !== index),
                                    })}
                                >
                                    Remove
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
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

const CTA_VARIANT_OPTIONS: SelectOption[] = [
    { value: "primary", label: "Primary" },
    { value: "secondary", label: "Secondary" },
];

export function CtaEditor({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
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

export function CollectionEditor({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
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

export function QuoteEditor({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
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

const DIVIDER_STYLE_OPTIONS: SelectOption[] = [
    { value: "line", label: "Line" },
    { value: "dots", label: "Dots" },
    { value: "space", label: "Space" },
];

export function DividerEditor({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
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

export function ResearchFocusEditor({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
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
