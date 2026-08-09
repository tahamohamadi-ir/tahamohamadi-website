import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PageDTO } from "@/lib/types";
import HomePage from "./page";
import { getPublicPage } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  getPublicPage: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

const getPublicPageMock = vi.mocked(getPublicPage);

describe("HomePage", () => {
  beforeEach(() => {
    getPublicPageMock.mockReset();
  });

  it("renders sections returned by the published public projection", async () => {
    getPublicPageMock.mockResolvedValue({
      id: "home-page",
      slug_fa: "خانه",
      slug_en: "home",
      title_fa: "صفحه اصلی",
      title_en: "Home",
      page_type: "home",
      status: "published",
      published_at: "2026-07-28T00:00:00Z",
      sections: [
        {
          id: "hero-section",
          ordering: 0,
          layout: "hero",
          enabled: true,
          blocks: [
            {
              id: "hero-block",
              block_type: "hero",
              settings: { title: "Taha Mohamadi", subtitle: "Researcher & Software Developer" },
              ordering: 0,
            },
          ],
        },
      ],
    } as PageDTO);

    const result = await HomePage({ params: Promise.resolve({ locale: "en" }) });
    render(result);

    expect(screen.getByRole("heading", { level: 1, name: "Taha Mohamadi" })).toBeInTheDocument();
  });
});
