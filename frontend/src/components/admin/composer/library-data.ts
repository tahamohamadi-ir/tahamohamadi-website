/**
 * Section and block library definitions for the Composer Canvas.
 */

import type { SectionLibraryItem, BlockLibraryItem } from "./types";

export const SECTION_LIBRARY: SectionLibraryItem[] = [
    {
        layout: "full-width",
        label: "Full Width",
        description: "Single column spanning the entire width",
        icon: "square",
    },
    {
        layout: "two-column",
        label: "Two Columns",
        description: "Two equal columns side by side",
        icon: "columns-2",
    },
    {
        layout: "three-column",
        label: "Three Columns",
        description: "Three equal columns",
        icon: "columns-3",
    },
    {
        layout: "sidebar-left",
        label: "Sidebar Left",
        description: "Narrow left column with wide main content",
        icon: "panel-left",
    },
    {
        layout: "sidebar-right",
        label: "Sidebar Right",
        description: "Wide main content with narrow right column",
        icon: "panel-right",
    },
];

export const BLOCK_LIBRARY: BlockLibraryItem[] = [
    {
        block_type: "hero",
        label: "Hero",
        description: "Full-width hero banner with title, subtitle, and CTA",
        icon: "image",
        category: "basic",
    },
    {
        block_type: "text",
        label: "Text",
        description: "Rich text content block",
        icon: "type",
        category: "basic",
    },
    {
        block_type: "gallery",
        label: "Gallery",
        description: "Image gallery with grid or carousel layout",
        icon: "gallery-horizontal",
        category: "media",
    },
    {
        block_type: "cta",
        label: "Call to Action",
        description: "Button or link encouraging user action",
        icon: "mouse-pointer-click",
        category: "basic",
    },
    {
        block_type: "collection",
        label: "Collection",
        description: "Dynamic content from blog, portfolio, or publications",
        icon: "layout-grid",
        category: "basic",
    },
    {
        block_type: "quote",
        label: "Quote",
        description: "Blockquote with author attribution",
        icon: "quote",
        category: "basic",
    },
    {
        block_type: "divider",
        label: "Divider",
        description: "Visual separator between content sections",
        icon: "minus",
        category: "basic",
    },
    {
        block_type: "research_focus",
        label: "Research Focus",
        description: "Research areas with descriptions and icons",
        icon: "microscope",
        category: "basic",
    },
    // Animation Blocks
    {
        block_type: "scroll_reveal",
        label: "Scroll Reveal",
        description: "Content that animates in when scrolled into view",
        icon: "arrow-up-circle",
        category: "animation",
    },
    {
        block_type: "parallax",
        label: "Parallax",
        description: "Background or element that moves at a different speed than scrolling",
        icon: "layers",
        category: "animation",
    },
    {
        block_type: "text_stagger",
        label: "Text Stagger",
        description: "Text that appears word-by-word or letter-by-letter sequentially",
        icon: "baseline",
        category: "animation",
    },
    {
        block_type: "fade_in_sequence",
        label: "Fade In Sequence",
        description: "Multiple items fading in one after another",
        icon: "align-vertical-space-around",
        category: "animation",
    },
    {
        block_type: "hover_card",
        label: "Hover Card",
        description: "Interactive card with transform effects on hover",
        icon: "mouse-pointer-2",
        category: "animation",
    },
    {
        block_type: "counter_animation",
        label: "Counter Animation",
        description: "Number counting up from zero to a target value",
        icon: "hash",
        category: "animation",
    },
    {
        block_type: "image_reveal",
        label: "Image Reveal",
        description: "Image appearing with a clip-path or scale reveal effect",
        icon: "scan-face",
        category: "animation",
    },
    {
        block_type: "section_transition",
        label: "Section Transition",
        description: "Transition effect for revealing entire sections",
        icon: "refresh-cw",
        category: "animation",
    },
];
