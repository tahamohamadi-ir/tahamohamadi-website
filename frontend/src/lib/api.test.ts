import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchArticles,
  fetchPublications,
  fetchResearchProject,
  fetchResearchProjects,
  fetchTopics,
  getPublicPage,
  PublicApiError,
} from "./api";

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

describe("public blog API paths", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses a trailing slash and preserves q in article list requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ count: 0, next: null, previous: null, results: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchArticles({ locale: "fa", page: 2, topic: "python", q: "django" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/public/blog/articles/?locale=fa&page=2&page_size=9&topic=python&q=django",
      expect.any(Object),
    );
  });

  it("uses the public topics endpoint with its trailing slash", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchTopics();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/public/blog/topics/",
      expect.any(Object),
    );
  });
});

describe("public identity resource API paths", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("preserves locale, pagination and publication filters", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({}) });
    vi.stubGlobal("fetch", fetchMock);

    await fetchResearchProjects({ locale: "fa", page: 2, pageSize: 6 });
    await fetchPublications({ locale: "en", type: "article", year: "2025" });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.example.test/api/public/identity/research-projects/?locale=fa&page=2&page_size=6",
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.example.test/api/public/identity/publications/?locale=en&page=1&page_size=12&type=article&year=2025",
      expect.any(Object),
    );
  });

  it("encodes a localized detail slug", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({}) });
    vi.stubGlobal("fetch", fetchMock);

    await fetchResearchProject("پژوهش نمونه", "fa");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/public/identity/research-projects/%D9%BE%DA%98%D9%88%D9%87%D8%B4%20%D9%86%D9%85%D9%88%D9%86%D9%87/?locale=fa",
      expect.any(Object),
    );
  });
});
