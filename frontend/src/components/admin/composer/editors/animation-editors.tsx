"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field, MediaReferencePicker, AnimationBaseFields, withMediaReference, numberOrFallback } from "./shared";

export function ScrollRevealEditor({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
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

export function ParallaxEditor({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
    return (
        <div className="space-y-4">
            <Field label="Title" htmlFor="px-title">
                <Input id="px-title" value={(settings.title as string) ?? ""} onChange={(e) => onChange({ ...settings, title: e.target.value })} />
            </Field>
            <Field label="Subtitle" htmlFor="px-sub">
                <Input id="px-sub" value={(settings.subtitle as string) ?? ""} onChange={(e) => onChange({ ...settings, subtitle: e.target.value || null })} />
            </Field>
            <MediaReferencePicker
                selected={typeof settings.media_id === "string" && settings.media_id.length > 0}
                onSelect={(mediaId) => onChange(withMediaReference(settings, mediaId))}
                onClear={() => onChange(withMediaReference(settings, null))}
            />
            <Field label="Speed" htmlFor="px-speed">
                <Input id="px-speed" type="number" step="0.1" value={(settings.speed as number) ?? 0.5} onChange={(e) => onChange({ ...settings, speed: numberOrFallback(e.target.value, 0.5) })} />
            </Field>
            <AnimationBaseFields settings={settings} onChange={onChange} />
        </div>
    );
}

export function TextStaggerEditor({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
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

export function FadeInSequenceEditor({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
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

export function HoverCardEditor({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
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

export function CounterAnimationEditor({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
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

export function ImageRevealEditor({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
    return (
        <div className="space-y-4">
            <MediaReferencePicker
                selected={typeof settings.media_id === "string" && settings.media_id.length > 0}
                onSelect={(mediaId) => onChange(withMediaReference(settings, mediaId))}
                onClear={() => onChange(withMediaReference(settings, null))}
            />
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

export function SectionTransitionEditor({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
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
