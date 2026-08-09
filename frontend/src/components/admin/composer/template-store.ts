import type { ComposerSection } from "./types";

export interface TemplateManifestSection {
    ordering: number;
    enabled: boolean;
    layout: string;
    blocks: Array<{
        block_type: string;
        ordering: number;
        settings: Record<string, unknown>;
    }>;
}

export interface TemplateManifest {
    schema_version: 1;
    sections: TemplateManifestSection[];
    block_types: string[];
    media_references: string[];
    translation_completeness: { fa: boolean; en: boolean };
}

function deriveTranslationCompleteness(value: unknown): { fa: boolean; en: boolean } {
    const result = { fa: true, en: true };

    function visit(item: unknown): void {
        if (Array.isArray(item)) {
            item.forEach(visit);
            return;
        }
        if (!item || typeof item !== "object") return;

        const record = item as Record<string, unknown>;
        const bases = new Set(
            Object.keys(record)
                .filter((key) => key.endsWith("_fa") || key.endsWith("_en"))
                .map((key) => key.slice(0, -3)),
        );
        bases.forEach((base) => {
            (["fa", "en"] as const).forEach((locale) => {
                const localized = record[`${base}_${locale}`];
                if (localized === undefined || localized === null || (
                    typeof localized === "string" && localized.trim() === ""
                )) {
                    result[locale] = false;
                }
            });
        });
        Object.values(record).forEach(visit);
    }

    visit(value);
    return result;
}

export function createTemplateManifest(sections: ComposerSection[]): TemplateManifest {
    const portableSections = sections.map((section) => ({
        ordering: section.ordering,
        enabled: section.enabled,
        layout: section.layout,
        blocks: section.blocks.map((block) => ({
            block_type: block.block_type,
            ordering: block.ordering,
            settings: structuredClone(block.settings),
        })),
    }));
    const blocks = portableSections.flatMap((section) => section.blocks);
    const mediaReferences = new Set<string>();
    blocks.forEach((block) => {
        const mediaId = block.settings.media_id;
        if (typeof mediaId === "string" && mediaId) mediaReferences.add(mediaId);
        const mediaIds = block.settings.media_ids;
        if (Array.isArray(mediaIds)) {
            mediaIds.forEach((value) => {
                if (typeof value === "string" && value) mediaReferences.add(value);
            });
        }
    });

    return {
        schema_version: 1,
        sections: portableSections,
        block_types: [...new Set(blocks.map((block) => block.block_type))].sort(),
        media_references: [...mediaReferences].sort(),
        translation_completeness: deriveTranslationCompleteness(portableSections),
    };
}
