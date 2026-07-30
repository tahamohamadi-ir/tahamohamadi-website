import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TranslationQueue } from "./TranslationQueue";

const { adminFetchMock } = vi.hoisted(() => ({ adminFetchMock: vi.fn() }));

vi.mock("@/lib/admin-fetch", () => ({ adminFetch: adminFetchMock }));

const items = [
  {
    id: "article-a",
    content_type: "blog.article",
    title_en: "English title",
    title_fa: "عنوان فارسی",
    status_en: "complete" as const,
    status_fa: "outdated" as const,
    last_updated: "2026-07-30T12:00:00Z",
    action_path: "/admin/blog/article-a",
    fields: [
      { key: "title", label: "Title", en: "English title", fa: "عنوان فارسی" },
      { key: "excerpt", label: "Excerpt", en: "English summary", fa: "خلاصه فارسی" },
    ],
  },
  {
    id: "article-b",
    content_type: "blog.article",
    title_en: "",
    title_fa: "فقط فارسی",
    status_en: "missing" as const,
    status_fa: "complete" as const,
    last_updated: "2026-07-29T12:00:00Z",
    action_path: "/admin/blog/article-b",
    fields: [{ key: "title", label: "Title", en: "", fa: "فقط فارسی" }],
  },
];

describe("TranslationQueue", () => {
  beforeEach(() => {
    adminFetchMock.mockResolvedValue(items);
  });

  it("uses the authenticated admin client and compares real localized fields", async () => {
    render(<TranslationQueue />);

    await waitFor(() => expect(screen.getByText("English title")).toBeInTheDocument());
    expect(adminFetchMock).toHaveBeenCalledWith("/api/admin/workflow/translation-status/");

    fireEvent.click(screen.getAllByRole("button", { name: "Compare" })[0]);

    expect(screen.getByText("English summary")).toBeInTheDocument();
    expect(screen.getByText("خلاصه فارسی")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Edit" })[0]).toHaveAttribute("href", "/admin/blog/article-a");
  });

  it("shows only items needing attention in the selected locale", async () => {
    render(<TranslationQueue />);

    await waitFor(() => expect(screen.getByText("English title")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("Filter by locale"), { target: { value: "en" } });

    expect(screen.queryByText("English title")).not.toBeInTheDocument();
    expect(screen.getByText("فقط فارسی")).toBeInTheDocument();
  });
});
