import { createContext, isValidElement, cloneElement, useContext, type ReactElement } from "react";
import { Label } from "@/components/ui/label";
import { Select, type SelectOption } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MediaPicker } from "@/components/admin/media/MediaPicker";

export const FieldErrorsContext = createContext<Record<string, string[]>>({});

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
    "px-media": ["media_id"], "px-speed": ["speed"], "ts-content": ["content"],
    "ts-stagger": ["stagger_delay"], "fi-items": ["items"], "hc-title": ["title"],
    "hc-desc": ["description"], "hc-icon": ["icon"], "hc-effect": ["hover_effect"],
    "ca-label": ["label"], "ca-target": ["target_number"], "ca-suffix": ["suffix"],
    "ir-media": ["media_id"], "ir-alt": ["alt"], "ir-dir": ["reveal_direction"],
    "st-type": ["transition_type"],
};

export interface FieldProps {
    label: string;
    htmlFor?: string;
    children: React.ReactNode;
}

export function Field({ label, htmlFor, children }: FieldProps) {
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

export function MediaReferencePicker({
    selected,
    onSelect,
    onClear,
}: {
    selected: boolean;
    onSelect: (mediaId: string) => void;
    onClear: () => void;
}) {
    return (
        <div className="space-y-2" aria-label="Media selection">
            {selected && (
                <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                    <span className="text-sm text-gray-700">Media selected</span>
                    <Button type="button" variant="ghost" size="sm" onClick={onClear} aria-label="Clear media selection">
                        Clear
                    </Button>
                </div>
            )}
            <MediaPicker allowedTypes={["image"]} onSelect={(asset) => onSelect(asset.id)} />
        </div>
    );
}

export function withMediaReference(settings: Record<string, unknown>, mediaId: string | null) {
    const { media_url: _legacyMediaUrl, ...nextSettings } = settings;
    return { ...nextSettings, media_id: mediaId };
}

const VISUAL_VARIANTS = [
    { value: "default", label: "Default", color: "bg-white border-gray-200" },
    { value: "muted", label: "Muted", color: "bg-gray-100 border-gray-200" },
    { value: "brand", label: "Brand", color: "bg-blue-600 border-blue-700" },
    { value: "dark", label: "Dark", color: "bg-gray-900 border-gray-800" },
];

export function VisualVariantSelector({ value, onChange }: { value: string; onChange: (val: string) => void }) {
    return (
        <div className="space-y-2">
            <Label>Visual Variant</Label>
            <div className="grid grid-cols-2 gap-2">
                {VISUAL_VARIANTS.map((v) => (
                    <button
                        key={v.value}
                        type="button"
                        className={`flex flex-col items-center justify-center rounded-md border p-2 text-sm transition-all ${
                            value === v.value
                                ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                        onClick={() => onChange(v.value)}
                    >
                        <div className={`mb-1.5 h-6 w-full rounded border ${v.color}`} />
                        <span className="text-xs">{v.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export const EASING_OPTIONS: SelectOption[] = [
    { value: "ease-in", label: "Ease In" },
    { value: "ease-out", label: "Ease Out" },
    { value: "ease-in-out", label: "Ease In Out" },
    { value: "linear", label: "Linear" },
    { value: "spring", label: "Spring" },
    { value: "cubic-bezier", label: "Cubic Bezier" },
];

export const TRIGGER_OPTIONS: SelectOption[] = [
    { value: "scroll", label: "On Scroll" },
    { value: "load", label: "On Load" },
    { value: "hover", label: "On Hover" },
    { value: "click", label: "On Click" },
];

export function numberOrFallback(value: string, fallback: number): number {
    if (value.trim() === "") return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function AnimationBaseFields({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
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
