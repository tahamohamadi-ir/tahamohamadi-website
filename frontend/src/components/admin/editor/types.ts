/**
 * Types for the Article Editor component.
 */

import type { Locale, ArticleBlockType } from "@/components/blocks/types";

/** Article block as used by the editor and API */
export interface ArticleBlock {
    id?: string;
    locale?: Locale;
    block_type: ArticleBlockType;
    content: Record<string, unknown>;
    ordering: number;
}

/** Simplified article shape for the editor */
export interface EditorArticle {
    id?: string;
    title_fa?: string;
    title_en?: string;
    slug_fa?: string;
    slug_en?: string;
    excerpt_fa?: string;
    excerpt_en?: string;
    status?: "draft" | "in_review" | "scheduled" | "published" | "archived";
    blocks: ArticleBlock[];
    version?: number;
}

/** Props for the ArticleEditor component */
export interface ArticleEditorProps {
    /** The article being edited (null for new articles) */
    article: EditorArticle | null;
    /** Current editing locale */
    locale: Locale;
    /** Called with converted ArticleBlock[] when user saves */
    onSave?: (blocks: ArticleBlock[]) => void;
    /** Called with converted ArticleBlock[] for preview */
    onPreview?: (blocks: ArticleBlock[]) => void;
    /** Reports unresolved lossy-conversion warnings to the route owner. */
    onWarningsChange?: (warnings: string[]) => void;
}

/** Result of a potentially lossy editor/document conversion. */
export interface ArticleBlockConversionResult {
    blocks: ArticleBlock[];
    warnings: string[];
}

/** Result of importing stored article blocks into the editor schema. */
export interface ArticleDocConversionResult {
    doc: import("@tiptap/react").JSONContent;
    warnings: string[];
}

/** Slash command menu item */
export interface SlashCommandItem {
    id: string;
    label: string;
    description: string;
    icon: string;
    command: string;
}
