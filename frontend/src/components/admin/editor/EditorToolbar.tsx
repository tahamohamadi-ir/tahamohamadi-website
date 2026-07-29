"use client";

import { useCallback } from "react";
import type { Editor } from "@tiptap/react";

// ─── Props ───────────────────────────────────────────────────────────────────

interface EditorToolbarProps {
    editor: Editor;
    onSave?: () => void;
    onPreview?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EditorToolbar({ editor, onSave, onPreview }: EditorToolbarProps) {
    const buttonClass = useCallback(
        (isActive: boolean) =>
            `px-2 py-1.5 rounded text-sm font-medium transition-colors ${isActive
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent text-foreground"
            }`,
        []
    );

    return (
        <div
            className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5"
            role="toolbar"
            aria-label="Text formatting"
        >
            {/* Text formatting */}
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={buttonClass(editor.isActive("bold"))}
                aria-label="Bold (Ctrl+B)"
                title="Bold (Ctrl+B)"
            >
                <span className="font-bold">B</span>
            </button>

            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={buttonClass(editor.isActive("italic"))}
                aria-label="Italic (Ctrl+I)"
                title="Italic (Ctrl+I)"
            >
                <span className="italic">I</span>
            </button>

            <button
                type="button"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={buttonClass(editor.isActive("code"))}
                aria-label="Inline Code (Ctrl+E)"
                title="Inline Code (Ctrl+E)"
            >
                <span className="font-mono text-xs">&lt;/&gt;</span>
            </button>

            <div className="mx-1 h-6 w-px bg-border" aria-hidden="true" />

            {/* Block types */}
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={buttonClass(editor.isActive("heading", { level: 1 }))}
                aria-label="Heading 1"
                title="Heading 1"
            >
                H1
            </button>

            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={buttonClass(editor.isActive("heading", { level: 2 }))}
                aria-label="Heading 2"
                title="Heading 2"
            >
                H2
            </button>

            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={buttonClass(editor.isActive("heading", { level: 3 }))}
                aria-label="Heading 3"
                title="Heading 3"
            >
                H3
            </button>

            <div className="mx-1 h-6 w-px bg-border" aria-hidden="true" />

            {/* Lists */}
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={buttonClass(editor.isActive("bulletList"))}
                aria-label="Bullet List"
                title="Bullet List"
            >
                •&thinsp;List
            </button>

            <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={buttonClass(editor.isActive("orderedList"))}
                aria-label="Numbered List"
                title="Numbered List"
            >
                1.&thinsp;List
            </button>

            <div className="mx-1 h-6 w-px bg-border" aria-hidden="true" />

            {/* Block elements */}
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={buttonClass(editor.isActive("blockquote"))}
                aria-label="Quote"
                title="Quote"
            >
                ❝
            </button>

            <button
                type="button"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={buttonClass(editor.isActive("codeBlock"))}
                aria-label="Code Block"
                title="Code Block"
            >
                {"{ }"}
            </button>

            <button
                type="button"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                className={buttonClass(false)}
                aria-label="Divider"
                title="Divider"
            >
                —
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Actions */}
            {onPreview && (
                <button
                    type="button"
                    onClick={onPreview}
                    className="px-3 py-1.5 rounded text-sm font-medium border border-border hover:bg-accent transition-colors"
                    aria-label="Preview"
                >
                    Preview
                </button>
            )}

            {onSave && (
                <button
                    type="button"
                    onClick={onSave}
                    className="px-3 py-1.5 rounded text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    aria-label="Save (Ctrl+S)"
                >
                    Save
                </button>
            )}
        </div>
    );
}
