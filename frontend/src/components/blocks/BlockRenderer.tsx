import type { BlockDTO, BlockRendererProps, Locale } from "./types";

// ─── CMS Block Components ──────────────────────────────────────────────────────
import { HeroBlock } from "./cms/HeroBlock";
import { TextBlock } from "./cms/TextBlock";
import { GalleryBlock } from "./cms/GalleryBlock";
import { CtaBlock } from "./cms/CtaBlock";
import { CollectionBlock } from "./cms/CollectionBlock";
import { QuoteBlock } from "./cms/QuoteBlock";
import { DividerBlock } from "./cms/DividerBlock";
import { ResearchFocusBlock } from "./cms/ResearchFocusBlock";

// ─── Article Block Components ──────────────────────────────────────────────────
import { ParagraphBlock } from "./article/ParagraphBlock";
import { HeadingBlock } from "./article/HeadingBlock";
import { ListBlock } from "./article/ListBlock";
import { ImageBlock } from "./article/ImageBlock";
import { ArticleGalleryBlock } from "./article/GalleryBlock";
import { CaptionBlock } from "./article/CaptionBlock";
import { ArticleQuoteBlock } from "./article/QuoteBlock";
import { CodeBlock } from "./article/CodeBlock";
import { ArticleDividerBlock } from "./article/DividerBlock";
import { CalloutBlock } from "./article/CalloutBlock";
import { ReferenceBlock } from "./article/ReferenceBlock";

// ─── Animation Block Components ────────────────────────────────────────────────
import { ScrollRevealBlock } from "./animation/ScrollRevealBlock";
import { ParallaxBlock } from "./animation/ParallaxBlock";
import { TextStaggerBlock } from "./animation/TextStaggerBlock";
import { FadeInSequenceBlock } from "./animation/FadeInSequenceBlock";
import { HoverCardBlock } from "./animation/HoverCardBlock";
import { CounterAnimationBlock } from "./animation/CounterAnimationBlock";
import { ImageRevealBlock } from "./animation/ImageRevealBlock";
import { SectionTransitionBlock } from "./animation/SectionTransitionBlock";

// ─── Block Type Registry ───────────────────────────────────────────────────────

/**
 * Registry mapping block_type strings to their React component.
 * Unknown block types are excluded from rendering (fail-closed per Req 4.9).
 *
 * CMS block types: hero, text, gallery, cta, collection, quote, divider, research_focus
 * Article block types: paragraph, heading, list, image, gallery, caption, quote, code, divider, callout, reference
 * Animation block types: scroll_reveal, parallax, text_stagger, fade_in_sequence, hover_card, counter_animation, image_reveal, section_transition
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BlockComponent = React.ComponentType<{ data: any; locale: Locale }>;

const CMS_BLOCK_REGISTRY: Record<string, BlockComponent> = {
    hero: HeroBlock,
    text: TextBlock,
    gallery: GalleryBlock,
    cta: CtaBlock,
    collection: CollectionBlock,
    quote: QuoteBlock,
    divider: DividerBlock,
    research_focus: ResearchFocusBlock,
};

const ARTICLE_BLOCK_REGISTRY: Record<string, BlockComponent> = {
    paragraph: ParagraphBlock,
    heading: HeadingBlock,
    list: ListBlock,
    image: ImageBlock,
    gallery: ArticleGalleryBlock,
    caption: CaptionBlock,
    quote: ArticleQuoteBlock,
    code: CodeBlock,
    divider: ArticleDividerBlock,
    callout: CalloutBlock,
    reference: ReferenceBlock,
};

const ANIMATION_BLOCK_REGISTRY: Record<string, BlockComponent> = {
    scroll_reveal: ScrollRevealBlock,
    parallax: ParallaxBlock,
    text_stagger: TextStaggerBlock,
    fade_in_sequence: FadeInSequenceBlock,
    hover_card: HoverCardBlock,
    counter_animation: CounterAnimationBlock,
    image_reveal: ImageRevealBlock,
    section_transition: SectionTransitionBlock,
};

/**
 * Combined registry merging CMS, article, and animation blocks.
 */
const COMBINED_REGISTRY: Record<string, BlockComponent> = {
    ...ARTICLE_BLOCK_REGISTRY,
    ...CMS_BLOCK_REGISTRY,
    ...ANIMATION_BLOCK_REGISTRY,
};

// ─── BlockRenderer ─────────────────────────────────────────────────────────────

export interface BlockRendererComponentProps extends BlockRendererProps {
    /** Rendering context: "cms" for page blocks, "article" for article blocks */
    context?: "cms" | "article";
}

/**
 * BlockRenderer dispatches a block DTO to its typed React component.
 *
 * - Maps block_type to the appropriate component from the registry
 * - Passes `settings` (CMS) or `content` (article) as the `data` prop
 * - Gracefully skips unknown block types (fail-closed per Requirement 4.9)
 * - Accepts locale prop for RTL/LTR-aware rendering
 *
 * @example
 * // Rendering CMS page blocks
 * <BlockRenderer block={block} locale="fa" context="cms" />
 *
 * @example
 * // Rendering article blocks
 * <BlockRenderer block={block} locale="en" context="article" />
 */
export function BlockRenderer({ block, locale, context = "cms" }: BlockRendererComponentProps) {
    const registry = context === "article" ? ARTICLE_BLOCK_REGISTRY : COMBINED_REGISTRY;
    const Component = registry[block.block_type];

    // Fail-closed: unknown block types are excluded from rendering
    if (!Component) {
        return null;
    }

    // CMS blocks use `settings`, article blocks use `content`
    const data = (context === "article" ? block.content : block.settings) ?? {};

    return <Component data={data} locale={locale} />;
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

/**
 * Check if a block_type is a known CMS block type.
 */
export function isCmsBlockType(blockType: string): boolean {
    return blockType in CMS_BLOCK_REGISTRY;
}

/**
 * Check if a block_type is a known article block type.
 */
export function isArticleBlockType(blockType: string): boolean {
    return blockType in ARTICLE_BLOCK_REGISTRY;
}

/**
 * Check if a block_type is known (either CMS or article).
 */
export function isKnownBlockType(blockType: string): boolean {
    return blockType in COMBINED_REGISTRY;
}

/**
 * Filter blocks to only include known block types.
 * Implements the fail-closed requirement (Req 4.9).
 */
export function filterKnownBlocks(blocks: BlockDTO[], context: "cms" | "article" = "cms"): BlockDTO[] {
    const registry = context === "article" ? ARTICLE_BLOCK_REGISTRY : COMBINED_REGISTRY;
    return blocks.filter((block) => block.block_type in registry);
}
