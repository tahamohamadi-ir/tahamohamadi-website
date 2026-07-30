import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AboutPage from "./page";

const { fetchPublicSiteAggregateMock, getPublicPageMock } = vi.hoisted(() => ({
  fetchPublicSiteAggregateMock: vi.fn(),
  getPublicPageMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  fetchPublicSiteAggregate: fetchPublicSiteAggregateMock,
  getPublicPage: getPublicPageMock,
}));

describe("AboutPage identity fallback", () => {
  beforeEach(() => {
    getPublicPageMock.mockResolvedValue(null);
    fetchPublicSiteAggregateMock.mockResolvedValue({
      identity: {
        profile: { name: "Taha Mohamadi", headline: "Researcher", bio: "A bilingual professional bio." },
        experience: [{ organization: "Lab", title: "Researcher", summary: "Published work", started_on: "2024-01-01", ended_on: null }],
        education: [{ institution: "University", degree: "MSc", field: "Computer Science", started_on: "2022-09-01", ended_on: "2024-06-01" }],
      },
    });
  });

  it("renders only the localized aggregate profile, experience and education when CMS content is absent", async () => {
    render(await AboutPage({ params: Promise.resolve({ locale: "en" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "Taha Mohamadi" })).toBeInTheDocument();
    expect(screen.getByText("Published work")).toBeInTheDocument();
    expect(screen.getByText("Computer Science")).toBeInTheDocument();
    expect(fetchPublicSiteAggregateMock).toHaveBeenCalledWith("en");
  });
});
