import { describe, it, expect } from "vitest";
import {
    tiptapDocToArticleBlocks,
    articleBlocksToTiptapDoc,
} from "./block-converter";
import type { ArticleBlock } from "./types";
import type { JSONContent } from "@tiptap/react";

describe("tiptapDocToArticleBlocks", () => {
    it("preserves the editing locale and reports unsupported nodes instead of dropping them silently", () => {
        const doc: JSONContent = {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [{ type: "text", text: "Locale-owned copy" }],
                },
                {
                    type: "youtube",
                    attrs: { src: "https://example.com/embed" },
                },
            ],
        };

        const result = tiptapDocToArticleBlocks(doc, "fa") as unknown as {
            blocks: ArticleBlock[];
            warnings: string[];
        };

        expect(result.blocks).toEqual([
            {
                block_type: "paragraph",
                content: { text: "Locale-owned copy" },
                locale: "fa",
                ordering: 0,
            },
        ]);
        expect(result.warnings).toEqual([
            'Unsupported editor node "youtube" at position 2 was not converted.',
        ]);
    });

    it("converts a paragraph node", () => {
        const doc: JSONContent = {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [{ type: "text", text: "Hello world" }],
                },
            ],
        };

        const blocks = tiptapDocToArticleBlocks(doc);
        expect(blocks).toHaveLength(1);
        expect(blocks[0]).toEqual({
            block_type: "paragraph",
            content: { text: "Hello world" },
            ordering: 0,
        });
    });

    it("converts a heading node", () => {
        const doc: JSONContent = {
            type: "doc",
            content: [
                {
                    type: "heading",
                    attrs: { level: 2 },
                    content: [{ type: "text", text: "Section Title" }],
                },
            ],
        };

        const blocks = tiptapDocToArticleBlocks(doc);
        expect(blocks).toHaveLength(1);
        expect(blocks[0]).toEqual({
            block_type: "heading",
            content: { text: "Section Title", level: 2 },
            ordering: 0,
        });
    });

    it("converts a bullet list node", () => {
        const doc: JSONContent = {
            type: "doc",
            content: [
                {
                    type: "bulletList",
                    content: [
                        {
                            type: "listItem",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [{ type: "text", text: "Item 1" }],
                                },
                            ],
                        },
                        {
                            type: "listItem",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [{ type: "text", text: "Item 2" }],
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        const blocks = tiptapDocToArticleBlocks(doc);
        expect(blocks).toHaveLength(1);
        expect(blocks[0]).toEqual({
            block_type: "list",
            content: { items: ["Item 1", "Item 2"], ordered: false },
            ordering: 0,
        });
    });

    it("converts an ordered list node", () => {
        const doc: JSONContent = {
            type: "doc",
            content: [
                {
                    type: "orderedList",
                    content: [
                        {
                            type: "listItem",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [{ type: "text", text: "First" }],
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        const blocks = tiptapDocToArticleBlocks(doc);
        expect(blocks[0].block_type).toBe("list");
        expect(blocks[0].content).toEqual({ items: ["First"], ordered: true });
    });

    it("converts a blockquote node", () => {
        const doc: JSONContent = {
            type: "doc",
            content: [
                {
                    type: "blockquote",
                    content: [
                        {
                            type: "paragraph",
                            content: [{ type: "text", text: "A wise quote" }],
                        },
                    ],
                },
            ],
        };

        const blocks = tiptapDocToArticleBlocks(doc);
        expect(blocks[0]).toEqual({
            block_type: "quote",
            content: { text: "A wise quote" },
            ordering: 0,
        });
    });

    it("converts a code block node", () => {
        const doc: JSONContent = {
            type: "doc",
            content: [
                {
                    type: "codeBlock",
                    attrs: { language: "typescript" },
                    content: [{ type: "text", text: "const x = 1;" }],
                },
            ],
        };

        const blocks = tiptapDocToArticleBlocks(doc);
        expect(blocks[0]).toEqual({
            block_type: "code",
            content: { code: "const x = 1;", language: "typescript" },
            ordering: 0,
        });
    });

    it("converts a horizontal rule node", () => {
        const doc: JSONContent = {
            type: "doc",
            content: [{ type: "horizontalRule" }],
        };

        const blocks = tiptapDocToArticleBlocks(doc);
        expect(blocks[0]).toEqual({
            block_type: "divider",
            content: { style: "line" },
            ordering: 0,
        });
    });

    it("preserves ordering across multiple blocks", () => {
        const doc: JSONContent = {
            type: "doc",
            content: [
                {
                    type: "heading",
                    attrs: { level: 1 },
                    content: [{ type: "text", text: "Title" }],
                },
                {
                    type: "paragraph",
                    content: [{ type: "text", text: "Body text" }],
                },
                { type: "horizontalRule" },
            ],
        };

        const blocks = tiptapDocToArticleBlocks(doc);
        expect(blocks).toHaveLength(3);
        expect(blocks[0].ordering).toBe(0);
        expect(blocks[1].ordering).toBe(1);
        expect(blocks[2].ordering).toBe(2);
    });

    it("returns empty array for empty doc", () => {
        const doc: JSONContent = { type: "doc" };
        expect(tiptapDocToArticleBlocks(doc)).toEqual([]);
    });
});

describe("articleBlocksToTiptapDoc", () => {
    it("converts paragraph blocks back to doc", () => {
        const blocks: ArticleBlock[] = [
            { block_type: "paragraph", content: { text: "Hello" }, ordering: 0 },
        ];

        const doc = articleBlocksToTiptapDoc(blocks);
        expect(doc.type).toBe("doc");
        expect(doc.content).toHaveLength(1);
        expect(doc.content![0].type).toBe("paragraph");
        expect(doc.content![0].content).toEqual([{ type: "text", text: "Hello" }]);
    });

    it("converts heading blocks", () => {
        const blocks: ArticleBlock[] = [
            {
                block_type: "heading",
                content: { text: "Title", level: 3 },
                ordering: 0,
            },
        ];

        const doc = articleBlocksToTiptapDoc(blocks);
        expect(doc.content![0].type).toBe("heading");
        expect(doc.content![0].attrs?.level).toBe(3);
    });

    it("converts list blocks", () => {
        const blocks: ArticleBlock[] = [
            {
                block_type: "list",
                content: { items: ["A", "B"], ordered: true },
                ordering: 0,
            },
        ];

        const doc = articleBlocksToTiptapDoc(blocks);
        expect(doc.content![0].type).toBe("orderedList");
        expect(doc.content![0].content).toHaveLength(2);
    });

    it("converts quote blocks to blockquote", () => {
        const blocks: ArticleBlock[] = [
            { block_type: "quote", content: { text: "Wise words" }, ordering: 0 },
        ];

        const doc = articleBlocksToTiptapDoc(blocks);
        expect(doc.content![0].type).toBe("blockquote");
    });

    it("converts code blocks", () => {
        const blocks: ArticleBlock[] = [
            {
                block_type: "code",
                content: { code: "print('hi')", language: "python" },
                ordering: 0,
            },
        ];

        const doc = articleBlocksToTiptapDoc(blocks);
        expect(doc.content![0].type).toBe("codeBlock");
        expect(doc.content![0].attrs?.language).toBe("python");
        expect(doc.content![0].content![0].text).toBe("print('hi')");
    });

    it("converts divider blocks", () => {
        const blocks: ArticleBlock[] = [
            { block_type: "divider", content: { style: "line" }, ordering: 0 },
        ];

        const doc = articleBlocksToTiptapDoc(blocks);
        expect(doc.content![0].type).toBe("horizontalRule");
    });

    it("returns doc with empty paragraph when no blocks", () => {
        const doc = articleBlocksToTiptapDoc([]);
        expect(doc.content).toHaveLength(1);
        expect(doc.content![0].type).toBe("paragraph");
    });

    it("roundtrips paragraph → doc → paragraph", () => {
        const original: ArticleBlock[] = [
            { block_type: "paragraph", content: { text: "Roundtrip" }, ordering: 0 },
            {
                block_type: "heading",
                content: { text: "Title", level: 2 },
                ordering: 1,
            },
        ];

        const doc = articleBlocksToTiptapDoc(original);
        const result = tiptapDocToArticleBlocks(doc);
        expect(result).toEqual(original);
    });
});
