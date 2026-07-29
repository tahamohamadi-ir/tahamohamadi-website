import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getPublicPage, PublicApiError } from "./api";

const page = {
  id: "page-1",
  slug_fa: "خانه",
  slug_en: "home",
  title_fa: "خانه",
  title_en: "Home",
  page_type: "landing",
  status: "published",
  published_at: "2026-07-29T00:00:00Z",
  sections: [],
};

describe("getPublicPage", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it.each(["fa", "en"] as const)("requests the page in the %s locale", async (locale) => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(page),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPublicPage("home", locale)).resolves.toEqual(page);

    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.example.test/api/public/pages/home/?locale=${locale}`,
      expect.any(Object),
    );
  });

  it("returns null for a missing public page", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    await expect(getPublicPage("missing", "en")).resolves.toBeNull();
  });

  it("preserves server failures as a status-bearing error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    await expect(getPublicPage("home", "fa")).rejects.toMatchObject({
      name: "PublicApiError",
      status: 503,
      path: "/public/pages/home/?locale=fa",
    } satisfies Partial<PublicApiError>);
  });

  it("preserves network failures instead of treating them as not found", async () => {
    const networkError = new TypeError("Failed to fetch");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(networkError));

    await expect(getPublicPage("home", "en")).rejects.toBe(networkError);
  });
});
