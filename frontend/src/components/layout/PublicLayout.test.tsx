import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PublicLayout } from "./PublicLayout";
import { fetchPublicSiteConfig, getPublicPage } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  fetchPublicSiteConfig: vi.fn(),
  getPublicPage: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en",
}));

const fetchPublicSiteConfigMock = vi.mocked(fetchPublicSiteConfig);
const getPublicPageMock = vi.mocked(getPublicPage);

describe("PublicLayout", () => {
  beforeEach(() => {
    fetchPublicSiteConfigMock.mockReset();
    getPublicPageMock.mockReset();
  });

  it("uses the published Home hero title when site settings have no brand", async () => {
    fetchPublicSiteConfigMock.mockResolvedValue({
      settings: null,
      navigation: { header: [], footer: [] },
    });
    getPublicPageMock.mockResolvedValue({
      id: "home",
      slug_fa: "خانه",
      slug_en: "home",
      title_fa: "خانه",
      title_en: "Home",
      page_type: "home",
      published_at: null,
      sections: [
        {
          id: "hero",
          ordering: 0,
          layout: "hero",
          blocks: [
            {
              id: "hero-block",
              block_type: "hero",
              settings: { title: "Published Identity" },
              ordering: 0,
            },
          ],
        },
      ],
    } as Awaited<ReturnType<typeof getPublicPage>>);

    const result = await PublicLayout({ locale: "en", children: <p>Page content</p> });
    render(result);

    expect(screen.getByRole("link", { name: "Published Identity" })).toHaveAttribute("href", "/en");
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });
});
