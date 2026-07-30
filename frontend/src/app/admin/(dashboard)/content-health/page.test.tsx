import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminContentHealthPage from "./page";

const { adminFetchMock } = vi.hoisted(() => ({ adminFetchMock: vi.fn() }));

vi.mock("@/lib/admin-fetch", () => ({ adminFetch: adminFetchMock }));

describe("AdminContentHealthPage", () => {
  beforeEach(() => {
    adminFetchMock.mockResolvedValue({
      translation_issues: { count: 1, truncated: false, items: [{ title: "صفحهٔ پژوهش", locales: ["en"], statuses: { fa: "complete", en: "missing" }, action_path: "/admin/pages/private-id" }] },
      missing_media_alt: { count: 1, truncated: false, items: [{ title: "portrait.png", missing_locales: ["fa"], action_path: "/admin/media" }] },
      orphan_media: { count: 0, truncated: false, items: [] },
      failed_schedules: { count: 1, truncated: false, items: [{ content_type: "cms.page", action_path: "/admin/workflow" }] },
    });
  });

  it("renders real findings with actionable links but without naked identifiers", async () => {
    render(<AdminContentHealthPage />);

    await waitFor(() => expect(screen.getByText("صفحهٔ پژوهش")).toBeInTheDocument());
    expect(screen.getByText("portrait.png")).toBeInTheDocument();
    expect(screen.getByText("cms.page")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "رفع ترجمه" })).toHaveAttribute("href", "/admin/pages/private-id");
    expect(screen.queryByText("private-id")).not.toBeInTheDocument();
    expect(adminFetchMock).toHaveBeenCalledWith("/api/admin/content-health/");
  });
});
