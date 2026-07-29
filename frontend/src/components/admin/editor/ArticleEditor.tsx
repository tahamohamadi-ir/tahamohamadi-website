"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { SlashCommandMenu } from "./SlashCommandMenu";
import { EditorToolbar } from "./EditorToolbar";
import {
    tiptapDocToArticleBlocks,
    articleBlocksToTiptapDoc,
} from "./block-converter";
import type { ArticleBlock, ArticleEditorProps } from "./types";

// ─── Component ───────────────────────────────────────────────────────────────

export function ArticleEditor({
    article,
    locale,
    onSave,
    onPreview,
}: ArticleEditorProps) {
    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const [slashMenuPos, setSlashMenuPos] = useState<{
        top: number;
        left: number;
    }>({ top: 0, left: 0 });
    const [slashQuery, setSlashQuery] = useState("");
    const editorContainerRef = useRef<HTMLDivElement>(null);

    // Build initial content from article blocks
    const initialContent = useMemo(() => {
        if (article?.blocks && article.blocks.length > 0) {
            return articleBlocksToTiptapDoc(article.blocks);
        }
        return undefined;
    }, [article?.blocks]);

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
                return false;
            },
        },
        onUpdate: ({ editor: ed }) => {
            handleSlashDetection(ed);
        },
    });

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
                    // Insert a placeholder paragraph for inline media - in production would open MediaPicker
                    editor
                        .chain()
                        .focus()
                        .insertContent({
                            type: "paragraph",
                            content: [{ type: "text", text: "[Image: Open MediaPicker to select]" }],
                        })
                        .run();
                    break;
                case "gallery":
                    editor
                        .chain()
                        .focus()
                        .insertContent({
                            type: "paragraph",
                            content: [{ type: "text", text: "[Gallery: Open MediaPicker to select]" }],
                        })
                        .run();
                    break;
                case "callout":
                    editor
                        .chain()
                        .focus()
                        .insertContent({
                            type: "blockquote",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [{ type: "text", text: "" }],
                                },
                            ],
                        })
                        .run();
                    break;
                default:
                    break;
            }

            setShowSlashMenu(false);
        },
        [editor]
    );

    // ─── Save Handler ──────────────────────────────────────────────────────────

    const handleSave = useCallback(() => {
        if (!editor || !onSave) return;
        const blocks = tiptapDocToArticleBlocks(editor.getJSON());
        onSave(blocks);
    }, [editor, onSave]);

    // ─── Preview Handler ───────────────────────────────────────────────────────

    const handlePreview = useCallback(() => {
        if (!editor || !onPreview) return;
        const blocks = tiptapDocToArticleBlocks(editor.getJSON());
        onPreview(blocks);
    }, [editor, onPreview]);

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
