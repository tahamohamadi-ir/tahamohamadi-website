import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminSeedReviewPage from "./page";

const { adminFetchMock } = vi.hoisted(() => ({ adminFetchMock: vi.fn() }));

vi.mock("@/lib/admin-fetch", () => ({ adminFetch: adminFetchMock }));

describe("AdminSeedReviewPage", () => {
  beforeEach(() => {
    adminFetchMock.mockResolvedValue({
      automatic_publish_allowed: false,
      seed_record_count: 1,
      records: [{ resource: "skills", id: "private-id", status: "draft", missing_locales: ["name_fa"], requires_manual_review: true }],
      issues: [{ resource: "skills", id: "private-id", status: "draft", missing_locales: ["name_fa"], requires_manual_review: true, reason: "Both locale fields must be complete before review." }],
    });
  });

  it("renders the manual gate and avoids exposing record identifiers", async () => {
    render(<AdminSeedReviewPage />);

    await waitFor(() => expect(screen.getByText("انتشار خودکار: غیرمجاز")).toBeInTheDocument());
    expect(screen.getByText("مهارت‌ها")).toBeInTheDocument();
    expect(screen.getByText("fa")).toBeInTheDocument();
    expect(screen.queryByText("private-id")).not.toBeInTheDocument();
    expect(adminFetchMock).toHaveBeenCalledWith("/api/admin/seed-review/");
  });
});
