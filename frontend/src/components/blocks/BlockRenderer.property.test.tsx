/**
 * Property-based tests for BlockRenderer component using fast-check.
 *
 * **Validates: Requirements 15.4, 15.5**
 *
 * Tests universal properties that hold across all inputs:
 * - Known block types always produce DOM output
 * - Unknown block types never produce DOM output (fail-closed)
 * - filterKnownBlocks always returns a subset of the input
 */
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
    BlockRenderer,
    isCmsBlockType,
    isArticleBlockType,
    isKnownBlockType,
    filterKnownBlocks,
} from "./BlockRenderer";
import type { BlockDTO } from "./types";

// ─── Arbitraries ───────────────────────────────────────────────────────────────

const CMS_BLOCK_TYPES = [
    "hero",
    "text",
    "gallery",
    "cta",
    "collection",
    "quote",
    "divider",
    "research_focus",
] as const;

const ARTICLE_BLOCK_TYPES = [
    "paragraph",
    "heading",
    "list",
    "image",
    "gallery",
    "caption",
    "quote",
    "code",
    "divider",
    "callout",
    "reference",
] as const;

const ALL_KNOWN_BLOCK_TYPES = [...new Set([...CMS_BLOCK_TYPES, ...ARTICLE_BLOCK_TYPES])];

/** Generates a random known CMS block type */
const cmsBlockTypeArb = fc.constantFrom(...CMS_BLOCK_TYPES);

/** Generates a random known article block type */
const articleBlockTypeArb = fc.constantFrom(...ARTICLE_BLOCK_TYPES);

/** Generates a random known block type (CMS or article) */
const knownBlockTypeArb = fc.constantFrom(...ALL_KNOWN_BLOCK_TYPES);

/**
 * Generates a string guaranteed to not be a known block type.
 * Also excludes Object.prototype property names (valueOf, toString, etc.)
 * which would match the `in` operator on plain objects.
 */
const OBJECT_PROTO_KEYS = Object.getOwnPropertyNames(Object.prototype);
const unknownBlockTypeArb = fc
    .string({ minLength: 1 })
    .filter(
        (s) =>
            !ALL_KNOWN_BLOCK_TYPES.includes(s as never) &&
            !OBJECT_PROTO_KEYS.includes(s)
    );

const localeArb = fc.constantFrom("fa" as const, "en" as const);

/**
 * Generates minimal valid settings for a given CMS block_type.
 * Each block type has required props that must be present for rendering.
 */
function cmsSettingsForType(blockType: string): Record<string, unknown> {
    switch (blockType) {
        case "hero":
            return { title: "Test Title" };
        case "text":
            return { content: "<p>Test</p>" };
        case "gallery":
            return {
                items: [{ media_id: "1", url: "/img.jpg", alt: "Test image" }],
                layout: "grid",
            };
        case "cta":
            return { label: "Click", url: "/test" };
        case "collection":
            return { source: "blog" };
        case "quote":
            return { text: "A quote" };
        case "divider":
            return { style: "line" };
        case "research_focus":
            return { title: "Research", areas: [{ name: "AI", description: "ML research" }] };
        default:
            return {};
    }
}

/**
 * Generates minimal valid content for a given article block_type.
 */
function articleContentForType(blockType: string): Record<string, unknown> {
    switch (blockType) {
        case "paragraph":
            return { text: "A paragraph" };
        case "heading":
            return { text: "Heading", level: 2 };
        case "list":
            return { items: ["item 1"], ordered: false };
        case "image":
            return { url: "/img.jpg", alt: "test" };
        case "gallery":
            return {
                items: [{ media_id: "1", url: "/img.jpg", alt: "Test image" }],
                layout: "grid",
            };
        case "caption":
            return { text: "Caption text" };
        case "quote":
            return { text: "A quote" };
        case "code":
            return { code: "x = 1", language: "python" };
        case "divider":
            return { style: "line" };
        case "callout":
            return { text: "Note", type: "info" };
        case "reference":
            return { text: "Ref", year: 2023 };
        default:
            return {};
    }
}

