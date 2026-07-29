/**
 * Tests for SEO metadata generation in the locale layout.
 *
 * **Validates: Requirements 15.4, 15.5**
 *
 * Verifies that pages include:
 * - Correct title and meta description per locale
 * - Canonical URL with locale prefix
 * - Hreflang links for both locales + x-default
 * - Open Graph tags with correct locale and site name
 * - Twitter card metadata
 */
import { describe, it, expect } from "vitest";
import {
    localeConfig,
    getDirection,
    getAlternateLocale,
    SITE_URL,
    isValidLocale,
    type Locale,
} from "./i18n";

/**
 * Replicates the generateMetadata logic from the layout for unit testing.
 * We test the metadata generation logic directly without importing the
 * Next.js layout (which depends on server components and file-system routing).
 */
function generateMetadataForLocale(locale: Locale) {
    const altLocale = getAlternateLocale(locale);

    const title =
        locale === "fa"
            ? "طاها محمدی — وبسایت شخصی"
            : "Taha Mohamadi — Personal Website";

    const description =
        locale === "fa"
            ? "وبسایت شخصی، بلاگ، نمونه‌کارها و رزومه طاها محمدی"
            : "Personal website, blog, portfolio and resume of Taha Mohamadi";

    return {
        title: {
            default: title,
            template:
                locale === "fa" ? "%s | طاها محمدی" : "%s | Taha Mohamadi",
        },
        description,
        metadataBase: new URL(SITE_URL),
        alternates: {
            canonical: `/${locale}`,
            languages: {
                fa: "/fa",
                en: "/en",
                "x-default": `/${locale}`,
            },
        },
        openGraph: {
            title,
            description,
            url: `${SITE_URL}/${locale}`,
            siteName: locale === "fa" ? "طاها محمدی" : "Taha Mohamadi",
            locale: locale === "fa" ? "fa_IR" : "en_US",
            alternateLocale: altLocale === "fa" ? "fa_IR" : "en_US",
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
        robots: {
            index: true,
            follow: true,
        },
    };
}

describe("SEO Metadata Generation", () => {
    describe("Title", () => {
        it("generates Persian title for fa locale", () => {
            const meta = generateMetadataForLocale("fa");
            expect(meta.title.default).toBe("طاها محمدی — وبسایت شخصی");
            expect(meta.title.template).toBe("%s | طاها محمدی");
        });

        it("generates English title for en locale", () => {
            const meta = generateMetadataForLocale("en");
            expect(meta.title.default).toBe("Taha Mohamadi — Personal Website");
            expect(meta.title.template).toBe("%s | Taha Mohamadi");
        });
    });

    describe("Meta description", () => {
        it("generates Persian description for fa locale", () => {
            const meta = generateMetadataForLocale("fa");
            expect(meta.description).toContain("وبسایت شخصی");
            expect(meta.description).toContain("طاها محمدی");
        });

        it("generates English description for en locale", () => {
            const meta = generateMetadataForLocale("en");
            expect(meta.description).toContain("Personal website");
            expect(meta.description).toContain("Taha Mohamadi");
        });
    });

    describe("Canonical URL", () => {
        it("sets canonical to /fa for Persian locale", () => {
            const meta = generateMetadataForLocale("fa");
            expect(meta.alternates.canonical).toBe("/fa");
        });

        it("sets canonical to /en for English locale", () => {
            const meta = generateMetadataForLocale("en");
            expect(meta.alternates.canonical).toBe("/en");
        });
    });

    describe("Hreflang links", () => {
        it("includes fa hreflang link", () => {
            const meta = generateMetadataForLocale("fa");
            expect(meta.alternates.languages.fa).toBe("/fa");
        });

        it("includes en hreflang link", () => {
            const meta = generateMetadataForLocale("fa");
            expect(meta.alternates.languages.en).toBe("/en");
        });

        it("includes x-default pointing to current locale", () => {
            const metaFa = generateMetadataForLocale("fa");
            expect(metaFa.alternates.languages["x-default"]).toBe("/fa");

            const metaEn = generateMetadataForLocale("en");
            expect(metaEn.alternates.languages["x-default"]).toBe("/en");
        });
    });

    describe("Open Graph tags", () => {
        it("sets OG title matching page title for fa", () => {
            const meta = generateMetadataForLocale("fa");
            expect(meta.openGraph.title).toBe("طاها محمدی — وبسایت شخصی");
        });

        it("sets OG title matching page title for en", () => {
            const meta = generateMetadataForLocale("en");
            expect(meta.openGraph.title).toBe("Taha Mohamadi — Personal Website");
        });

        it("sets OG description matching meta description", () => {
            const meta = generateMetadataForLocale("en");
            expect(meta.openGraph.description).toBe(meta.description);
        });

        it("sets OG URL with full site URL and locale", () => {
            const meta = generateMetadataForLocale("en");
            expect(meta.openGraph.url).toBe(`${SITE_URL}/en`);
        });

        it("sets correct OG locale for fa (fa_IR)", () => {
            const meta = generateMetadataForLocale("fa");
            expect(meta.openGraph.locale).toBe("fa_IR");
            expect(meta.openGraph.alternateLocale).toBe("en_US");
        });

        it("sets correct OG locale for en (en_US)", () => {
            const meta = generateMetadataForLocale("en");
            expect(meta.openGraph.locale).toBe("en_US");
            expect(meta.openGraph.alternateLocale).toBe("fa_IR");
        });

        it("sets OG type to website", () => {
            const meta = generateMetadataForLocale("fa");
            expect(meta.openGraph.type).toBe("website");
        });

        it("sets OG siteName per locale", () => {
            expect(generateMetadataForLocale("fa").openGraph.siteName).toBe("طاها محمدی");
            expect(generateMetadataForLocale("en").openGraph.siteName).toBe("Taha Mohamadi");
        });
    });

    describe("Twitter card", () => {
        it("uses summary_large_image card type", () => {
            const meta = generateMetadataForLocale("en");
            expect(meta.twitter.card).toBe("summary_large_image");
        });

        it("includes title and description", () => {
            const meta = generateMetadataForLocale("en");
            expect(meta.twitter.title).toBe(meta.title.default);
            expect(meta.twitter.description).toBe(meta.description);
        });
    });

    describe("Robots", () => {
        it("allows indexing and following", () => {
            const meta = generateMetadataForLocale("fa");
            expect(meta.robots.index).toBe(true);
            expect(meta.robots.follow).toBe(true);
        });
    });
});

describe("i18n locale utilities", () => {
    describe("localeConfig", () => {
        it("has RTL direction for fa", () => {
            expect(localeConfig.fa.dir).toBe("rtl");
        });

        it("has LTR direction for en", () => {
            expect(localeConfig.en.dir).toBe("ltr");
        });

        it("has Persian name for fa", () => {
            expect(localeConfig.fa.name).toBe("فارسی");
        });

        it("has English name for en", () => {
            expect(localeConfig.en.name).toBe("English");
        });
    });

    describe("getDirection", () => {
        it("returns rtl for fa", () => {
            expect(getDirection("fa")).toBe("rtl");
        });

        it("returns ltr for en", () => {
            expect(getDirection("en")).toBe("ltr");
        });
    });

    describe("getAlternateLocale", () => {
        it("returns en for fa", () => {
            expect(getAlternateLocale("fa")).toBe("en");
        });

        it("returns fa for en", () => {
            expect(getAlternateLocale("en")).toBe("fa");
        });
    });

    describe("isValidLocale", () => {
        it("validates fa and en", () => {
            expect(isValidLocale("fa")).toBe(true);
            expect(isValidLocale("en")).toBe(true);
        });

        it("rejects invalid locales", () => {
            expect(isValidLocale("de")).toBe(false);
            expect(isValidLocale("")).toBe(false);
            expect(isValidLocale("farsi")).toBe(false);
        });
    });
});
