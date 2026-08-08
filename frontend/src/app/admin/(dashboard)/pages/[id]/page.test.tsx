import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminApiError } from "@/lib/admin-fetch";
import PageEditorPage from "./page";

const { adminFetchMock, pushMock, paramsMock } = vi.hoisted(() => ({
  adminFetchMock: vi.fn(),
  pushMock: vi.fn(),
  paramsMock: { id: "page-1" },
}));

vi.mock("next/navigation", () => ({
  useParams: () => paramsMock,
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/admin-fetch", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/admin-fetch")>();
  return { ...actual, adminFetch: adminFetchMock };
});

vi.mock("@/components/admin/composer", () => ({
  ComposerCanvas: ({ initialSections, onChange }: { initialSections: unknown[]; onChange: (sections: unknown[]) => void }) => (
    <div data-testid="composer-canvas">
      Composer: {initialSections.length} sections
      <button type="button" onClick={() => onChange([{ id: "section-1" }])}>Edit composition</button>
    </div>
  ),
  PreviewPanel: () => <div data-testid="preview-panel">Preview</div>,
}));

const page = {
  id: "page-1",
  title_fa: "صفحه اصلی",
  title_en: "Home",
  slug_fa: "خانه",
  slug_en: "home",
  page_type: "home",
  status: "published",
  version: 1,
  sections: [],
};

const draftPage = { ...page, status: "draft" };

