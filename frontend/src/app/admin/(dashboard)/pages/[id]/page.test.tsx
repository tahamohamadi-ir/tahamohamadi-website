import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
  ComposerCanvas: () => <div data-testid="composer-canvas">Composer</div>,
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

describe("PageEditorPage", () => {
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
});
