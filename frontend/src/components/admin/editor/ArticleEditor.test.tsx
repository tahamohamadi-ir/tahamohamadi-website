import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArticleEditor } from "./ArticleEditor";
import type { ArticleBlock } from "./types";

const { editorDocument } = vi.hoisted(() => ({
    editorDocument: { type: "doc", content: [] as Array<Record<string, unknown>> },
}));

vi.mock("@tiptap/react", () => ({
    EditorContent: () => <div data-testid="editor-content" />,
    useEditor: () => {
        const chain = {
            focus: () => chain,
            deleteRange: () => chain,
            toggleHeading: () => chain,
            toggleBulletList: () => chain,
            toggleOrderedList: () => chain,
            toggleBlockquote: () => chain,
            toggleCodeBlock: () => chain,
            setHorizontalRule: () => chain,
            insertContent: (node: Record<string, unknown>) => {
                editorDocument.content.push(node);
                return chain;
            },
            run: () => true,
        };
        return {
            chain: () => chain,
            commands: { setContent: vi.fn() },
            getJSON: () => editorDocument,
            state: {
                selection: {
                    $from: { parent: { textContent: "" }, parentOffset: 0, pos: 0 },
                },
            },
            view: { coordsAtPos: () => ({ bottom: 0, left: 0 }) },
        };
    },
}));

vi.mock("./EditorToolbar", () => ({
    EditorToolbar: ({ onSave, onPreview }: { onSave: () => void; onPreview: () => void }) => (
        <div>
            <button type="button" onClick={onSave}>Save article blocks</button>
            <button type="button" onClick={onPreview}>Preview article blocks</button>
        </div>
    ),
}));

vi.mock("@/components/admin/media", () => ({
    MediaPicker: ({ onSelect }: { onSelect: (asset: Record<string, unknown>) => void }) => (
        <button
            type="button"
            onClick={() =>
                onSelect({
                    id: "11111111-2222-4333-8444-555555555555",
                    file: "/media/photo.jpg",
                    original_filename: "photo.jpg",
                    mime_type: "image/jpeg",
                    file_size: 1200,
                    width: 1200,
                    height: 800,
                    alt_text_fa: "متن جایگزین فارسی",
                    alt_text_en: "English alt",
                    caption_fa: "شرح فارسی",
                    caption_en: "English caption",
                    status: "active",
                    checksum: "checksum",
                    created_at: "2026-08-08T00:00:00Z",
                    updated_at: "2026-08-08T00:00:00Z",
                })
            }
        >
            Choose library image
        </button>
    ),
}));

describe("ArticleEditor media authoring", () => {
    beforeEach(() => {
        editorDocument.content = [];
    });

    it("uses Media Library metadata without exposing article-local text controls that cannot persist", async () => {
        const onSave = vi.fn<(blocks: ArticleBlock[]) => void>();
        const user = userEvent.setup();
        render(<ArticleEditor article={{ blocks: [] }} locale="fa" onSave={onSave} />);

        await user.click(screen.getByRole("button", { name: "Add image" }));
        expect(screen.queryByLabelText(/UUID/i)).not.toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Choose library image" }));

        expect(screen.queryByLabelText("Localized alt text")).not.toBeInTheDocument();
        expect(screen.queryByLabelText("Localized caption")).not.toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Insert image" }));
        await user.click(screen.getByRole("button", { name: "Save article blocks" }));

        expect(onSave).toHaveBeenCalledWith([
            {
                block_type: "image",
                content: { media_id: "11111111-2222-4333-8444-555555555555" },
                locale: "fa",
                ordering: 0,
            },
        ]);
    });

    it("builds a gallery from MediaPicker selections without a raw media ID control", async () => {
        const onSave = vi.fn<(blocks: ArticleBlock[]) => void>();
        const user = userEvent.setup();
        render(<ArticleEditor article={{ blocks: [] }} locale="en" onSave={onSave} />);

        await user.click(screen.getByRole("button", { name: "Add gallery" }));
        expect(screen.queryByLabelText(/UUID/i)).not.toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Choose library image" }));
        await user.click(screen.getByRole("button", { name: "Insert gallery" }));
        await user.click(screen.getByRole("button", { name: "Save article blocks" }));

        expect(onSave).toHaveBeenCalledWith([
            {
                block_type: "gallery",
                content: {
                    media_ids: ["11111111-2222-4333-8444-555555555555"],
                    layout: "grid",
                },
                locale: "en",
                ordering: 0,
            },
        ]);
    });

    it("blocks save when inline formatting would be lost", async () => {
        editorDocument.content = [
            {
                type: "paragraph",
                content: [{ type: "text", text: "Styled", marks: [{ type: "bold" }] }],
            },
        ];
        const onSave = vi.fn<(blocks: ArticleBlock[]) => void>();
        render(<ArticleEditor article={{ blocks: [] }} locale="en" onSave={onSave} />);

        await userEvent.click(screen.getByRole("button", { name: "Save article blocks" }));

        expect(onSave).not.toHaveBeenCalled();
        expect(screen.getByRole("alert")).toHaveTextContent("cannot be preserved");
    });

    it("blocks save when loaded blocks cannot be edited losslessly", async () => {
        const onSave = vi.fn<(blocks: ArticleBlock[]) => void>();
        const blocks = [
            { block_type: "callout", content: { text: "Note" }, locale: "en", ordering: 0 },
            { block_type: "reference", content: { text: "Source" }, locale: "en", ordering: 1 },
            { block_type: "caption", content: { text: "Caption" }, locale: "en", ordering: 2 },
            { block_type: "legacy_embed", content: {}, locale: "en", ordering: 3 },
        ] as unknown as ArticleBlock[];
        render(<ArticleEditor article={{ blocks }} locale="en" onSave={onSave} />);

        await userEvent.click(screen.getByRole("button", { name: "Save article blocks" }));

        expect(onSave).not.toHaveBeenCalled();
        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent("callout");
        expect(alert).toHaveTextContent("reference");
        expect(alert).toHaveTextContent("caption");
        expect(alert).toHaveTextContent("legacy_embed");
    });
});
