import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getPublicPage } from "@/lib/api";
import CustomCmsPage, { generateMetadata } from "./page";

const { notFoundMock } = vi.hoisted(() => ({ notFoundMock: vi.fn() }));

vi.mock("@/lib/api", () => ({ getPublicPage: vi.fn() }));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));

const getPublicPageMock = vi.mocked(getPublicPage);

describe("custom CMS page route", () => {
  beforeEach(() => {
    getPublicPageMock.mockReset();
    notFoundMock.mockReset();
    getPublicPageMock.mockResolvedValue({
      id: "page-1",
      slug_fa: "درباره-من",
      slug_en: "about-me",
      title_fa: "درباره من",
      title_en: "About me",
      page_type: "custom",
      status: "published",
      published_at: null,
      sections: [{
        id: "section-1",
        ordering: 0,
        enabled: true,
        layout: "full-width",
        blocks: [{
          id: "block-1",
          block_type: "text",
          settings: { content: "محتوای صفحه", alignment: "start" },
          ordering: 0,
        }],
      }],
    });
  });

  it("loads a published page from its localized slug and renders its blocks", async () => {
    render(await CustomCmsPage({ params: Promise.resolve({ locale: "fa", slug: "درباره-من" }) }));

    expect(getPublicPageMock).toHaveBeenCalledWith("درباره-من", "fa");
    expect(screen.getByText("محتوای صفحه")).toBeInTheDocument();
    expect(screen.getByText("محتوای صفحه").closest("[dir='rtl']")).toBeInTheDocument();
  });

  it("publishes locale-specific canonical and alternate routes in metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en", slug: "about-me" }),
    });

    expect(metadata.title).toBe("About me");
    expect(metadata.alternates).toEqual({
      canonical: "/en/about-me",
      languages: { fa: "/fa/درباره-من", en: "/en/about-me" },
    });
  });
});
