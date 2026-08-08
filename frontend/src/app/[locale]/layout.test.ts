import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPublicSiteConfig } from "@/lib/api";
import { generateMetadata } from "./layout";

vi.mock("@/lib/api", () => ({
  fetchPublicSiteConfig: vi.fn(),
}));

vi.mock("@/lib/fonts", () => ({
  inter: { variable: "" },
  vazirmatn: { variable: "" },
}));

vi.mock("@/components/layout", () => ({
  PublicLayout: () => null,
}));

const fetchPublicSiteConfigMock = vi.mocked(fetchPublicSiteConfig);

describe("locale metadata", () => {
  beforeEach(() => {
    fetchPublicSiteConfigMock.mockReset();
  });

  it("uses the requested locale's published CMS metadata", async () => {
    fetchPublicSiteConfigMock.mockResolvedValue({
      settings: {
        site_title: "Published Identity",
        default_title: "Published Research",
        default_description: "Published description",
        public_email: "",
        primary_cta_label: "",
        primary_cta_url: "",
        footer_text: "",
      },
      navigation: { header: [], footer: [] },
    });

    const metadata = await generateMetadata({ params: Promise.resolve({ locale: "en" }) });

    expect(metadata.title).toEqual({
      default: "Published Research",
      template: "%s | Published Identity",
    });
    expect(metadata.description).toBe("Published description");
    expect(metadata.openGraph).toMatchObject({
      title: "Published Research",
      description: "Published description",
      siteName: "Published Identity",
    });
  });
});
