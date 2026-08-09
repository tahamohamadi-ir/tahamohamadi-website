import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getArticle } from "@/lib/api";
import BlogDetailPage, { generateMetadata } from "./page";

const { notFoundMock } = vi.hoisted(() => ({ notFoundMock: vi.fn() }));

vi.mock("@/lib/api", () => ({ getArticle: vi.fn() }));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));
vi.mock("@/components/blocks", () => ({
  BlockRenderer: () => null,
  filterKnownBlocks: (blocks: unknown[]) => blocks,
}));
vi.mock("./TableOfContents", () => ({ TableOfContents: () => null }));
vi.mock("./RelatedArticles", () => ({
  RelatedArticles: ({ articles }: { articles: Array<{ title: string }> }) => (
    <section aria-label="related">{articles.map((article) => article.title).join(", ")}</section>
  ),
}));
vi.mock("./BlogPostingJsonLd", () => ({ BlogPostingJsonLd: () => null }));

const getArticleMock = vi.mocked(getArticle);

const article = {
  id: "article-1",
  slug_fa: "article-fa",
  slug_en: "article-en",
  title_fa: "Ù…Ù‚Ø§Ù„Ù‡",
  title_en: "Article",
  excerpt_fa: "Ø®Ù„Ø§ØµÙ‡",
  excerpt_en: "Summary",
  featured_image: null,
  topics: [],
  status: "published",
  published_at: "2026-08-01T12:00:00Z",
  updated_at: "2026-08-07T15:30:00Z",
  reading_time: 4,
  blocks: [],
  toc: [],
  related: [
    {
      id: "related-1",
      slug_fa: "related-fa",
      slug_en: "related-en",
      title_fa: "Ù…Ø±ØªØ¨Ø·",
      title_en: "Related",
      excerpt_fa: "",
      excerpt_en: "Related summary",
      featured_image: null,
      topics: [],
      status: "published",
      published_at: "2026-08-02T12:00:00Z",
      updated_at: "2026-08-06T12:00:00Z",
      reading_time: 2,
    },
  ],
};

describe("public Blog detail route", () => {
  beforeEach(() => {
    notFoundMock.mockReset();
    getArticleMock.mockReset();
    getArticleMock.mockResolvedValue(article);
  });

  it("renders canonical localized reading, related and updated fields", async () => {
    render(
      await BlogDetailPage({
        params: Promise.resolve({ locale: "en", slug: "article-en" }),
      }),
    );

    expect(getArticleMock).toHaveBeenCalledWith("article-en", "en");
    expect(screen.getByText("4 min read")).toBeInTheDocument();
    expect(screen.getByText("Related")).toBeInTheDocument();
    expect(screen.getByText(/Updated/)).toHaveAttribute(
      "datetime",
      "2026-08-07T15:30:00Z",
    );
    expect(screen.queryByLabelText("article navigation")).not.toBeInTheDocument();
  });

  it("publishes updated time from the backend contract in metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en", slug: "article-en" }),
    });

    expect(metadata.openGraph).toMatchObject({
      publishedTime: "2026-08-01T12:00:00Z",
      modifiedTime: "2026-08-07T15:30:00Z",
    });
  });
});
