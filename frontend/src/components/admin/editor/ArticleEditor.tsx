"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { MediaPicker } from "@/components/admin/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MediaAssetDTO } from "@/lib/types/media";
import { SlashCommandMenu } from "./SlashCommandMenu";
import { EditorToolbar } from "./EditorToolbar";
import {
    tiptapDocToArticleBlocks,
    articleBlocksToTiptapDoc,
} from "./block-converter";
import type { ArticleBlock, ArticleEditorProps } from "./types";

const ArticleImageNode = Node.create({
    name: "articleImage",
    group: "block",
    atom: true,
    selectable: true,
    addAttributes: () => ({
        mediaId: { default: null },
        mediaUrl: { default: null },
        alt: { default: "" },
        caption: { default: "" },
    }),
    parseHTML: () => [{ tag: "div[data-article-image]" }],
    renderHTML: () => ["div", { "data-article-image": "" }, "Selected image"],
});

const ArticleGalleryNode = Node.create({
    name: "articleGallery",
    group: "block",
    atom: true,
    selectable: true,
    addAttributes: () => ({
        mediaIds: { default: [] },
        items: { default: [] },
        layout: { default: "grid" },
    }),
    parseHTML: () => [{ tag: "div[data-article-gallery]" }],
    renderHTML: () => ["div", { "data-article-gallery": "" }, "Selected gallery"],
});

