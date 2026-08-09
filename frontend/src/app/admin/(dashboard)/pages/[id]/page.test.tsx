import { act, fireEvent, render as testingLibraryRender, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminNavigationGuardProvider } from "@/components/admin/admin-navigation-guard";
import { AdminNavbar } from "@/components/admin/admin-navbar";
import { DRAFT_RECOVERY_STORAGE_PREFIX } from "@/components/admin/composer/draft-recovery";
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
  usePathname: () => "/admin/pages/page-1",
}));

vi.mock("@/lib/admin-fetch", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/admin-fetch")>();
  return { ...actual, adminFetch: adminFetchMock };
});

vi.mock("@/components/admin/auth-context", () => ({
  useAuth: () => ({ user: { username: "editor" }, logout: vi.fn() }),
}));

vi.mock("@/components/admin/composer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/admin/composer")>();
  return {
  ...actual,
  ComposerCanvas: ({ initialSections, onChange, onTemplateImported }: { initialSections: unknown[]; onChange: (sections: unknown[]) => void; onTemplateImported?: (pageId: string) => void }) => (
    <div data-testid="composer-canvas">
      Composer: {initialSections.length} sections
      <button type="button" onClick={() => onChange([{ id: "section-1" }])}>Edit composition</button>
      <button type="button" onClick={() => onTemplateImported?.("imported-page")}>Open imported template</button>
    </div>
  ),
  PreviewPanel: () => <div data-testid="preview-panel">Preview</div>,
  };
});

