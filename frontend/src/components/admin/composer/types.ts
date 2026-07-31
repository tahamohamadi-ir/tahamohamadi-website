/**
 * Types for the Composer Canvas - admin page editor.
 * Extends CMS types with mutable state for editing.
 */

export type SectionLayout = "full-width" | "two-column" | "three-column" | "sidebar-left" | "sidebar-right";

export type BlockType =
    | "hero"
    | "text"
    | "gallery"
    | "cta"
    | "collection"
    | "quote"
    | "divider"
    | "research_focus"
    | "scroll_reveal"
    | "parallax"
    | "text_stagger"
    | "fade_in_sequence"
    | "hover_card"
    | "counter_animation"
    | "image_reveal"
    | "section_transition";

export interface ComposerBlock {
    id: string;
    block_type: BlockType;
    settings: Record<string, unknown>;
    ordering: number;
}

export interface ComposerSection {
    id: string;
    layout: SectionLayout;
    enabled: boolean;
    ordering: number;
    blocks: ComposerBlock[];
}

export interface SectionLibraryItem {
    layout: SectionLayout;
    label: string;
    description: string;
    icon: string;
}

export interface BlockLibraryItem {
    block_type: BlockType;
    label: string;
    description: string;
    icon: string;
    category: "basic" | "media" | "animation";
}
