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
    },
    {
        block_type: "text",
        label: "Text",
        description: "Rich text content block",
        icon: "type",
    },
    {
        block_type: "gallery",
        label: "Gallery",
        description: "Image gallery with grid or carousel layout",
        icon: "gallery-horizontal",
    },
    {
        block_type: "cta",
        label: "Call to Action",
        description: "Button or link encouraging user action",
        icon: "mouse-pointer-click",
    },
    {
        block_type: "collection",
        label: "Collection",
        description: "Dynamic content from blog, portfolio, or publications",
        icon: "layout-grid",
    },
    {
        block_type: "quote",
        label: "Quote",
        description: "Blockquote with author attribution",
        icon: "quote",
    },
    {
        block_type: "divider",
        label: "Divider",
        description: "Visual separator between content sections",
        icon: "minus",
    },
    {
        block_type: "research_focus",
        label: "Research Focus",
        description: "Research areas with descriptions and icons",
        icon: "microscope",
    },
];
