/**
 * Converts between Tiptap's JSON document model and ArticleBlock[] format.
 *
 * Tiptap represents content as a ProseMirror document tree (JSON).
 * The backend expects a flat array of ArticleBlock objects with typed content.
 */

import type { ArticleBlock } from "./types";
import type { JSONContent } from "@tiptap/react";

// ─── Tiptap Document → ArticleBlock[] ────────────────────────────────────────

/**
 * Converts a Tiptap JSON document to an array of ArticleBlocks.
 */
export function tiptapDocToArticleBlocks(doc: JSONContent): ArticleBlock[] {
    const blocks: ArticleBlock[] = [];
    let ordering = 0;

    if (!doc.content) return blocks;

    for (const node of doc.content) {
        const converted = nodeToArticleBlock(node, ordering);
        if (converted) {
            blocks.push(converted);
            ordering += 1;
        }
    }

    return blocks;
}

/**
 * Converts a single Tiptap node to an ArticleBlock (or null if not mappable).
 */
function nodeToArticleBlock(
    node: JSONContent,
    ordering: number
): ArticleBlock | null {
    switch (node.type) {
        case "paragraph":
            return {
                block_type: "paragraph",
                content: { text: extractText(node) },
                ordering,
            };

        case "heading":
            return {
                block_type: "heading",
                content: {
                    text: extractText(node),
                    level: node.attrs?.level ?? 2,
                },
                ordering,
            };

        case "bulletList":
            return {
                block_type: "list",
                content: {
                    items: extractListItems(node),
                    ordered: false,
                },
                ordering,
            };

        case "orderedList":
            return {
                block_type: "list",
                content: {
                    items: extractListItems(node),
                    ordered: true,
                },
                ordering,
            };

        case "blockquote":
            return {
                block_type: "quote",
                content: {
                    text: extractBlockquoteText(node),
                },
                ordering,
            };

        case "codeBlock":
            return {
                block_type: "code",
                content: {
                    code: extractText(node),
                    language: node.attrs?.language ?? undefined,
                },
                ordering,
            };

        case "horizontalRule":
            return {
                block_type: "divider",
                content: { style: "line" },
                ordering,
            };

        default:
            return null;
    }
}

// ─── ArticleBlock[] → Tiptap Document ────────────────────────────────────────

/**
 * Converts ArticleBlock[] back to a Tiptap-compatible JSON document.
 */
export function articleBlocksToTiptapDoc(blocks: ArticleBlock[]): JSONContent {
    const content: JSONContent[] = [];

    for (const block of blocks) {
        const node = articleBlockToNode(block);
        if (node) {
            content.push(node);
        }
    }

    return {
        type: "doc",
        content: content.length > 0 ? content : [{ type: "paragraph" }],
    };
}

/**
 * Converts a single ArticleBlock to a Tiptap node.
 */
function articleBlockToNode(block: ArticleBlock): JSONContent | null {
    const c = block.content;

    switch (block.block_type) {
        case "paragraph":
            return {
                type: "paragraph",
                content: textToContent(c.text as string),
            };

        case "heading":
            return {
                type: "heading",
                attrs: { level: (c.level as number) ?? 2 },
                content: textToContent(c.text as string),
            };

        case "list": {
            const items = (c.items as string[]) ?? [];
            const ordered = (c.ordered as boolean) ?? false;
            return {
                type: ordered ? "orderedList" : "bulletList",
                content: items.map((item) => ({
                    type: "listItem",
                    content: [
                        {
                            type: "paragraph",
                            content: item ? [{ type: "text", text: item }] : [],
                        },
                    ],
                })),
            };
        }

        case "quote":
            return {
                type: "blockquote",
                content: [
                    {
                        type: "paragraph",
                        content: textToContent(c.text as string),
                    },
                ],
            };

        case "code":
            return {
                type: "codeBlock",
                attrs: { language: (c.language as string) ?? null },
                content: (c.code as string)
                    ? [{ type: "text", text: c.code as string }]
                    : [],
            };

        case "divider":
            return { type: "horizontalRule" };

        case "image":
            // Represent as a paragraph with placeholder text (images need custom node)
            return {
                type: "paragraph",
                content: [
                    {
                        type: "text",
                        text: `[Image: ${(c.alt as string) || (c.url as string) || "media"}]`,
                    },
                ],
            };

        case "gallery":
            return {
                type: "paragraph",
                content: [{ type: "text", text: "[Gallery]" }],
            };

        case "callout":
            return {
                type: "blockquote",
                content: [
                    {
                        type: "paragraph",
                        content: textToContent(c.text as string),
                    },
                ],
            };

        case "caption":
            return {
                type: "paragraph",
                content: textToContent(c.text as string),
            };

        case "reference":
            return {
                type: "paragraph",
                content: textToContent(c.text as string),
            };

        default:
            return null;
    }
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function extractText(node: JSONContent): string {
    if (!node.content) return "";
    return node.content
        .map((child) => {
            if (child.type === "text") return child.text ?? "";
            if (child.content) return extractText(child);
            return "";
        })
        .join("");
}

function extractListItems(node: JSONContent): string[] {
    if (!node.content) return [];
    return node.content.map((listItem) => {
        if (listItem.content) {
            return listItem.content.map((p) => extractText(p)).join("\n");
        }
        return "";
    });
}

function extractBlockquoteText(node: JSONContent): string {
    if (!node.content) return "";
    return node.content.map((child) => extractText(child)).join("\n");
}

function textToContent(text: string | undefined | null): JSONContent[] {
    if (!text) return [];
    return [{ type: "text", text }];
}
