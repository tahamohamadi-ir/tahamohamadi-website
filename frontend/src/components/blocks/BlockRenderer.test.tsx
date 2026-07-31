import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
    BlockRenderer,
    isCmsBlockType,
    isArticleBlockType,
    isKnownBlockType,
    filterKnownBlocks,
} from "./BlockRenderer";
import type { BlockDTO } from "./types";

describe("BlockRenderer", () => {
    describe("CMS block dispatch", () => {
        it("renders HeroBlock for block_type='hero'", () => {
            const block: BlockDTO = {
                id: "1",
                block_type: "hero",
                settings: { title: "Welcome", subtitle: "A test subtitle" },
                ordering: 0,
            };
            render(<BlockRenderer block={block} locale="en" />);
            expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Welcome");
        });

        it("does not render a Hero CTA with an unsafe URL", () => {
            const block: BlockDTO = {
                id: "unsafe-hero",
                block_type: "hero",
                settings: {
                    title: "Safe content",
                    cta_label: "Unsafe action",
                    cta_url: "javascript:alert(1)",
                },
                ordering: 0,
            };

            render(<BlockRenderer block={block} locale="en" />);

            expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Safe content");
            expect(screen.queryByRole("link", { name: "Unsafe action" })).not.toBeInTheDocument();
        });

        it("keeps an internal Hero CTA inside the active locale", () => {
            const block: BlockDTO = {
                id: "localized-hero",
                block_type: "hero",
                settings: {
                    title: "طاها محمدی",
                    cta_label: "درباره من",
                    cta_url: "/about",
                },
                ordering: 0,
            };

            render(<BlockRenderer block={block} locale="fa" />);

            expect(screen.getByRole("link", { name: "درباره من" })).toHaveAttribute("href", "/fa/about");
        });

        it("renders TextBlock for block_type='text'", () => {
            const block: BlockDTO = {
                id: "2",
                block_type: "text",
                settings: { content: "<p>Hello world</p>", alignment: "start" },
                ordering: 1,
            };
            const { container } = render(<BlockRenderer block={block} locale="en" />);
            expect(container.querySelector(".prose")).toBeInTheDocument();
        });

        it("renders QuoteBlock for block_type='quote'", () => {
            const block: BlockDTO = {
                id: "3",
                block_type: "quote",
                settings: { text: "Some insightful quote", author: "Author" },
                ordering: 2,
            };
            render(<BlockRenderer block={block} locale="en" />);
            expect(screen.getByText("Some insightful quote")).toBeInTheDocument();
            expect(screen.getByText("Author")).toBeInTheDocument();
        });

        it("renders CtaBlock for block_type='cta'", () => {
            const block: BlockDTO = {
                id: "4",
                block_type: "cta",
                settings: { label: "Click Me", url: "/contact", variant: "primary" },
                ordering: 3,
            };
            render(<BlockRenderer block={block} locale="en" />);
            expect(screen.getByText("Click Me")).toBeInTheDocument();
        });

        it("renders DividerBlock for block_type='divider'", () => {
            const block: BlockDTO = {
                id: "5",
                block_type: "divider",
                settings: { style: "line" },
                ordering: 4,
            };
            const { container } = render(<BlockRenderer block={block} locale="en" />);
            expect(container.querySelector("hr")).toBeInTheDocument();
        });

        it("renders ResearchFocusBlock for block_type='research_focus'", () => {
            const block: BlockDTO = {
                id: "6",
                block_type: "research_focus",
                settings: {
                    title: "Research Areas",
                    areas: [{ name: "AI", description: "Machine learning" }],
                },
                ordering: 5,
            };
            render(<BlockRenderer block={block} locale="en" />);
            expect(screen.getByText("Research Areas")).toBeInTheDocument();
            expect(screen.getByText("AI")).toBeInTheDocument();
        });
    });

    describe("Article block dispatch", () => {
        it("renders ParagraphBlock for block_type='paragraph'", () => {
            const block: BlockDTO = {
                id: "10",
                block_type: "paragraph",
                content: { text: "A paragraph of text" },
                ordering: 0,
            };
            render(<BlockRenderer block={block} locale="en" context="article" />);
            expect(screen.getByText("A paragraph of text")).toBeInTheDocument();
        });

        it("renders HeadingBlock for block_type='heading'", () => {
            const block: BlockDTO = {
                id: "11",
                block_type: "heading",
                content: { text: "Section Title", level: 2 },
                ordering: 1,
            };
            render(<BlockRenderer block={block} locale="en" context="article" />);
            expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Section Title");
        });

        it("renders CodeBlock for block_type='code'", () => {
            const block: BlockDTO = {
                id: "12",
                block_type: "code",
                content: { code: "console.log('hello')", language: "javascript" },
                ordering: 2,
            };
            render(<BlockRenderer block={block} locale="en" context="article" />);
            expect(screen.getByText("console.log('hello')")).toBeInTheDocument();
        });

        it("renders CalloutBlock for block_type='callout'", () => {
            const block: BlockDTO = {
                id: "13",
                block_type: "callout",
                content: { text: "Important note", type: "warning" },
                ordering: 3,
            };
            render(<BlockRenderer block={block} locale="en" context="article" />);
            expect(screen.getByText("Important note")).toBeInTheDocument();
        });

        it("renders ReferenceBlock for block_type='reference'", () => {
            const block: BlockDTO = {
                id: "14",
                block_type: "reference",
                content: { text: "Smith et al.", url: "https://example.com", year: 2023 },
                ordering: 4,
            };
            render(<BlockRenderer block={block} locale="en" context="article" />);
            expect(screen.getByText("Smith et al.")).toBeInTheDocument();
            expect(screen.getByText("2023")).toBeInTheDocument();
        });
    });

    describe("Fail-closed behavior", () => {
        it("returns null for unknown block_type", () => {
            const block: BlockDTO = {
                id: "99",
                block_type: "unknown_type",
                settings: { foo: "bar" },
                ordering: 0,
            };
            const { container } = render(<BlockRenderer block={block} locale="en" />);
            expect(container.innerHTML).toBe("");
        });

        it("returns null for empty block_type", () => {
            const block: BlockDTO = {
                id: "100",
                block_type: "",
                settings: {},
                ordering: 0,
            };
            const { container } = render(<BlockRenderer block={block} locale="en" />);
            expect(container.innerHTML).toBe("");
        });
    });

    describe("RTL/LTR locale handling", () => {
        it("passes locale='fa' to CMS blocks for RTL rendering", () => {
            const block: BlockDTO = {
                id: "20",
                block_type: "quote",
                settings: { text: "یک نقل قول", author: "نویسنده" },
                ordering: 0,
            };
            const { container } = render(<BlockRenderer block={block} locale="fa" />);
            const blockquote = container.querySelector("blockquote");
            expect(blockquote).toHaveAttribute("dir", "rtl");
            expect(blockquote).toHaveClass("border-r-4");
        });

        it("passes locale='en' to CMS blocks for LTR rendering", () => {
            const block: BlockDTO = {
                id: "21",
                block_type: "quote",
                settings: { text: "A quote", author: "Author" },
                ordering: 0,
            };
            const { container } = render(<BlockRenderer block={block} locale="en" />);
            const blockquote = container.querySelector("blockquote");
            expect(blockquote).toHaveAttribute("dir", "ltr");
            expect(blockquote).toHaveClass("border-l-4");
        });
    });

    describe("Context-aware data passing", () => {
        it("passes block.settings as data for cms context", () => {
            const block: BlockDTO = {
                id: "30",
                block_type: "hero",
                settings: { title: "From Settings" },
                content: { title: "From Content" },
                ordering: 0,
            };
            render(<BlockRenderer block={block} locale="en" context="cms" />);
            expect(screen.getByRole("heading")).toHaveTextContent("From Settings");
        });

        it("passes block.content as data for article context", () => {
            const block: BlockDTO = {
                id: "31",
                block_type: "paragraph",
                settings: { text: "From Settings" },
                content: { text: "From Content" },
                ordering: 0,
            };
            render(<BlockRenderer block={block} locale="en" context="article" />);
            expect(screen.getByText("From Content")).toBeInTheDocument();
        });
    });
});

