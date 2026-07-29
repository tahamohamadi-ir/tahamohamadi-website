import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MediaPicker } from "./MediaPicker";
import type { MediaAssetDTO } from "@/lib/types/media";

// Mock asset data
function makeAsset(overrides: Partial<MediaAssetDTO> = {}): MediaAssetDTO {
    return {
        id: "asset-1",
        file_url: "/media/test-image.jpg",
        filename: "test-image.jpg",
        mime_type: "image/jpeg",
        size: 102400,
        width: 800,
        height: 600,
        alt_fa: "تصویر آزمایشی",
        alt_en: "Test image",
        caption_fa: "",
        caption_en: "",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        ...overrides,
    };
}

const mockMediaResponse = {
    count: 2,
    next: null,
    previous: null,
    results: [
        makeAsset({ id: "asset-1", filename: "photo.jpg" }),
        makeAsset({
            id: "asset-2",
            filename: "document.pdf",
            mime_type: "application/pdf",
            file_url: "/media/document.pdf",
        }),
    ],
};

describe("MediaPicker", () => {
    let fetchSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchSpy = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockMediaResponse),
        });
        global.fetch = fetchSpy as unknown as typeof fetch;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("Empty state (no value)", () => {
        it("renders a 'Choose media...' button when no value is set", () => {
            render(<MediaPicker />);
            expect(screen.getByText("Choose media...")).toBeInTheDocument();
        });

        it("opens dialog when 'Choose media...' button is clicked", async () => {
            render(<MediaPicker />);
            await userEvent.click(screen.getByText("Choose media..."));
            expect(screen.getByText("Media Library")).toBeInTheDocument();
        });
    });

    describe("Preview state (with value)", () => {
        it("shows a thumbnail preview for image assets", () => {
            const asset = makeAsset();
            render(<MediaPicker value={asset} locale="en" />);
            const img = screen.getByAltText("Test image");
            expect(img).toBeInTheDocument();
            expect(img).toHaveAttribute("src", "/media/test-image.jpg");
        });

        it("shows file icon for non-image assets", () => {
            const asset = makeAsset({
                mime_type: "application/pdf",
                filename: "doc.pdf",
            });
            render(<MediaPicker value={asset} locale="en" />);
            expect(screen.getByText("doc.pdf")).toBeInTheDocument();
        });

        it("shows alt text in the correct locale", () => {
            const asset = makeAsset();
            render(<MediaPicker value={asset} locale="fa" />);
            expect(screen.getByText("تصویر آزمایشی")).toBeInTheDocument();
        });

        it("shows file size and dimensions", () => {
            const asset = makeAsset({ size: 102400, width: 800, height: 600 });
            render(<MediaPicker value={asset} />);
            expect(screen.getByText("100.0 KB · 800×600")).toBeInTheDocument();
        });

        it("renders replace and clear buttons", () => {
            render(<MediaPicker value={makeAsset()} onClear={vi.fn()} />);
            expect(screen.getByLabelText("Replace media")).toBeInTheDocument();
            expect(screen.getByLabelText("Clear selection")).toBeInTheDocument();
        });
    });

    describe("Clear action", () => {
        it("calls onClear when clear button is clicked", async () => {
            const onClear = vi.fn();
            render(<MediaPicker value={makeAsset()} onClear={onClear} />);
            await userEvent.click(screen.getByLabelText("Clear selection"));
            expect(onClear).toHaveBeenCalledTimes(1);
        });
    });

    describe("Replace action", () => {
        it("opens dialog when replace button is clicked", async () => {
            render(<MediaPicker value={makeAsset()} />);
            await userEvent.click(screen.getByLabelText("Replace media"));
            expect(screen.getByText("Media Library")).toBeInTheDocument();
        });
    });

    describe("Dialog media browser", () => {
        it("fetches media when dialog opens", async () => {
            render(<MediaPicker />);
            await userEvent.click(screen.getByText("Choose media..."));

            await waitFor(() => {
                expect(fetchSpy).toHaveBeenCalledWith(
                    expect.stringContaining("/api/admin/media/"),
                    expect.objectContaining({ credentials: "include" })
                );
            });
        });

        it("renders media grid after fetching", async () => {
            render(<MediaPicker />);
            await userEvent.click(screen.getByText("Choose media..."));

            await waitFor(() => {
                expect(screen.getByLabelText("Select photo.jpg")).toBeInTheDocument();
                expect(
                    screen.getByLabelText("Select document.pdf")
                ).toBeInTheDocument();
            });
        });

        it("calls onSelect when an asset is clicked", async () => {
            const onSelect = vi.fn();
            render(<MediaPicker onSelect={onSelect} />);
            await userEvent.click(screen.getByText("Choose media..."));

            await waitFor(() => {
                expect(screen.getByLabelText("Select photo.jpg")).toBeInTheDocument();
            });

            await userEvent.click(screen.getByLabelText("Select photo.jpg"));
            expect(onSelect).toHaveBeenCalledWith(
                expect.objectContaining({ id: "asset-1", filename: "photo.jpg" })
            );
        });

        it("shows search input that updates query params", async () => {
            render(<MediaPicker />);
            await userEvent.click(screen.getByText("Choose media..."));

            const searchInput = screen.getByPlaceholderText(
                "Search by filename or alt text..."
            );
            expect(searchInput).toBeInTheDocument();

            await userEvent.type(searchInput, "hello");

            await waitFor(() => {
                const lastCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1];
                expect(lastCall[0]).toContain("search=hello");
            });
        });

        it("shows filter select with type options", async () => {
            render(<MediaPicker />);
            await userEvent.click(screen.getByText("Choose media..."));

            const filterSelect = screen.getByLabelText("Filter by type");
            expect(filterSelect).toBeInTheDocument();

            fireEvent.change(filterSelect, { target: { value: "image" } });

            await waitFor(() => {
                const lastCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1];
                expect(lastCall[0]).toContain("mime_type_category=image");
            });
        });

        it("shows error state and retry button on fetch failure", async () => {
            fetchSpy.mockResolvedValueOnce({ ok: false, status: 500 });

            render(<MediaPicker />);
            await userEvent.click(screen.getByText("Choose media..."));

            await waitFor(() => {
                expect(
                    screen.getByText("Failed to fetch media: 500")
                ).toBeInTheDocument();
                expect(screen.getByText("Retry")).toBeInTheDocument();
            });
        });

        it("shows empty state when no assets match", async () => {
            fetchSpy.mockResolvedValue({
                ok: true,
                json: () =>
                    Promise.resolve({ count: 0, next: null, previous: null, results: [] }),
            });

            render(<MediaPicker />);
            await userEvent.click(screen.getByText("Choose media..."));

            await waitFor(() => {
                expect(screen.getByText("No media found")).toBeInTheDocument();
            });
        });
    });

    describe("Upload", () => {
        it("renders upload button in the dialog toolbar", async () => {
            render(<MediaPicker />);
            await userEvent.click(screen.getByText("Choose media..."));

            expect(screen.getByText("Upload")).toBeInTheDocument();
        });
    });

    describe("Pagination", () => {
        it("shows pagination when totalPages > 1", async () => {
            fetchSpy.mockResolvedValue({
                ok: true,
                json: () =>
                    Promise.resolve({
                        count: 24,
                        next: "page=2",
                        previous: null,
                        results: Array.from({ length: 12 }, (_, i) =>
                            makeAsset({ id: `asset-${i}`, filename: `file-${i}.jpg` })
                        ),
                    }),
            });

            render(<MediaPicker />);
            await userEvent.click(screen.getByText("Choose media..."));

            await waitFor(() => {
                expect(screen.getByText("1 / 2")).toBeInTheDocument();
                expect(screen.getByText("Next")).toBeInTheDocument();
                expect(screen.getByText("Previous")).toBeInTheDocument();
            });
        });
    });

    describe("Allowed types filtering", () => {
        it("limits filter options based on allowedTypes prop", async () => {
            render(<MediaPicker allowedTypes={["image"]} />);
            await userEvent.click(screen.getByText("Choose media..."));

            const filterSelect = screen.getByLabelText("Filter by type");
            const options = filterSelect.querySelectorAll("option");
            // Should have "All" and "Images" only
            expect(options).toHaveLength(2);
            expect(options[0]).toHaveValue("all");
            expect(options[1]).toHaveValue("image");
        });
    });
});
