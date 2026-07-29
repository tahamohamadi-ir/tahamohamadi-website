/**
 * TypeScript interfaces for CMS and Article block DTOs.
 * Used by BlockRenderer to dispatch to typed block components.
 */

// ─── Locale ────────────────────────────────────────────────────────────────────

export type Locale = "fa" | "en";

// ─── CMS Block Settings Types ──────────────────────────────────────────────────

export interface HeroSettings {
    title?: string;
    subtitle?: string;
    media_id?: string;
    media_url?: string;
    cta_url?: string;
    cta_label?: string;
}

export interface TextSettings {
    content: string;
    alignment?: "start" | "center" | "end";
}

export interface GallerySettings {
    media_ids?: string[];
    items?: Array<{
        media_id: string;
        url: string;
        alt?: string;
        caption?: string;
    }>;
    layout?: "grid" | "carousel";
}

export interface CtaSettings {
    label: string;
    url: string;
    variant?: "primary" | "secondary";
}

export interface CollectionSettings {
    source: "portfolio" | "blog" | "publications";
    filter?: Record<string, unknown>;
    limit?: number;
}

export interface QuoteSettings {
    text: string;
    author?: string;
    role?: string;
}

export interface DividerSettings {
    style?: "line" | "dots" | "space";
}

export interface ResearchFocusSettings {
    title?: string;
    description?: string;
    areas?: Array<{
        name: string;
        description?: string;
        icon?: string;
    }>;
}

// ─── Article Block Content Types ───────────────────────────────────────────────

export interface ParagraphContent {
    text: string;
}

export interface HeadingContent {
    text: string;
    level: 1 | 2 | 3 | 4 | 5 | 6;
    id?: string;
}

export interface ListContent {
    items: string[];
    ordered?: boolean;
}

export interface ImageContent {
    media_id?: string;
    url: string;
    alt?: string;
    caption?: string;
    width?: number;
    height?: number;
}

export interface CaptionContent {
    text: string;
}

export interface CodeContent {
    code: string;
    language?: string;
    filename?: string;
}

export interface CalloutContent {
    text: string;
    type?: "info" | "warning" | "tip" | "note";
}

export interface ReferenceContent {
    text: string;
    url?: string;
    authors?: string;
    year?: number;
}

// ─── Animation Block Settings Types ──────────────────────────────────────────

export interface ScrollRevealSettings {
    title: string;
    description?: string;
    duration: number;
    delay: number;
    easing: string;
    trigger: "scroll" | "load" | "hover" | "click";
    direction?: "up" | "down" | "left" | "right";
}

export interface ParallaxSettings {
    title: string;
    subtitle?: string;
    media_url?: string;
    speed?: number;
    duration: number;
    delay: number;
    easing: string;
    trigger: "scroll" | "load" | "hover" | "click";
}

export interface TextStaggerSettings {
    content: string;
    stagger_delay?: number;
    duration: number;
    delay: number;
    easing: string;
    trigger: "scroll" | "load" | "hover" | "click";
}

export interface FadeInSequenceSettings {
    items: string[];
    duration: number;
    delay: number;
    easing: string;
    trigger: "scroll" | "load" | "hover" | "click";
}

export interface HoverCardSettings {
    title: string;
    description: string;
    icon?: string;
    hover_effect?: "scale" | "lift" | "glow" | "flip";
    duration: number;
    delay: number;
    easing: string;
    trigger: "scroll" | "load" | "hover" | "click";
}

export interface CounterAnimationSettings {
    label: string;
    target_number: number;
    suffix?: string;
    duration: number;
    delay: number;
    easing: string;
    trigger: "scroll" | "load" | "hover" | "click";
}

export interface ImageRevealSettings {
    media_url: string;
    alt?: string;
    reveal_direction?: "left" | "right" | "top" | "bottom" | "center";
    duration: number;
    delay: number;
    easing: string;
    trigger: "scroll" | "load" | "hover" | "click";
}

export interface SectionTransitionSettings {
    transition_type: "fade" | "slide" | "zoom" | "clip";
    duration: number;
    delay: number;
    easing: string;
    trigger: "scroll" | "load" | "hover" | "click";
}

// ─── Block DTO ─────────────────────────────────────────────────────────────────

/** CMS page block types */
export type CmsBlockType =
    | "hero"
    | "text"
    | "gallery"
    | "cta"
    | "collection"
    | "quote"
    | "divider"
    | "research_focus";

/** Article editor block types */
export type ArticleBlockType =
    | "paragraph"
    | "heading"
    | "list"
    | "image"
    | "gallery"
    | "caption"
    | "quote"
    | "code"
    | "divider"
    | "callout"
    | "reference";

/** Animation page builder block types */
export type AnimationBlockType =
    | "scroll_reveal"
    | "parallax"
    | "text_stagger"
    | "fade_in_sequence"
    | "hover_card"
    | "counter_animation"
    | "image_reveal"
    | "section_transition";

/** All known block types */
export type BlockType = CmsBlockType | ArticleBlockType | AnimationBlockType;

/**
 * Unified Block DTO matching the Django API response.
 * The `settings` or `content` field is a typed JSON object per block_type.
 */
export interface BlockDTO {
    id: string;
    block_type: string;
    settings?: Record<string, unknown>;
    content?: Record<string, unknown>;
    ordering: number;
}

// ─── BlockRenderer Props ───────────────────────────────────────────────────────

export interface BlockRendererProps {
    block: BlockDTO;
    locale: Locale;
}

export interface BlockComponentProps<T = Record<string, unknown>> {
    data: T;
    locale: Locale;
}
