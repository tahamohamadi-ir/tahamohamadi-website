"use client";

import { useState } from "react";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import type { ComposerSection } from "./types";
import type { Locale } from "@/components/blocks/types";

// ─── Device Presets ────────────────────────────────────────────────────────────

type DeviceType = "desktop" | "tablet" | "mobile";

interface DevicePreset {
    label: string;
    width: number;
    icon: string;
}

const DEVICE_PRESETS: Record<DeviceType, DevicePreset> = {
    desktop: { label: "Desktop", width: 1440, icon: "🖥" },
    tablet: { label: "Tablet", width: 768, icon: "📱" },
    mobile: { label: "Mobile", width: 375, icon: "📲" },
};

const LOCALE_OPTIONS: { value: Locale; label: string; dir: "rtl" | "ltr" }[] = [
    { value: "fa", label: "فارسی", dir: "rtl" },
    { value: "en", label: "English", dir: "ltr" },
];

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface PreviewPanelProps {
    /** Sections to render in preview */
    sections: ComposerSection[];
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * PreviewPanel renders a responsive preview of the composed page content.
 *
 * Features:
 * - Device toggle: desktop (1440px), tablet (768px), mobile (375px)
 * - Locale toggle: fa (Persian/RTL) and en (English/LTR)
 * - Uses CSS scaling to fit the viewport preview within the panel
 * - Reuses BlockRenderer from the public site for accurate rendering
 *
 * Requirements: 11.9
 */
export function PreviewPanel({ sections }: PreviewPanelProps) {
    const [device, setDevice] = useState<DeviceType>("desktop");
    const [locale, setLocale] = useState<Locale>("fa");

    const currentDevice = DEVICE_PRESETS[device];
    const currentLocale = LOCALE_OPTIONS.find((l) => l.value === locale)!;

    return (
        <div className="flex flex-col h-full border rounded-lg bg-muted/30 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 px-4 py-3 border-b bg-background">
                {/* Device toggles */}
                <div className="flex items-center gap-1" role="radiogroup" aria-label="Device preview">
                    {(Object.entries(DEVICE_PRESETS) as [DeviceType, DevicePreset][]).map(
                        ([key, preset]) => (
                            <button
                                key={key}
                                type="button"
                                role="radio"
                                aria-checked={device === key}
                                aria-label={`Preview as ${preset.label} (${preset.width}px)`}
                                onClick={() => setDevice(key)}
                                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
                  transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                  ${device === key
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    }
                `}
                            >
                                <span aria-hidden="true">{preset.icon}</span>
                                <span className="hidden sm:inline">{preset.label}</span>
                                <span className="text-xs opacity-70">{preset.width}px</span>
                            </button>
                        )
                    )}
                </div>

                {/* Locale toggles */}
                <div className="flex items-center gap-1" role="radiogroup" aria-label="Locale preview">
                    {LOCALE_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={locale === opt.value}
                            aria-label={`Preview in ${opt.label}`}
                            onClick={() => setLocale(opt.value)}
                            className={`
                inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium
                transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                ${locale === opt.value
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                }
              `}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Preview viewport */}
            <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
                <div
                    className="origin-top bg-background border rounded shadow-sm transition-all duration-200"
                    style={{
                        width: `${currentDevice.width}px`,
                        maxWidth: "100%",
                        minHeight: "400px",
                    }}
                >
                    <div
                        dir={currentLocale.dir}
                        lang={locale}
                        className={`${locale === "fa" ? "font-vazirmatn" : "font-inter"}`}
                    >
                        {sections.length === 0 ? (
                            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                                {locale === "fa" ? "محتوایی برای پیش‌نمایش وجود ندارد" : "No content to preview"}
                            </div>
                        ) : (
                            sections
                                .filter((s) => s.enabled)
                                .sort((a, b) => a.ordering - b.ordering)
                                .map((section) => (
                                    <section key={section.id} className="w-full">
                                        {section.blocks
                                            .slice()
                                            .sort((a, b) => a.ordering - b.ordering)
                                            .map((block) => (
                                                <BlockRenderer
                                                    key={block.id}
                                                    block={{
                                                        id: block.id,
                                                        block_type: block.block_type,
                                                        settings: block.settings,
                                                        ordering: block.ordering,
                                                    }}
                                                    locale={locale}
                                                    context="cms"
                                                />
                                            ))}
                                    </section>
                                ))
                        )}
                    </div>
                </div>
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between px-4 py-2 border-t bg-background text-xs text-muted-foreground">
                <span>
                    {currentDevice.label} — {currentDevice.width}px
                </span>
                <span>
                    {currentLocale.dir.toUpperCase()} • {currentLocale.label}
                </span>
            </div>
        </div>
    );
}
