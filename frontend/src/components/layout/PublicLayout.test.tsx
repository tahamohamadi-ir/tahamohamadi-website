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
      status: "published",
      published_at: null,
      sections: [
        {
          id: "hero",
          ordering: 0,
          layout: "hero",
          enabled: true,
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

  it("uses only the published CMS header navigation for the requested locale", async () => {
    fetchPublicSiteConfigMock.mockResolvedValue({
      settings: {
        site_title: "Published Identity",
        primary_cta_label: "Published contact",
        primary_cta_url: "/en/contact",
      } as NonNullable<
        Awaited<ReturnType<typeof fetchPublicSiteConfig>>["settings"]
      >,
      navigation: {
        header: [{ label: "Published Research", href: "/en/research" }],
        footer: [],
      },
    });
    getPublicPageMock.mockResolvedValue(null);

    const result = await PublicLayout({ locale: "en", children: <p>Page content</p> });
    render(result);

    expect(screen.getAllByRole("link", { name: "Published Research" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Published Research" })[0]).toHaveAttribute("href", "/en/research");
    expect(screen.getByRole("link", { name: "Published contact" })).toHaveAttribute("href", "/en/contact");
    expect(screen.queryByRole("link", { name: "Portfolio" })).not.toBeInTheDocument();
  });
});
