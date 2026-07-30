import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ResumePage from "./page";

const { fetchPublicSiteAggregateMock, fetchResumeVariantsMock, getPublicPageMock } = vi.hoisted(() => ({
  fetchPublicSiteAggregateMock: vi.fn(),
  fetchResumeVariantsMock: vi.fn(),
  getPublicPageMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  fetchPublicSiteAggregate: fetchPublicSiteAggregateMock,
  fetchResumeVariants: fetchResumeVariantsMock,
  getPublicPage: getPublicPageMock,
}));

const emptyVariants = { count: 0, page: 1, page_size: 12, total_pages: 1, results: [] };

describe("ResumePage aggregate fallback", () => {
  beforeEach(() => {
    getPublicPageMock.mockResolvedValue(null);
    fetchResumeVariantsMock.mockResolvedValue(emptyVariants);
  });

  it("uses the published headline for the requested locale", async () => {
    fetchPublicSiteAggregateMock.mockResolvedValue({
      identity: { profile: { headline: "Researcher and software engineer" } },
    });

    render(await ResumePage({ params: Promise.resolve({ locale: "en" }), searchParams: Promise.resolve({}) }));

    expect(screen.getByText("Researcher and software engineer")).toBeInTheDocument();
    expect(fetchPublicSiteAggregateMock).toHaveBeenCalledWith("en");
  });

  it("keeps the local page copy when no profile is published", async () => {
    fetchPublicSiteAggregateMock.mockResolvedValue({ identity: { profile: null } });

    render(await ResumePage({ params: Promise.resolve({ locale: "en" }), searchParams: Promise.resolve({}) }));

    expect(screen.getByText("Published resume variants")).toBeInTheDocument();
  });
});