function localizedAssetText(asset: MediaAssetDTO, locale: "fa" | "en") {
    return {
        alt: locale === "fa" ? asset.alt_text_fa : asset.alt_text_en,
        caption: locale === "fa" ? asset.caption_fa : asset.caption_en,
    };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ArticleEditor({
    article,
    locale,
    onSave,
    onPreview,
    onWarningsChange,
}: ArticleEditorProps) {
    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const [slashMenuPos, setSlashMenuPos] = useState<{
        top: number;
        left: number;
    }>({ top: 0, left: 0 });
    const [slashQuery, setSlashQuery] = useState("");
    const [mediaMode, setMediaMode] = useState<"image" | "gallery" | null>(null);
    const [mediaDraft, setMediaDraft] = useState<MediaAssetDTO[]>([]);
    const [localizedAlt, setLocalizedAlt] = useState("");
    const [localizedCaption, setLocalizedCaption] = useState("");
    const [conversionWarnings, setConversionWarnings] = useState<string[]>([]);
    const editorContainerRef = useRef<HTMLDivElement>(null);

    // Build initial content from article blocks
    const initialConversion = useMemo(() => {
        return articleBlocksToTiptapDoc(
            article?.blocks.filter((block) => block.locale === locale) ?? [],
            { reportWarnings: true }
        );
    }, [article?.blocks, locale]);
    const initialContent = initialConversion.doc;

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3, 4, 5, 6] },
                codeBlock: { HTMLAttributes: { class: "editor-code-block" } },
                blockquote: { HTMLAttributes: { class: "editor-blockquote" } },
                horizontalRule: {},
                bulletList: {},
                orderedList: {},
                bold: {},
                italic: {},
                code: {},
            }),
            ArticleImageNode,
            ArticleGalleryNode,
            Placeholder.configure({
                placeholder: ({ node }) => {
                    if (node.type.name === "heading") {
                        const level = node.attrs.level;
                        return `Heading ${level}`;
                    }
                    return locale === "fa"
                        ? 'بنویسید یا "/" برای دستورات...'
                        : 'Write something or type "/" for commands...';
                },
            }),
        ],
        content: initialContent,
        editorProps: {
            attributes: {
                class: "prose prose-lg max-w-none focus:outline-none min-h-[400px] px-4 py-3",
                dir: locale === "fa" ? "rtl" : "ltr",
            },
            handleKeyDown: (_view, event) => {
                // Close slash menu on Escape
                if (event.key === "Escape" && showSlashMenu) {
                    setShowSlashMenu(false);
                    return true;
                }
                if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
                    return moveSelectedBlock(_view, event.key === "ArrowUp" ? -1 : 1);
                }
                return false;
            },
        },
        onUpdate: ({ editor: ed }) => {
            handleSlashDetection(ed);
        },
    });

    useEffect(() => {
        if (editor && initialContent) editor.commands.setContent(initialContent);
    }, [editor, initialContent]);

    useEffect(() => {
        setConversionWarnings(initialConversion.warnings);
    }, [initialConversion]);

    useEffect(() => {
        onWarningsChange?.(conversionWarnings);
    }, [conversionWarnings, onWarningsChange]);

    const openMediaPicker = useCallback((mode: "image" | "gallery") => {
        setMediaMode(mode);
        setMediaDraft([]);
        setLocalizedAlt("");
        setLocalizedCaption("");
    }, []);

    const handleMediaSelect = useCallback(
        (asset: MediaAssetDTO) => {
            setMediaDraft((current) =>
                mediaMode === "gallery"
                    ? current.some((item) => item.id === asset.id)
                        ? current
                        : [...current, asset]
                    : [asset]
            );
            const localized = localizedAssetText(asset, locale);
            setLocalizedAlt(localized.alt);
            setLocalizedCaption(localized.caption);
        },
        [locale, mediaMode]
    );

    const insertMediaBlock = useCallback(() => {
        if (!editor || !mediaMode || mediaDraft.length === 0) return;
        if (mediaMode === "image") {
            const asset = mediaDraft[0];
            editor.chain().focus().insertContent({
                type: "articleImage",
                attrs: {
                    mediaId: asset.id,
                    mediaUrl: asset.file,
                    alt: localizedAlt,
                    caption: localizedCaption,
                },
            }).run();
        } else {
            editor.chain().focus().insertContent({
                type: "articleGallery",
                attrs: {
                    mediaIds: mediaDraft.map((asset) => asset.id),
                    items: mediaDraft.map((asset) => ({
                        media_id: asset.id,
                        url: asset.file,
                        ...localizedAssetText(asset, locale),
                    })),
                    layout: "grid",
                },
            }).run();
        }
        setMediaMode(null);
        setMediaDraft([]);
    }, [editor, locale, localizedAlt, localizedCaption, mediaDraft, mediaMode]);

    // ─── Slash Command Detection ───────────────────────────────────────────────

    const handleSlashDetection = useCallback(
        (ed: Editor) => {
            const { state } = ed;
            const { $from } = state.selection;
            const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);

            const slashMatch = textBefore.match(/\/([a-zA-Z]*)$/);

            if (slashMatch) {
                setSlashQuery(slashMatch[1] ?? "");

                // Calculate position for slash menu
                const coords = ed.view.coordsAtPos($from.pos);
                const container = editorContainerRef.current;
                if (container) {
                    const rect = container.getBoundingClientRect();
                    setSlashMenuPos({
                        top: coords.bottom - rect.top + 4,
                        left: coords.left - rect.left,
                    });
                }

                setShowSlashMenu(true);
            } else {
                setShowSlashMenu(false);
            }
        },
        [showSlashMenu]
    );

    // ─── Slash Command Execution ───────────────────────────────────────────────

    const handleSlashCommand = useCallback(
        (command: string) => {
            if (!editor) return;

            // Remove the slash + query text
            const { state } = editor;
            const { $from } = state.selection;
            const textBefore = $from.parent.textContent.slice(
                0,
                $from.parentOffset
            );
            const slashIndex = textBefore.lastIndexOf("/");
            if (slashIndex >= 0) {
                const deleteFrom = $from.pos - ($from.parentOffset - slashIndex);
                editor
                    .chain()
                    .focus()
                    .deleteRange({ from: deleteFrom, to: $from.pos })
                    .run();
            }

            // Execute the command
            switch (command) {
                case "heading1":
                    editor.chain().focus().toggleHeading({ level: 1 }).run();
                    break;
                case "heading2":
                    editor.chain().focus().toggleHeading({ level: 2 }).run();
                    break;
                case "heading3":
                    editor.chain().focus().toggleHeading({ level: 3 }).run();
                    break;
                case "bulletList":
                    editor.chain().focus().toggleBulletList().run();
                    break;
                case "orderedList":
                    editor.chain().focus().toggleOrderedList().run();
                    break;
                case "blockquote":
                    editor.chain().focus().toggleBlockquote().run();
                    break;
                case "codeBlock":
                    editor.chain().focus().toggleCodeBlock().run();
                    break;
                case "divider":
                    editor.chain().focus().setHorizontalRule().run();
                    break;
                case "image":
                    openMediaPicker("image");
                    break;
                case "gallery":
                    openMediaPicker("gallery");
                    break;
                default:
                    break;
            }

            setShowSlashMenu(false);
        },
        [editor, openMediaPicker]
    );

    // ─── Save Handler ──────────────────────────────────────────────────────────

    const handleSave = useCallback(() => {
        if (!editor || !onSave) return;
        const { blocks, warnings } = tiptapDocToArticleBlocks(editor.getJSON(), locale);
        const allWarnings = [...initialConversion.warnings, ...warnings];
        setConversionWarnings(allWarnings);
        if (allWarnings.length > 0) return;
        onSave(blocks);
    }, [editor, initialConversion.warnings, locale, onSave]);

    // ─── Preview Handler ───────────────────────────────────────────────────────

    const handlePreview = useCallback(() => {
        if (!editor || !onPreview) return;
        const { blocks, warnings } = tiptapDocToArticleBlocks(editor.getJSON(), locale);
        setConversionWarnings([...initialConversion.warnings, ...warnings]);
        onPreview(blocks);
    }, [editor, initialConversion.warnings, locale, onPreview]);

    // ─── Keyboard Shortcuts (Save) ─────────────────────────────────────────────

    useEffect(() => {
        const handleKeyboard = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                handleSave();
            }
        };
        document.addEventListener("keydown", handleKeyboard);
        return () => document.removeEventListener("keydown", handleKeyboard);
    }, [handleSave]);

    if (!editor) {
        return (
            <div className="animate-pulse rounded-lg border border-border bg-muted h-96" />
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {/* Toolbar */}
            <EditorToolbar
                editor={editor}
                onSave={handleSave}
                onPreview={handlePreview}
            />

            <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => openMediaPicker("image")}>
                    Add image
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => openMediaPicker("gallery")}>
                    Add gallery
                </Button>
            </div>

            {conversionWarnings.length > 0 && (
                <div role="alert" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                    <p className="font-medium">Some editor content was not converted:</p>
                    <ul className="list-disc pl-5">
                        {conversionWarnings.map((warning) => <li key={warning}>{warning}</li>)}
                    </ul>
                </div>
            )}

            {mediaMode && (
                <section aria-label={mediaMode === "image" ? "Insert image" : "Insert gallery"} className="space-y-3 rounded-lg border border-border p-3">
                    <MediaPicker allowedTypes={["image"]} locale={locale} onSelect={handleMediaSelect} />
                    {mediaMode === "image" && mediaDraft.length > 0 && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="space-y-1 text-sm">
                                <span>Localized alt text</span>
                                <Input value={localizedAlt} onChange={(event) => setLocalizedAlt(event.target.value)} />
                            </label>
                            <label className="space-y-1 text-sm">
                                <span>Localized caption</span>
                                <Input value={localizedCaption} onChange={(event) => setLocalizedCaption(event.target.value)} />
                            </label>
                        </div>
                    )}
                    {mediaMode === "gallery" && mediaDraft.length > 0 && (
                        <p className="text-sm text-muted-foreground">{mediaDraft.length} image selected</p>
                    )}
                    <div className="flex gap-2">
                        <Button type="button" size="sm" disabled={mediaDraft.length === 0} onClick={insertMediaBlock}>
                            {mediaMode === "image" ? "Insert image" : "Insert gallery"}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setMediaMode(null)}>
                            Cancel
                        </Button>
                    </div>
                </section>
            )}

            {/* Editor Area */}
            <div
                ref={editorContainerRef}
                className="relative rounded-lg border border-border bg-background"
            >
                <EditorContent editor={editor} />

                {/* Slash Command Menu */}
                {showSlashMenu && (
                    <SlashCommandMenu
                        query={slashQuery}
                        position={slashMenuPos}
                        onSelect={handleSlashCommand}
                        onClose={() => setShowSlashMenu(false)}
                    />
                )}
            </div>
        </div>
    );
}

function moveSelectedBlock(view: Editor["view"], direction: -1 | 1): boolean {
    const { doc, selection } = view.state;
    const index = selection.$from.index(0);
    const target = index + direction;
    if (target < 0 || target >= doc.childCount) return false;

    let from = 0;
    for (let childIndex = 0; childIndex < index; childIndex += 1) {
        from += doc.child(childIndex).nodeSize;
    }
    const node = doc.child(index);
    const adjacent = doc.child(target);
    const transaction = view.state.tr.delete(from, from + node.nodeSize);
    transaction.insert(direction === -1 ? from - adjacent.nodeSize : from + adjacent.nodeSize, node);
    view.dispatch(transaction);
    view.focus();
    return true;
}