describe("Utility functions", () => {
    describe("isCmsBlockType", () => {
        it("returns true for known CMS types", () => {
            expect(isCmsBlockType("hero")).toBe(true);
            expect(isCmsBlockType("text")).toBe(true);
            expect(isCmsBlockType("gallery")).toBe(true);
            expect(isCmsBlockType("cta")).toBe(true);
            expect(isCmsBlockType("collection")).toBe(true);
            expect(isCmsBlockType("quote")).toBe(true);
            expect(isCmsBlockType("divider")).toBe(true);
            expect(isCmsBlockType("research_focus")).toBe(true);
        });

        it("returns false for article-only types", () => {
            expect(isCmsBlockType("paragraph")).toBe(false);
            expect(isCmsBlockType("heading")).toBe(false);
            expect(isCmsBlockType("code")).toBe(false);
        });

        it("returns false for unknown types", () => {
            expect(isCmsBlockType("unknown")).toBe(false);
        });
    });

    describe("isArticleBlockType", () => {
        it("returns true for known article types", () => {
            expect(isArticleBlockType("paragraph")).toBe(true);
            expect(isArticleBlockType("heading")).toBe(true);
            expect(isArticleBlockType("list")).toBe(true);
            expect(isArticleBlockType("image")).toBe(true);
            expect(isArticleBlockType("code")).toBe(true);
            expect(isArticleBlockType("callout")).toBe(true);
            expect(isArticleBlockType("reference")).toBe(true);
        });

        it("returns false for unknown types", () => {
            expect(isArticleBlockType("hero")).toBe(false);
            expect(isArticleBlockType("unknown")).toBe(false);
        });
    });

    describe("isKnownBlockType", () => {
        it("returns true for both CMS and article types", () => {
            expect(isKnownBlockType("hero")).toBe(true);
            expect(isKnownBlockType("paragraph")).toBe(true);
        });

        it("returns false for unknown types", () => {
            expect(isKnownBlockType("doesnt_exist")).toBe(false);
        });
    });

    describe("filterKnownBlocks", () => {
        it("filters out unknown block types", () => {
            const blocks: BlockDTO[] = [
                { id: "1", block_type: "hero", settings: {}, ordering: 0 },
                { id: "2", block_type: "unknown_stuff", settings: {}, ordering: 1 },
                { id: "3", block_type: "text", settings: {}, ordering: 2 },
            ];
            const filtered = filterKnownBlocks(blocks, "cms");
            expect(filtered).toHaveLength(2);
            expect(filtered[0].block_type).toBe("hero");
            expect(filtered[1].block_type).toBe("text");
        });

        it("filters article blocks by article registry", () => {
            const blocks: BlockDTO[] = [
                { id: "1", block_type: "paragraph", content: {}, ordering: 0 },
                { id: "2", block_type: "hero", settings: {}, ordering: 1 },
                { id: "3", block_type: "heading", content: {}, ordering: 2 },
            ];
            const filtered = filterKnownBlocks(blocks, "article");
            expect(filtered).toHaveLength(2);
            expect(filtered[0].block_type).toBe("paragraph");
            expect(filtered[1].block_type).toBe("heading");
        });

        it("returns empty array when all blocks are unknown", () => {
            const blocks: BlockDTO[] = [
                { id: "1", block_type: "nonexistent", settings: {}, ordering: 0 },
            ];
            expect(filterKnownBlocks(blocks)).toHaveLength(0);
        });
    });
});
