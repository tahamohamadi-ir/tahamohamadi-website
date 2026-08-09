/**
 * Converts between Tiptap's JSON document model and ArticleBlock[] format.
 *
 * Tiptap represents content as a ProseMirror document tree (JSON).
 * The backend expects a flat array of ArticleBlock objects with typed content.
 */

import type { Locale } from "@/components/blocks/types";
import type {
    ArticleBlock,
    ArticleBlockConversionResult,
    ArticleDocConversionResult,
} from "./types";
import type { JSONContent } from "@tiptap/react";

// ─── Tiptap Document → ArticleBlock[] ────────────────────────────────────────

/**
 * Converts a Tiptap JSON document to an array of ArticleBlocks.
 */
export function tiptapDocToArticleBlocks(doc: JSONContent): ArticleBlock[];
export function tiptapDocToArticleBlocks(
    doc: JSONContent,
    locale: Locale
): ArticleBlockConversionResult;
export function tiptapDocToArticleBlocks(
    doc: JSONContent,
    locale?: Locale
): ArticleBlock[] | ArticleBlockConversionResult {
    const blocks: ArticleBlock[] = [];
    const warnings: string[] = [];
    let ordering = 0;

    if (!doc.content) return locale ? { blocks, warnings } : blocks;

    for (const [index, node] of doc.content.entries()) {
        const converted = nodeToArticleBlock(node, ordering, locale);
        if (converted) {
            blocks.push(converted);
            ordering += 1;
        } else {
            warnings.push(
                `Unsupported editor node "${node.type ?? "unknown"}" at position ${index + 1} was not converted.`
            );
        }
        if (converted && containsInlineMarks(node)) {
            warnings.push(
                `Inline formatting in editor node "${node.type ?? "unknown"}" at position ${index + 1} cannot be preserved.`
            );
        }
    }

    return locale ? { blocks, warnings } : blocks;
}

/**
 * Converts a single Tiptap node to an ArticleBlock (or null if not mappable).
 */
function nodeToArticleBlock(
    node: JSONContent,
    ordering: number,
    locale?: Locale
): ArticleBlock | null {
    const localized = locale ? { locale } : {};
    switch (node.type) {
        case "paragraph":
            return {
                block_type: "paragraph",
                content: { text: extractText(node) },
                ...localized,
                ordering,
            };

        case "heading":
            return {
                block_type: "heading",
                content: {
                    text: extractText(node),
                    level: node.attrs?.level ?? 2,
                },
                ...localized,
                ordering,
            };

        case "bulletList":
            return {
                block_type: "list",
                content: {
                    items: extractListItems(node),
                    ordered: false,
                },
                ...localized,
                ordering,
            };

        case "orderedList":
            return {
                block_type: "list",
                content: {
                    items: extractListItems(node),
                    ordered: true,
                },
                ...localized,
                ordering,
            };

        case "blockquote":
            return {
                block_type: "quote",
                content: {
                    text: extractBlockquoteText(node),
                },
                ...localized,
                ordering,
            };

        case "codeBlock":
            return {
                block_type: "code",
                content: {
                    code: extractText(node),
                    language: node.attrs?.language ?? undefined,
                },
                ...localized,
                ordering,
            };

        case "horizontalRule":
            return {
                block_type: "divider",
                content: { style: "line" },
                ...localized,
                ordering,
            };

        case "articleImage":
            if (typeof node.attrs?.mediaId !== "string" || !node.attrs.mediaId) {
                return null;
            }
            return {
                block_type: "image",
                content: { media_id: node.attrs.mediaId },
                ...localized,
                ordering,
            };

        case "articleGallery": {
            const mediaIds = Array.isArray(node.attrs?.mediaIds)
                ? node.attrs.mediaIds.filter((value): value is string => typeof value === "string")
                : [];
            if (mediaIds.length === 0) return null;
            return {
                block_type: "gallery",
                content: {
                    media_ids: mediaIds,
                    layout: node.attrs?.layout === "carousel" ? "carousel" : "grid",
                },
                ...localized,
                ordering,
            };
        }

        default:
            return null;
    }
}

// ─── ArticleBlock[] → Tiptap Document ────────────────────────────────────────

/**
 * Converts ArticleBlock[] back to a Tiptap-compatible JSON document.
 */
export function articleBlocksToTiptapDoc(blocks: ArticleBlock[]): JSONContent;
export function articleBlocksToTiptapDoc(
    blocks: ArticleBlock[],
    options: { reportWarnings: true }
): ArticleDocConversionResult;
export function articleBlocksToTiptapDoc(
    blocks: ArticleBlock[],
    options?: { reportWarnings: true }
): JSONContent | ArticleDocConversionResult {
    const content: JSONContent[] = [];
    const warnings: string[] = [];

    for (const [index, block] of blocks.entries()) {
        if (
            options?.reportWarnings &&
            ["callout", "reference", "caption"].includes(block.block_type)
        ) {
            warnings.push(
                `Article block "${block.block_type}" at position ${index + 1} cannot be edited losslessly.`
            );
            continue;
        }
        const node = articleBlockToNode(block);
        if (node) {
            content.push(node);
        } else if (options?.reportWarnings) {
            warnings.push(
                `Article block "${block.block_type}" at position ${index + 1} cannot be edited losslessly.`
            );
        }
    }

    const doc: JSONContent = {
        type: "doc",
        content: content.length > 0 ? content : [{ type: "paragraph" }],
    };
    return options?.reportWarnings ? { doc, warnings } : doc;
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
            return {
                type: "articleImage",
                attrs: { mediaId: c.media_id ?? null },
            };

        case "gallery":
            return {
                type: "articleGallery",
                attrs: {
                    mediaIds: Array.isArray(c.media_ids) ? c.media_ids : [],
                    layout: c.layout === "carousel" ? "carousel" : "grid",
                },
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

function containsInlineMarks(node: JSONContent): boolean {
    if (node.marks && node.marks.length > 0) return true;
    return node.content?.some(containsInlineMarks) ?? false;
}
