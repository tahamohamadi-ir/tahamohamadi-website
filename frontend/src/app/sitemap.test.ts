import { afterEach, describe, expect, it, vi } from "vitest";

import sitemap from "./sitemap";

function response(results: unknown[]) {
  return new Response(JSON.stringify({ results, next: null }), { status: 200 });
}

describe("sitemap identity resources", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("includes research and publications only when both locales expose the resource", async () => {
    vi.stubGlobal("fetch", vi.fn((url: string) => {
      if (url.includes("research-projects/?locale=fa")) {
        return Promise.resolve(response([
          { slug_fa: "pajohesh", slug_en: "research", published_at: "2026-01-01T00:00:00Z" },
          { slug_fa: "only-fa", slug_en: "missing-en", published_at: "2026-01-01T00:00:00Z" },
        ]));
      }
      if (url.includes("research-projects/?locale=en")) {
        return Promise.resolve(response([
          { slug_fa: "pajohesh", slug_en: "research", published_at: "2026-01-01T00:00:00Z" },
        ]));
      }
      if (url.includes("publications/?locale=fa") || url.includes("publications/?locale=en")) {
        return Promise.resolve(response([
          { slug_fa: "neshr", slug_en: "publication", published_on: "2026-02-02" },
        ]));
      }
      return Promise.resolve(response([]));
    }));

    const entries = await sitemap();

    expect(entries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        url: "https://tahamohamadi.ir/fa/research/pajohesh",
        alternates: { languages: { fa: "https://tahamohamadi.ir/fa/research/pajohesh", en: "https://tahamohamadi.ir/en/research/research" } },
      }),
      expect.objectContaining({
        url: "https://tahamohamadi.ir/en/publications/publication",
        alternates: { languages: { fa: "https://tahamohamadi.ir/fa/publications/neshr", en: "https://tahamohamadi.ir/en/publications/publication" } },
      }),
    ]));
    expect(entries.map((entry) => entry.url)).not.toContain("https://tahamohamadi.ir/fa/research/only-fa");
  });
});