describe("PageEditorPage", () => {
  afterEach(() => {
    vi.useRealTimers();
  });
  beforeEach(() => {
    paramsMock.id = "page-1";
    adminFetchMock.mockReset();
    pushMock.mockReset();
    adminFetchMock.mockResolvedValueOnce(page);
  });

  it("keeps the composer visible and shows a concise validation alert after save fails", async () => {
    adminFetchMock.mockRejectedValueOnce(
      new AdminApiError(422, {
        detail: "One or more fields are invalid.",
        errors: {
          sections: [{ blocks: [{ settings: ["(root): 'title' is required"] }] }],
        },
      }),
    );
    render(<PageEditorPage />);

    expect(await screen.findByTestId("composer-canvas")).toBeInTheDocument();
    expect(screen.getByLabelText("عنوان فارسی")).toHaveValue("صفحه اصلی");
    await userEvent.click(screen.getByRole("button", { name: "ذخیره" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("ذخیره صفحه انجام نشد");
    expect(alert).toHaveTextContent("بخش ۱، بلاک ۱");
    expect(alert).not.toHaveTextContent("API error 422");
    expect(screen.getByTestId("composer-canvas")).toBeInTheDocument();
  });

  it("creates a new routable bilingual page before entering its editor", async () => {
    paramsMock.id = "new";
    adminFetchMock.mockReset();
    adminFetchMock.mockResolvedValueOnce({ ...page, id: "created-page" });
    render(<PageEditorPage />);

    const titleFa = await screen.findByLabelText("عنوان فارسی");
    expect(screen.getByRole("button", { name: "ایجاد صفحه" })).toBeDisabled();
    await userEvent.type(titleFa, "درباره من");
    await userEvent.type(screen.getByLabelText("عنوان انگلیسی"), "About me");
    await userEvent.type(screen.getByLabelText("مسیر فارسی"), "درباره-من");
    await userEvent.type(screen.getByLabelText("مسیر انگلیسی"), "about-me");
    await userEvent.click(screen.getByRole("button", { name: "ایجاد صفحه" }));

    expect(adminFetchMock).toHaveBeenCalledWith(
      "/api/admin/pages/",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"slug_en":"about-me"'),
      }),
    );
    expect(pushMock).toHaveBeenCalledWith("/admin/pages/created-page");
  });

  it("restores composition through visible and keyboard undo/redo without saving immediately", async () => {
    adminFetchMock.mockReset();
    adminFetchMock.mockResolvedValueOnce(draftPage);
    const user = userEvent.setup();
    render(<PageEditorPage />);

    expect(await screen.findByTestId("composer-canvas")).toHaveTextContent("0 sections");
    await user.click(screen.getByRole("button", { name: "Edit composition" }));
    expect(screen.getByTestId("composer-canvas")).toHaveTextContent("1 sections");
    expect(screen.getByRole("button", { name: "Undo composition change" })).toBeEnabled();

    await user.keyboard("{Control>}z{/Control}");
    expect(screen.getByTestId("composer-canvas")).toHaveTextContent("0 sections");
    expect(adminFetchMock).toHaveBeenCalledTimes(1);

    await user.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");
    expect(screen.getByTestId("composer-canvas")).toHaveTextContent("1 sections");
  });

  it("autosaves only Draft composition changes after the 750 ms debounce", async () => {
    vi.useFakeTimers();
    adminFetchMock.mockReset();
    adminFetchMock.mockResolvedValueOnce(draftPage).mockResolvedValueOnce({ ...draftPage, version: 2 });
    render(<PageEditorPage />);

    await act(async () => { await Promise.resolve(); });
    expect(screen.getByTestId("composer-canvas")).toBeInTheDocument();
    await act(async () => { screen.getByRole("button", { name: "Edit composition" }).click(); });

    await act(async () => { vi.advanceTimersByTime(749); });
    expect(adminFetchMock).toHaveBeenCalledTimes(1);
    await act(async () => { vi.advanceTimersByTime(1); });

    expect(adminFetchMock).toHaveBeenLastCalledWith(
      "/api/admin/pages/page-1/",
      expect.objectContaining({ method: "PUT", body: expect.stringContaining('"version":1') }),
    );
    vi.useRealTimers();
  });

  it("does not autosave published composition changes", async () => {
    const user = userEvent.setup();
    render(<PageEditorPage />);

    await screen.findByTestId("composer-canvas");
    await user.click(screen.getByRole("button", { name: "Edit composition" }));
    await new Promise((resolve) => setTimeout(resolve, 800));

    expect(adminFetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not discard a later Draft edit when an earlier autosave resolves first", async () => {
    vi.useFakeTimers();
    let resolveFirstSave: ((value: typeof draftPage) => void) | undefined;
    adminFetchMock.mockReset();
    adminFetchMock
      .mockResolvedValueOnce(draftPage)
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirstSave = resolve; }))
      .mockResolvedValueOnce({ ...draftPage, version: 3 });
    render(<PageEditorPage />);
    await act(async () => { await Promise.resolve(); });

    await act(async () => { screen.getByRole("button", { name: "Edit composition" }).click(); });
    await act(async () => { vi.advanceTimersByTime(750); });
    await act(async () => { screen.getByRole("button", { name: "Edit composition" }).click(); });
    await act(async () => { resolveFirstSave?.({ ...draftPage, version: 2 }); await Promise.resolve(); });
    await act(async () => { vi.advanceTimersByTime(750); });

    expect(adminFetchMock).toHaveBeenCalledTimes(3);
  });

  it("confirms dirty return navigation", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<PageEditorPage />);

    await screen.findByTestId("composer-canvas");
    await user.click(screen.getByRole("button", { name: "Edit composition" }));
    await user.click(screen.getByRole("button", { name: /بازگشت/ }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("resets undo history after a successful manual save", async () => {
    adminFetchMock.mockReset();
    adminFetchMock.mockResolvedValueOnce(draftPage).mockResolvedValueOnce({ ...draftPage, version: 2 });
    const user = userEvent.setup();
    render(<PageEditorPage />);

    await screen.findByTestId("composer-canvas");
    await user.click(screen.getByRole("button", { name: "Edit composition" }));
    expect(screen.getByRole("button", { name: "Undo composition change" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: /ذخیره/ }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Undo composition change" })).toBeDisabled());
  });
});
