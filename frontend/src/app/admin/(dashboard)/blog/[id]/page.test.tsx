import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ArticleEditorPage from "./page";
import type { ArticleBlock, EditorArticle } from "@/components/admin/editor/types";

const { adminFetchMock, paramsMock, previewBlocksMock, pushMock } = vi.hoisted(() => ({
    adminFetchMock: vi.fn(),
    paramsMock: { id: "new" },
    previewBlocksMock: { current: [] as ArticleBlock[] },
    pushMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useParams: () => paramsMock,
    useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/admin-fetch", () => ({ adminFetch: adminFetchMock }));

vi.mock("@/components/admin/auth-context", () => ({
    useAuth: () => ({ user: { username: "editor" }, hasRole: vi.fn().mockReturnValue(true), logout: vi.fn() }),
}));

vi.mock("@/components/admin/editor", () => ({
    ArticleEditor: ({
        article,
        locale,
        onSave,
        onPreview,
        onWarningsChange,
        onDirtyChange,
    }: {
        article: EditorArticle;
        locale: "fa" | "en";
        onSave: (blocks: ArticleBlock[]) => void;
        onPreview: (blocks: ArticleBlock[]) => void;
        onWarningsChange: (warnings: string[]) => void;
        onDirtyChange: (dirty: boolean) => void;
    }) => {
        const defaultBlocks: ArticleBlock[] = [
            {
                block_type: "paragraph",
                content: { text: "Preview parity" },
                locale,
                ordering: 0,
            },
        ];
        return (
            <div>
                <span>{article.status}</span>
                <button type="button" onClick={() => onSave(defaultBlocks)}>
                    Save editor
                </button>
                <button type="button" onClick={() => onPreview(previewBlocksMock.current.length > 0 ? previewBlocksMock.current : defaultBlocks)}>
                    Preview editor
                </button>
                <button type="button" onClick={() => onWarningsChange(["Lossy content"])}>
                    Raise conversion warning
                </button>
                <button type="button" onClick={() => onDirtyChange?.(true)}>
                    Edit article body
                </button>

            </div>
        );
    },
}));

describe("ArticleEditorPage", () => {
    beforeEach(() => {
        paramsMock.id = "new";
        adminFetchMock.mockReset();
        pushMock.mockReset();
        previewBlocksMock.current = [];
        vi.restoreAllMocks();
    });

    it("creates an article with required bilingual metadata, status, and locale-owned blocks", async () => {
        adminFetchMock.mockResolvedValueOnce({ id: "article-1" });
        const user = userEvent.setup();
        render(<ArticleEditorPage />);

        await user.type(await screen.findByLabelText("Persian title"), "عنوان فارسی");
        await user.type(screen.getByLabelText("English title"), "English title");
        await user.type(screen.getByLabelText("Persian slug"), "عنوان-فارسی");
        await user.type(screen.getByLabelText("English slug"), "english-title");
        await user.selectOptions(screen.getByLabelText("Article status"), "draft");
        await user.click(screen.getByRole("button", { name: "Save editor" }));

        await waitFor(() => expect(adminFetchMock).toHaveBeenCalledTimes(1));
        const [, options] = adminFetchMock.mock.calls[0];
        expect(options.method).toBe("POST");
        expect(JSON.parse(options.body)).toEqual({
            title_fa: "عنوان فارسی",
            title_en: "English title",
            slug_fa: "عنوان-فارسی",
            slug_en: "english-title",
            excerpt_fa: "",
            excerpt_en: "",
            status: "draft",
            blocks: [
                {
                    block_type: "paragraph",
                    content: { text: "Preview parity" },
                    locale: "fa",
                    ordering: 0,
                },
            ],
        });
    });

    it("previews the exact valid block content through the article BlockRenderer", async () => {
        render(<ArticleEditorPage />);

        await userEvent.click(await screen.findByRole("button", { name: "Preview editor" }));

        expect(screen.getByRole("region", { name: "Article preview" })).toHaveTextContent(
            "Preview parity"
        );
    });

    it("resolves media UUIDs before rendering image and gallery preview", async () => {
        previewBlocksMock.current = [
            {
                block_type: "image",
                content: { media_id: "11111111-2222-4333-8444-555555555555" },
                locale: "en",
                ordering: 0,
            },
            {
                block_type: "gallery",
                content: {
                    media_ids: ["66666666-7777-4888-8999-000000000000"],
                    layout: "grid",
                },
                locale: "en",
                ordering: 1,
            },
        ];
        adminFetchMock
            .mockResolvedValueOnce({
                id: "11111111-2222-4333-8444-555555555555",
                file: "/media/hero.jpg",
                alt_text_fa: "",
                alt_text_en: "Resolved hero",
                caption_fa: "",
                caption_en: "Hero caption",
                width: 1200,
                height: 800,
                status: "active",
            })
            .mockResolvedValueOnce({
                id: "66666666-7777-4888-8999-000000000000",
                file: "/media/gallery.jpg",
                alt_text_fa: "",
                alt_text_en: "Resolved gallery image",
                caption_fa: "",
                caption_en: "Gallery caption",
                width: 900,
                height: 600,
                status: "active",
            });
        render(<ArticleEditorPage />);

        await userEvent.selectOptions(await screen.findByLabelText("Editing locale"), "en");
        await userEvent.click(await screen.findByRole("button", { name: "Preview editor" }));

        expect(await screen.findByAltText("Resolved hero")).toHaveAttribute("src", "/media/hero.jpg");
        expect(screen.getByAltText("Resolved gallery image")).toHaveAttribute("src", "/media/gallery.jpg");
        expect(screen.getByText("Hero caption")).toBeInTheDocument();
        expect(screen.getByText("Gallery caption")).toBeInTheDocument();
    });

    it("omits image and gallery preview blocks backed by an archived media asset", async () => {
        const archivedId = "11111111-2222-4333-8444-555555555555";
        previewBlocksMock.current = [
            {
                block_type: "paragraph",
                content: { text: "Safe preview content" },
                locale: "en",
                ordering: 0,
            },
            {
                block_type: "image",
                content: { media_id: archivedId },
                locale: "en",
                ordering: 1,
            },
            {
                block_type: "gallery",
                content: { media_ids: [archivedId], layout: "grid" },
                locale: "en",
                ordering: 2,
            },
        ];
        adminFetchMock.mockResolvedValueOnce({
            id: archivedId,
            file: "/media/archived.jpg",
            alt_text_fa: "آرشیو",
            alt_text_en: "Archived image",
            caption_fa: "",
            caption_en: "Archived caption",
            width: 1200,
            height: 800,
            status: "archived",
        });
        render(<ArticleEditorPage />);

        await userEvent.selectOptions(await screen.findByLabelText("Editing locale"), "en");
        await userEvent.click(screen.getByRole("button", { name: "Preview editor" }));

        const preview = await screen.findByRole("region", { name: "Article preview" });
        expect(preview).toHaveTextContent("Safe preview content");
        expect(preview.querySelectorAll("img")).toHaveLength(0);
        expect(preview).not.toHaveTextContent("Archived caption");
    });

    it("gates route and locale navigation while conversion warnings are unresolved", async () => {
        render(<ArticleEditorPage />);

        await userEvent.click(await screen.findByRole("button", { name: "Raise conversion warning" }));

        expect(screen.getByRole("button", { name: "Back to articles" })).toBeDisabled();
        expect(screen.getByLabelText("Editing locale")).toBeDisabled();
        expect(pushMock).not.toHaveBeenCalled();
    });

    it("confirms ordinary unsaved metadata edits before in-app navigation", async () => {
        const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
        render(<ArticleEditorPage />);

        await userEvent.type(await screen.findByLabelText("English title"), "Draft title");
        await userEvent.click(screen.getByRole("button", { name: "Back to articles" }));

        expect(confirmSpy).toHaveBeenCalledWith("You have unsaved changes. Leave?");
        expect(pushMock).not.toHaveBeenCalled();
    });

    it("treats ordinary editor body changes as dirty", async () => {
        const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
        render(<ArticleEditorPage />);

        await userEvent.click(await screen.findByRole("button", { name: "Edit article body" }));
        await userEvent.click(screen.getByRole("button", { name: "Back to articles" }));

        expect(confirmSpy).toHaveBeenCalledTimes(1);
        expect(pushMock).not.toHaveBeenCalled();
    });
});
