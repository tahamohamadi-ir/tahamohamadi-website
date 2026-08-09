import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ArticleEditorPage from "./page";
import type { ArticleBlock, EditorArticle } from "@/components/admin/editor/types";

const { adminFetchMock, paramsMock, pushMock } = vi.hoisted(() => ({
    adminFetchMock: vi.fn(),
    paramsMock: { id: "new" },
    pushMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useParams: () => paramsMock,
    useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/admin-fetch", () => ({ adminFetch: adminFetchMock }));

vi.mock("@/components/admin/editor", () => ({
    ArticleEditor: ({
        article,
        locale,
        onSave,
        onPreview,
    }: {
        article: EditorArticle;
        locale: "fa" | "en";
        onSave: (blocks: ArticleBlock[]) => void;
        onPreview: (blocks: ArticleBlock[]) => void;
    }) => {
        const blocks: ArticleBlock[] = [
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
                <button type="button" onClick={() => onSave(blocks)}>
                    Save editor
                </button>
                <button type="button" onClick={() => onPreview(blocks)}>
                    Preview editor
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
});