/** Generates a valid CMS BlockDTO */
const cmsBlockArb = fc.tuple(cmsBlockTypeArb, fc.uuid()).map(([blockType, id]) => ({
    id,
    block_type: blockType,
    settings: cmsSettingsForType(blockType),
    ordering: 0,
}));

/** Generates a valid article BlockDTO */
const articleBlockArb = fc.tuple(articleBlockTypeArb, fc.uuid()).map(([blockType, id]) => ({
    id,
    block_type: blockType,
    content: articleContentForType(blockType),
    ordering: 0,
}));

// ─── Property Tests ────────────────────────────────────────────────────────────

describe("BlockRenderer property-based tests", () => {
    describe("Known CMS block types always render output", () => {
        it("renders non-empty content for any known CMS block type", () => {
            fc.assert(
                fc.property(cmsBlockArb, localeArb, (block, locale) => {
                    const { container } = render(
                        <BlockRenderer block={block} locale={locale} context="cms" />
                    );
                    expect(container.innerHTML).not.toBe("");
                }),
                { numRuns: 50 }
            );
        });
    });

    describe("Known article block types always render output", () => {
        it("renders non-empty content for any known article block type", () => {
            fc.assert(
                fc.property(articleBlockArb, localeArb, (block, locale) => {
                    const { container } = render(
                        <BlockRenderer block={block} locale={locale} context="article" />
                    );
                    expect(container.innerHTML).not.toBe("");
                }),
                { numRuns: 50 }
            );
        });
    });

    describe("Unknown block types always render nothing (fail-closed)", () => {
        it("renders empty content for any unknown block_type string", () => {
            fc.assert(
                fc.property(unknownBlockTypeArb, localeArb, (blockType, locale) => {
                    const block: BlockDTO = {
                        id: "test-id",
                        block_type: blockType,
                        settings: { foo: "bar" },
                        ordering: 0,
                    };
                    const { container } = render(
                        <BlockRenderer block={block} locale={locale} />
                    );
                    expect(container.innerHTML).toBe("");
                }),
                { numRuns: 50 }
            );
        });
    });

    describe("filterKnownBlocks returns subset of input", () => {
        it("filtered result length is always <= input length", () => {
            const blockArb = fc.record({
                id: fc.uuid(),
                block_type: fc.oneof(knownBlockTypeArb, unknownBlockTypeArb),
                settings: fc.constant({}),
                ordering: fc.nat(),
            });

            fc.assert(
                fc.property(fc.array(blockArb, { maxLength: 20 }), (blocks) => {
                    const filtered = filterKnownBlocks(blocks as BlockDTO[], "cms");
                    expect(filtered.length).toBeLessThanOrEqual(blocks.length);
                    // All filtered blocks should be known
                    for (const block of filtered) {
                        expect(isKnownBlockType(block.block_type)).toBe(true);
                    }
                }),
                { numRuns: 30 }
            );
        });
    });

    describe("isCmsBlockType and isArticleBlockType are consistent", () => {
        it("a CMS block type is always known", () => {
            fc.assert(
                fc.property(cmsBlockTypeArb, (blockType) => {
                    expect(isCmsBlockType(blockType)).toBe(true);
                    expect(isKnownBlockType(blockType)).toBe(true);
                })
            );
        });

        it("an article block type is always known", () => {
            fc.assert(
                fc.property(articleBlockTypeArb, (blockType) => {
                    expect(isArticleBlockType(blockType)).toBe(true);
                    expect(isKnownBlockType(blockType)).toBe(true);
                })
            );
        });

        it("an unknown type is never CMS or article", () => {
            fc.assert(
                fc.property(unknownBlockTypeArb, (blockType) => {
                    expect(isCmsBlockType(blockType)).toBe(false);
                    expect(isArticleBlockType(blockType)).toBe(false);
                    expect(isKnownBlockType(blockType)).toBe(false);
                }),
                { numRuns: 50 }
            );
        });
    });
});