function render(ui: ReactElement) {
  return testingLibraryRender(
    <AdminNavigationGuardProvider>{ui}</AdminNavigationGuardProvider>,
  );
}

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
    sessionStorage.clear();
    paramsMock.id = "page-1";
    adminFetchMock.mockReset();
    pushMock.mockReset();
    adminFetchMock.mockResolvedValueOnce(page);
  });

  it("keeps the composer visible and sanitizes the API composition error after save fails", async () => {
    const missingMediaId = "11111111-2222-4333-8444-555555555555";
    adminFetchMock.mockRejectedValueOnce(
      new AdminApiError(400, {
        detail: "Page composition validation failed.",
        errors: {
          composition: [`sections[0].blocks[0]: media asset '${missingMediaId}' not found`],
        },
      }),
    );
    render(<PageEditorPage />);

    expect(await screen.findByTestId("composer-canvas")).toBeInTheDocument();
    expect(screen.getByLabelText("عنوان فارسی")).toHaveValue("صفحه اصلی");
    await userEvent.click(screen.getByRole("button", { name: "ذخیره" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Review 1 highlighted Composer field");
    expect(alert).not.toHaveTextContent(missingMediaId);
    expect(alert).not.toHaveTextContent("media asset");
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

  it("resets undo history after a successful Draft autosave", async () => {
    vi.useFakeTimers();
    adminFetchMock.mockReset();
    adminFetchMock.mockResolvedValueOnce(draftPage).mockResolvedValueOnce({ ...draftPage, version: 2 });
    render(<PageEditorPage />);

    await act(async () => { await Promise.resolve(); });
    await act(async () => { screen.getByRole("button", { name: "Edit composition" }).click(); });
    expect(screen.getByRole("button", { name: "Undo composition change" })).toBeEnabled();

    await act(async () => { vi.advanceTimersByTime(750); });
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByRole("button", { name: "Undo composition change" })).toBeDisabled();
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

  it("does not start a same-version manual PUT while Draft autosave is in flight", async () => {
    vi.useFakeTimers();
    let resolveAutosave: ((value: typeof draftPage) => void) | undefined;
    adminFetchMock.mockReset();
    adminFetchMock
      .mockResolvedValueOnce(draftPage)
      .mockImplementationOnce(() => new Promise((resolve) => { resolveAutosave = resolve; }));
    render(<PageEditorPage />);
    await act(async () => { await Promise.resolve(); });

    await act(async () => { screen.getByRole("button", { name: "Edit composition" }).click(); });
    await act(async () => { vi.advanceTimersByTime(750); });

    const saveButton = screen.getByRole("button", { name: /ذخیره/ });
    expect(saveButton).toBeDisabled();
    fireEvent.click(saveButton);
    expect(adminFetchMock).toHaveBeenCalledTimes(2);
    expect(adminFetchMock.mock.calls[1]?.[1]?.body).toContain('"version":1');

    await act(async () => {
      resolveAutosave?.({ ...draftPage, version: 2 });
      await Promise.resolve();
    });
    expect(adminFetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("confirms dirty return navigation", async () => {
    adminFetchMock.mockReset();
    adminFetchMock.mockResolvedValueOnce(draftPage);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<PageEditorPage />);

    await screen.findByTestId("composer-canvas");
    await user.click(screen.getByRole("button", { name: "Edit composition" }));
    await user.click(screen.getByRole("button", { name: /بازگشت/ }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(`${DRAFT_RECOVERY_STORAGE_PREFIX}page-1`)).not.toBeNull();
    confirmSpy.mockRestore();
  });

  it("clears the recovery marker after confirmed Back discard", async () => {
    adminFetchMock.mockReset();
    adminFetchMock.mockResolvedValueOnce(draftPage);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<PageEditorPage />);

    await screen.findByTestId("composer-canvas");
    await userEvent.click(screen.getByRole("button", { name: "Edit composition" }));
    expect(sessionStorage.getItem(`${DRAFT_RECOVERY_STORAGE_PREFIX}page-1`)).not.toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /بازگشت/ }));

    expect(pushMock).toHaveBeenCalledWith("/admin/pages");
    expect(sessionStorage.getItem(`${DRAFT_RECOVERY_STORAGE_PREFIX}page-1`)).toBeNull();
    confirmSpy.mockRestore();
  });

  it("uses the same dirty confirmation before leaving for an imported template", async () => {
    adminFetchMock.mockReset();
    adminFetchMock.mockResolvedValueOnce(draftPage);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<PageEditorPage />);

    await screen.findByTestId("composer-canvas");
    await user.click(screen.getByRole("button", { name: "Edit composition" }));
    await user.click(screen.getByRole("button", { name: "Open imported template" }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalledWith("/admin/pages/imported-page");
    expect(sessionStorage.getItem(`${DRAFT_RECOVERY_STORAGE_PREFIX}page-1`)).not.toBeNull();
    confirmSpy.mockRestore();
  });

  it("clears the recovery marker after confirmed template discard", async () => {
    adminFetchMock.mockReset();
    adminFetchMock.mockResolvedValueOnce(draftPage);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<PageEditorPage />);

    await screen.findByTestId("composer-canvas");
    await userEvent.click(screen.getByRole("button", { name: "Edit composition" }));
    await userEvent.click(screen.getByRole("button", { name: "Open imported template" }));

    expect(pushMock).toHaveBeenCalledWith("/admin/pages/imported-page");
    expect(sessionStorage.getItem(`${DRAFT_RECOVERY_STORAGE_PREFIX}page-1`)).toBeNull();
    confirmSpy.mockRestore();
  });

  it("clears the recovery marker after a confirmed navbar discard", async () => {
    adminFetchMock.mockReset();
    adminFetchMock.mockResolvedValueOnce(draftPage);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    testingLibraryRender(
      <AdminNavigationGuardProvider>
        <AdminNavbar />
        <PageEditorPage />
      </AdminNavigationGuardProvider>,
    );

    await screen.findByTestId("composer-canvas");
    await userEvent.click(screen.getByRole("button", { name: "Edit composition" }));
    const blogLink = document.querySelector<HTMLAnchorElement>('a[href="/admin/blog"]');
    expect(blogLink).not.toBeNull();
    blogLink!.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(blogLink!);

    expect(confirmSpy).toHaveBeenCalled();
    expect(sessionStorage.getItem(`${DRAFT_RECOVERY_STORAGE_PREFIX}page-1`)).toBeNull();
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

  it("shows a sanitized Composer validation summary for nested server settings errors", async () => {
    adminFetchMock.mockRejectedValueOnce(
      new AdminApiError(422, {
        errors: { sections: [{ blocks: [{ settings: ["(root): 'title' is a required property"] }] }] },
      }),
    );
    render(<PageEditorPage />);

    await screen.findByTestId("composer-canvas");
    await userEvent.click(screen.getByRole("button", { name: /ذخیره/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Review 1 highlighted Composer field");
    expect(screen.getByRole("alert")).not.toHaveTextContent("required property");
  });

  it("presents a conflict and keeps local Draft edits without overwriting remote state", async () => {
    adminFetchMock.mockReset();
    adminFetchMock.mockResolvedValueOnce(draftPage).mockRejectedValueOnce(
      new AdminApiError(409, { detail: "Version conflict", current_version: 2 }),
    );
    render(<PageEditorPage />);

    await screen.findByTestId("composer-canvas");
    await userEvent.click(screen.getByRole("button", { name: "Edit composition" }));
    await userEvent.click(screen.getByRole("button", { name: /ذخیره/ }));

    expect(await screen.findByRole("dialog", { name: /conflict detected/i })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Save conflict");
    await userEvent.click(screen.getByRole("button", { name: /keep local edits/i }));
    expect(screen.queryByRole("dialog", { name: /conflict detected/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("composer-canvas")).toHaveTextContent("1 sections");
    expect(adminFetchMock).toHaveBeenCalledTimes(2);
  });

  it("reloads the current remote version only after the user deliberately discards local edits", async () => {
    const remotePage = { ...draftPage, version: 2, sections: [] };
    adminFetchMock.mockReset();
    adminFetchMock
      .mockResolvedValueOnce(draftPage)
      .mockRejectedValueOnce(new AdminApiError(409, { detail: "Version conflict" }))
      .mockResolvedValueOnce(remotePage);
    render(<PageEditorPage />);

    await screen.findByTestId("composer-canvas");
    await userEvent.click(screen.getByRole("button", { name: "Edit composition" }));
    expect(sessionStorage.getItem(`${DRAFT_RECOVERY_STORAGE_PREFIX}page-1`)).not.toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /ذخیره/ }));
    await userEvent.click(await screen.findByRole("button", { name: /^reload$/i }));

    await waitFor(() => expect(screen.getByTestId("composer-canvas")).toHaveTextContent("0 sections"));
    expect(sessionStorage.getItem(`${DRAFT_RECOVERY_STORAGE_PREFIX}page-1`)).toBeNull();
  });

  it("reports reload recovery and consumes the marker without restoring discarded content", async () => {
    sessionStorage.setItem(
      `${DRAFT_RECOVERY_STORAGE_PREFIX}page-1`,
      JSON.stringify({ pageId: "page-1", version: 1, session: "previous-session" }),
    );
    adminFetchMock.mockReset();
    adminFetchMock.mockResolvedValueOnce(draftPage);
    render(<PageEditorPage />);

    expect(await screen.findByRole("status", { name: "Draft recovery notice" })).toHaveTextContent(
      "Server Draft restored; unsaved local work was discarded",
    );
    expect(sessionStorage.getItem(`${DRAFT_RECOVERY_STORAGE_PREFIX}page-1`)).toBeNull();
  });

  it("announces pending, saving, and saved Draft states and clears the recovery marker", async () => {
    vi.useFakeTimers();
    let resolveSave: ((value: typeof draftPage) => void) | undefined;
    adminFetchMock.mockReset();
    adminFetchMock
      .mockResolvedValueOnce(draftPage)
      .mockImplementationOnce(() => new Promise((resolve) => { resolveSave = resolve; }));
    render(<PageEditorPage />);
    await act(async () => { await Promise.resolve(); });

    await act(async () => { screen.getByRole("button", { name: "Edit composition" }).click(); });
    expect(screen.getByRole("status")).toHaveTextContent("Pending changes");
    expect(sessionStorage.getItem(`${DRAFT_RECOVERY_STORAGE_PREFIX}page-1`)).not.toBeNull();

    await act(async () => { vi.advanceTimersByTime(750); });
    expect(screen.getByRole("status")).toHaveTextContent("Saving changes");
    await act(async () => { resolveSave?.({ ...draftPage, version: 2 }); await Promise.resolve(); });
    expect(screen.getByRole("status")).toHaveTextContent("Changes saved");
    expect(sessionStorage.getItem(`${DRAFT_RECOVERY_STORAGE_PREFIX}page-1`)).toBeNull();
    vi.useRealTimers();
  });
});
