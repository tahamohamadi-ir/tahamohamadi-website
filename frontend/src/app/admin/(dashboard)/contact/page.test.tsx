import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminContactInboxPage from "./page";

const { adminFetchMock } = vi.hoisted(() => ({ adminFetchMock: vi.fn() }));

vi.mock("@/lib/admin-fetch", () => ({ adminFetch: adminFetchMock }));

describe("AdminContactInboxPage", () => {
  beforeEach(() => {
    adminFetchMock.mockReset();
    adminFetchMock.mockResolvedValueOnce({
      count: 1,
      page: 1,
      page_size: 20,
      total_pages: 1,
      next: null,
      previous: null,
      results: [{
        id: "private-contact-id",
        name: "Inbox User",
        email: "inbox@example.com",
        subject: "Research collaboration",
        status: "new",
        created_at: "2026-07-30T12:00:00Z",
      }],
    });
  });

  it("lists a new contact and advances it to read without displaying its identifier", async () => {
    const user = userEvent.setup();
    render(<AdminContactInboxPage />);

    await waitFor(() => expect(screen.getByText("Inbox User")).toBeInTheDocument());
    expect(screen.getByText("Research collaboration")).toBeInTheDocument();
    expect(screen.getAllByText("جدید")).toHaveLength(2);
    expect(screen.queryByText("private-contact-id")).not.toBeInTheDocument();

    adminFetchMock.mockResolvedValueOnce({ id: "private-contact-id", status: "read" });
    await user.click(screen.getByRole("button", { name: "خوانده شد" }));

    await waitFor(() => expect(screen.getAllByText("خوانده‌شده")).toHaveLength(2));
    expect(adminFetchMock).toHaveBeenCalledWith(
      "/api/admin/contact-messages/private-contact-id/mark-read/",
      { method: "POST" },
    );
  });

  it("loads the next inbox page without exposing identifiers", async () => {
    const user = userEvent.setup();
    adminFetchMock.mockReset();
    adminFetchMock.mockResolvedValueOnce({
      count: 21,
      page: 1,
      page_size: 20,
      total_pages: 2,
      next: "http://testserver/api/admin/contact-messages/?page=2",
      previous: null,
      results: [{
        id: "private-contact-id",
        name: "Inbox User",
        email: "inbox@example.com",
        subject: "Research collaboration",
        status: "new",
        created_at: "2026-07-30T12:00:00Z",
      }],
    });
    render(<AdminContactInboxPage />);

    await waitFor(() => expect(screen.getByText("Inbox User")).toBeInTheDocument());
    adminFetchMock.mockResolvedValueOnce({
      count: 21,
      page: 2,
      page_size: 20,
      total_pages: 2,
      next: null,
      previous: "http://testserver/api/admin/contact-messages/?page=1",
      results: [],
    });

    await user.click(screen.getByRole("button", { name: "صفحه بعد" }));

    await waitFor(() => expect(screen.getByText("پیامی مطابق این جست‌وجو وجود ندارد.")).toBeInTheDocument());
    expect(adminFetchMock).toHaveBeenCalledWith("/api/admin/contact-messages/?page=2");
  });
});
