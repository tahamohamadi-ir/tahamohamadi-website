import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminApiError } from "@/lib/admin-fetch";
import { TemplatePanel } from "./TemplatePanel";
import type { ComposerSection } from "./types";

const { adminFetchMock } = vi.hoisted(() => ({ adminFetchMock: vi.fn() }));

vi.mock("@/lib/admin-fetch", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/lib/admin-fetch")>();
    return { ...actual, adminFetch: adminFetchMock };
});

const sections: ComposerSection[] = [
    {
        id: "section-private-id",
        ordering: 0,
        enabled: true,
        layout: "full-width",
        blocks: [
            {
                id: "block-private-id",
                block_type: "text",
                ordering: 0,
                settings: { body_fa: "متن", body_en: "Text", alignment: "start" },
            },
        ],
    },
];

const identity = {
    slug_fa: "نسخه-الگو",
    slug_en: "template-copy",
    title_fa: "نسخه الگو",
    title_en: "Template copy",
    page_type: "custom",
};

describe("TemplatePanel", () => {
    beforeEach(() => adminFetchMock.mockReset());

    it("exports a portable schema-version-1 manifest without Canvas IDs", async () => {
        render(<TemplatePanel sections={sections} initialIdentity={identity} onImported={vi.fn()} />);

        await userEvent.click(screen.getByRole("button", { name: "Export manifest" }));

        const manifest = JSON.parse((screen.getByLabelText("Template manifest") as HTMLTextAreaElement).value);
        expect(manifest).toEqual({
            schema_version: 1,
            sections: [
                {
                    ordering: 0,
                    enabled: true,
                    layout: "full-width",
                    blocks: [
                        {
                            block_type: "text",
                            ordering: 0,
                            settings: { body_fa: "متن", body_en: "Text", alignment: "start" },
                        },
                    ],
                },
            ],
            block_types: ["text"],
            media_references: [],
            translation_completeness: { fa: true, en: true },
        });
        expect(JSON.stringify(manifest)).not.toContain("private-id");
    });

    it("lists stored templates and selects one into the existing import flow", async () => {
        const storedManifest = {
            schema_version: 1,
            sections: [],
            block_types: [],
            media_references: [],
            translation_completeness: { fa: true, en: true },
        };
        adminFetchMock.mockResolvedValueOnce([{ name: "Stored text", manifest: storedManifest, status: "draft", version: 1, created_at: "2026-08-08T00:00:00Z", updated_at: "2026-08-08T00:00:00Z" }]);
        render(<TemplatePanel sections={sections} initialIdentity={identity} onImported={vi.fn()} />);

        expect(await screen.findByRole("button", { name: "Stored text" })).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "Stored text" }));

        expect(JSON.parse((screen.getByLabelText("Template manifest") as HTMLTextAreaElement).value)).toEqual(storedManifest);
        expect(screen.getByRole("button", { name: "Validate import" })).toBeEnabled();
        expect(adminFetchMock).toHaveBeenCalledWith("/api/admin/pages/templates/");
    });

    it("saves the current canonical manifest to the stored template library", async () => {
        adminFetchMock.mockResolvedValueOnce([]).mockResolvedValueOnce({
            name: "Homepage section",
            manifest: { schema_version: 1, sections: [], block_types: [], media_references: [], translation_completeness: { fa: true, en: true } },
            status: "draft",
            version: 1,
            created_at: "2026-08-08T00:00:00Z",
            updated_at: "2026-08-08T00:00:00Z",
        });
        render(<TemplatePanel sections={sections} initialIdentity={identity} onImported={vi.fn()} />);

        await screen.findByText("Stored templates");
        await userEvent.type(screen.getByLabelText("Template name"), "Homepage section");
        await userEvent.click(screen.getByRole("button", { name: "Save current template" }));

        await waitFor(() => expect(adminFetchMock).toHaveBeenCalledTimes(2));
        expect(adminFetchMock).toHaveBeenLastCalledWith(
            "/api/admin/pages/templates/",
            expect.objectContaining({
                method: "POST",
                body: expect.stringContaining('"name":"Homepage section"'),
            }),
        );
        expect(screen.getByRole("button", { name: "Homepage section" })).toBeInTheDocument();
    });

    it("requires a successful dry-run and an explicit confirmation before importing", async () => {
        const onImported = vi.fn();
        const manifest = {
            schema_version: 1,
            sections: [],
            block_types: [],
            media_references: [],
            translation_completeness: { fa: true, en: true },
        };
        adminFetchMock
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce({ valid: true, manifest })
            .mockResolvedValueOnce({ valid: true, manifest, page: { id: "new-draft", status: "draft" } });
        render(<TemplatePanel sections={sections} initialIdentity={identity} onImported={onImported} />);
        fireEvent.change(screen.getByLabelText("Template manifest"), {
            target: { value: JSON.stringify(manifest) },
        });

        expect(screen.queryByRole("button", { name: "Confirm Draft import" })).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "Validate import" }));

        expect(await screen.findByText("Server validation passed. No content was created.")).toBeInTheDocument();
        expect(adminFetchMock).toHaveBeenNthCalledWith(
            2,
            "/api/admin/pages/templates/import/",
            expect.objectContaining({ method: "POST", body: expect.stringContaining('"dry_run":true') }),
        );
        expect(onImported).not.toHaveBeenCalled();

        await userEvent.click(screen.getByRole("button", { name: "Confirm Draft import" }));

        await waitFor(() => expect(adminFetchMock).toHaveBeenCalledTimes(3));
        expect(adminFetchMock).toHaveBeenLastCalledWith(
            "/api/admin/pages/templates/import/",
            expect.objectContaining({ method: "POST", body: expect.stringContaining('"dry_run":false') }),
        );
        expect(onImported).toHaveBeenCalledWith("new-draft");
    });

    it("shows formatted server validation without raw JSON or media UUIDs", async () => {
        const mediaId = "ed8a9eb9-1db2-4ddb-bc0a-1366af807b21";
        adminFetchMock.mockResolvedValueOnce([]).mockRejectedValueOnce(
            new AdminApiError(400, {
                detail: "Template manifest validation failed.",
                errors: { composition: [`sections[0].blocks[0]: media asset '${mediaId}' not found`] },
            }),
        );
        render(<TemplatePanel sections={sections} initialIdentity={identity} onImported={vi.fn()} />);
        fireEvent.change(screen.getByLabelText("Template manifest"), {
            target: { value: JSON.stringify({ schema_version: 1, sections: [] }) },
        });

        await userEvent.click(screen.getByRole("button", { name: "Validate import" }));

        const alert = await screen.findByRole("alert");
        expect(alert).toHaveTextContent("media reference");
        expect(alert).not.toHaveTextContent(mediaId);
        expect(alert).not.toHaveTextContent("{\"");
        expect(screen.queryByRole("button", { name: "Confirm Draft import" })).not.toBeInTheDocument();
    });

    it.each(["manifest", "identity"] as const)(
        "discards a stale dry-run response after the %s changes",
        async (changedInput) => {
            let resolveDryRun: ((value: { valid: true; manifest: typeof manifest }) => void) | undefined;
            const manifest = {
                schema_version: 1 as const,
                sections: [],
                block_types: [],
                media_references: [],
                translation_completeness: { fa: true, en: true },
            };
            adminFetchMock.mockResolvedValueOnce([]).mockImplementationOnce(
                () => new Promise((resolve) => { resolveDryRun = resolve; }),
            );
            render(<TemplatePanel sections={sections} initialIdentity={identity} onImported={vi.fn()} />);
            fireEvent.change(screen.getByLabelText("Template manifest"), {
                target: { value: JSON.stringify(manifest) },
            });
            await userEvent.click(screen.getByRole("button", { name: "Validate import" }));
            await waitFor(() => expect(adminFetchMock).toHaveBeenCalledTimes(2));

            if (changedInput === "manifest") {
                fireEvent.change(screen.getByLabelText("Template manifest"), {
                    target: { value: JSON.stringify({ ...manifest, sections: [{ ordering: 0 }] }) },
                });
            } else {
                fireEvent.change(screen.getByLabelText("Draft slug (EN)"), {
                    target: { value: "different-template-copy" },
                });
            }
            await act(async () => {
                resolveDryRun?.({ valid: true, manifest });
                await Promise.resolve();
            });

            expect(screen.queryByText("Server validation passed. No content was created.")).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: "Confirm Draft import" })).not.toBeInTheDocument();
        },
    );
});
