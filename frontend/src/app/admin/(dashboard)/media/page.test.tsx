import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MediaLibraryPage from "./page";

const mediaAsset = {
    id: "11111111-1111-1111-1111-111111111111",
    file: "/media/source.jpg",
    original_filename: "source.jpg",
    mime_type: "image/jpeg",
    file_size: 1024,
    width: 100,
    height: 100,
    alt_text_fa: "",
    alt_text_en: "Source image",
    caption_fa: "",
    caption_en: "",
    status: "active",
    checksum: "a".repeat(64),
    created_at: "2026-07-30T00:00:00Z",
    updated_at: "2026-07-30T00:00:00Z",
};

describe("MediaLibraryPage", () => {
    beforeEach(() => {
        vi.stubGlobal(
            "fetch",
            vi.fn((input: string) => {
                if (input.includes("/usage/")) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve([{ type: "page", id: "page-1", title: "Homepage" }]),
                    });
                }
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ count: 1, next: null, previous: null, results: [mediaAsset] }),
                });
            }),
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("offers a replacement choice when the selected media is in use", async () => {
        render(<MediaLibraryPage />);
        await userEvent.click(await screen.findByRole("button", { name: /source\.jpg/i }));

        await waitFor(() => {
            expect(screen.getByText("Replace all usages")).toBeInTheDocument();
        });
    });
});
