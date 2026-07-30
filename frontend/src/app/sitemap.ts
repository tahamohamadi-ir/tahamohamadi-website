import type { MetadataRoute } from "next";

import { SITE_URL, locales } from "@/lib/i18n";

/**
 * Backend API base URL for server-side fetches (sitemap generation runs at build/revalidation time).
 */
function getApiBaseUrl(): string {
    if (process.env.INTERNAL_API_URL) {
        return process.env.INTERNAL_API_URL;
    }
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

interface SitemapArticle {
    slug_fa: string;
    slug_en: string;
    published_at: string | null;
}

interface SitemapCaseStudy {
    slug_fa: string;
    slug_en: string;
    published_at: string | null;
}

interface SitemapPage {
    slug_fa: string;
    slug_en: string;
    published_at: string | null;
}

interface SitemapIdentityResource {
    slug_fa: string;
    slug_en: string;
    published_at?: string | null;
    published_on?: string | null;
}

/**
 * Fetch all published blog articles for sitemap.
 * Iterates through all pages to collect every published article slug.
 */
async function fetchAllArticles(): Promise<SitemapArticle[]> {
    const baseUrl = getApiBaseUrl();
    const articles: SitemapArticle[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        try {
            const response = await fetch(
                `${baseUrl}/api/public/blog/articles?page=${page}&page_size=100`,
                { next: { revalidate: 3600 } }
            );

            if (!response.ok) break;

            const data = await response.json();
            const results = data.results || [];

            for (const article of results) {
                articles.push({
                    slug_fa: article.slug_fa,
                    slug_en: article.slug_en,
                    published_at: article.published_at,
                });
            }

            hasMore = data.next !== null;
            page++;
        } catch {
            break;
        }
    }

    return articles;
}

/**
 * Fetch all published portfolio case studies for sitemap.
 */
async function fetchAllCaseStudies(): Promise<SitemapCaseStudy[]> {
    const baseUrl = getApiBaseUrl();
    const caseStudies: SitemapCaseStudy[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        try {
            const response = await fetch(
                `${baseUrl}/api/public/portfolio/?page=${page}&page_size=100`,
                { next: { revalidate: 3600 } }
            );

            if (!response.ok) break;

            const data = await response.json();
            const results = data.results || [];

            for (const study of results) {
                caseStudies.push({
                    slug_fa: study.slug_fa,
                    slug_en: study.slug_en,
                    published_at: study.published_at,
                });
            }

            hasMore = data.next !== null;
            page++;
        } catch {
            break;
        }
    }

    return caseStudies;
}

/**
 * Fetch all publicly accessible identity resources for one locale. The caller
 * intersects locale results before exposing hreflang alternates, so an
 * incomplete translation can never create a sitemap URL to a 404 route.
 */
async function fetchAllIdentityResources(
    resource: "research-projects" | "publications",
    locale: "fa" | "en",
): Promise<SitemapIdentityResource[]> {
    const baseUrl = getApiBaseUrl();
    const resources: SitemapIdentityResource[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        try {
            const response = await fetch(
                `${baseUrl}/api/public/identity/${resource}/?locale=${locale}&page=${page}&page_size=100`,
                { next: { revalidate: 3600 } },
            );
            if (!response.ok) break;

            const data = await response.json();
            const results = data.results || [];
            resources.push(...results.map((item: SitemapIdentityResource) => ({
                slug_fa: item.slug_fa,
                slug_en: item.slug_en,
                published_at: item.published_at ?? item.published_on ?? null,
            })));
            hasMore = data.next !== null;
            page++;
        } catch {
            break;
        }
    }

    return resources;
}

function resourcesAvailableInBothLocales(
    farsi: SitemapIdentityResource[],
    english: SitemapIdentityResource[],
): SitemapIdentityResource[] {
    const pairKey = (item: SitemapIdentityResource) => `${item.slug_fa}\u0000${item.slug_en}`;
    const englishPairs = new Set(english.map(pairKey));
    return farsi.filter((item) => (
        Boolean(item.slug_fa && item.slug_en) && englishPairs.has(pairKey(item))
    ));
}

/**
 * Fetch all published CMS pages for sitemap.
 * Uses a dedicated sitemap endpoint if available, falls back to known static pages.
 */
async function fetchAllPages(): Promise<SitemapPage[]> {
    const baseUrl = getApiBaseUrl();

    try {
        const response = await fetch(`${baseUrl}/api/public/pages/`, {
            next: { revalidate: 3600 },
        });

        if (!response.ok) return [];

        const data = await response.json();
        const results = Array.isArray(data) ? data : data.results || [];

        return results.map(
            (page: { slug_fa: string; slug_en: string; published_at: string | null }) => ({
                slug_fa: page.slug_fa,
                slug_en: page.slug_en,
                published_at: page.published_at,
            })
        );
    } catch {
        return [];
    }
}

/**
 * Generate the dynamic sitemap for TahaMohamadi.ir.
 * Includes all published pages, blog articles, and portfolio case studies
 * for both locales (fa and en).
 *
 * Requirements: 10.6
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [articles, caseStudies, pages, researchFa, researchEn, publicationsFa, publicationsEn] = await Promise.all([
        fetchAllArticles(),
        fetchAllCaseStudies(),
        fetchAllPages(),
        fetchAllIdentityResources("research-projects", "fa"),
        fetchAllIdentityResources("research-projects", "en"),
        fetchAllIdentityResources("publications", "fa"),
        fetchAllIdentityResources("publications", "en"),
    ]);
    const researchProjects = resourcesAvailableInBothLocales(researchFa, researchEn);
    const publications = resourcesAvailableInBothLocales(publicationsFa, publicationsEn);

    const entries: MetadataRoute.Sitemap = [];

    // Static pages for each locale
    const staticPaths = ["", "/blog", "/portfolio"];

    for (const locale of locales) {
        for (const path of staticPaths) {
            entries.push({
                url: `${SITE_URL}/${locale}${path}`,
                lastModified: new Date(),
                changeFrequency: path === "" ? "weekly" : "daily",
                priority: path === "" ? 1.0 : 0.8,
                alternates: {
                    languages: Object.fromEntries(
                        locales.map((l) => [l, `${SITE_URL}/${l}${path}`])
                    ),
                },
            });
        }
    }

    // CMS pages (excluding "home" which is the root)
    for (const page of pages) {
        // Skip the home page as it's already covered by the static root entry
        if (page.slug_fa === "home" || page.slug_en === "home") continue;

        for (const locale of locales) {
            const slug = locale === "fa" ? page.slug_fa : page.slug_en;
            if (!slug) continue;

            entries.push({
                url: `${SITE_URL}/${locale}/${slug}`,
                lastModified: page.published_at ? new Date(page.published_at) : new Date(),
                changeFrequency: "monthly",
                priority: 0.7,
                alternates: {
                    languages: {
                        fa: `${SITE_URL}/fa/${page.slug_fa}`,
                        en: `${SITE_URL}/en/${page.slug_en}`,
                    },
                },
            });
        }
    }

    // Blog articles
    for (const article of articles) {
        for (const locale of locales) {
            const slug = locale === "fa" ? article.slug_fa : article.slug_en;
            if (!slug) continue;

            entries.push({
                url: `${SITE_URL}/${locale}/blog/${slug}`,
                lastModified: article.published_at
                    ? new Date(article.published_at)
                    : new Date(),
                changeFrequency: "monthly",
                priority: 0.6,
                alternates: {
                    languages: {
                        fa: `${SITE_URL}/fa/blog/${article.slug_fa}`,
                        en: `${SITE_URL}/en/blog/${article.slug_en}`,
                    },
                },
            });
        }
    }

    // Portfolio case studies
    for (const study of caseStudies) {
        for (const locale of locales) {
            const slug = locale === "fa" ? study.slug_fa : study.slug_en;
            if (!slug) continue;

            entries.push({
                url: `${SITE_URL}/${locale}/portfolio/${slug}`,
                lastModified: study.published_at
                    ? new Date(study.published_at)
                    : new Date(),
                changeFrequency: "monthly",
                priority: 0.6,
                alternates: {
                    languages: {
                        fa: `${SITE_URL}/fa/portfolio/${study.slug_fa}`,
                        en: `${SITE_URL}/en/portfolio/${study.slug_en}`,
                    },
                },
            });
        }
    }

    for (const project of researchProjects) {
        for (const locale of locales) {
            const slug = locale === "fa" ? project.slug_fa : project.slug_en;
            entries.push({
                url: `${SITE_URL}/${locale}/research/${slug}`,
                lastModified: project.published_at ? new Date(project.published_at) : new Date(),
                changeFrequency: "monthly",
                priority: 0.6,
                alternates: {
                    languages: {
                        fa: `${SITE_URL}/fa/research/${project.slug_fa}`,
                        en: `${SITE_URL}/en/research/${project.slug_en}`,
                    },
                },
            });
        }
    }

    for (const publication of publications) {
        for (const locale of locales) {
            const slug = locale === "fa" ? publication.slug_fa : publication.slug_en;
            entries.push({
                url: `${SITE_URL}/${locale}/publications/${slug}`,
                lastModified: publication.published_at ? new Date(publication.published_at) : new Date(),
                changeFrequency: "monthly",
                priority: 0.6,
                alternates: {
                    languages: {
                        fa: `${SITE_URL}/fa/publications/${publication.slug_fa}`,
                        en: `${SITE_URL}/en/publications/${publication.slug_en}`,
                    },
                },
            });
        }
    }

    return entries;
}
