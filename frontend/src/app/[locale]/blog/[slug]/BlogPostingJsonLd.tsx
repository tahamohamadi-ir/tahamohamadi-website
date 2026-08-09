import { SITE_URL, type Locale } from "@/lib/i18n";

interface MediaAssetDTO {
    file_url: string;
    width: number | null;
    height: number | null;
}

interface TopicDTO {
    name_fa: string;
    name_en: string;
}

interface ArticleData {
    id: string;
    slug_fa: string;
    slug_en: string;
    title_fa: string;
    title_en: string;
    excerpt_fa: string;
    excerpt_en: string;
    featured_image: MediaAssetDTO | null;
    topics: TopicDTO[];
    status: string;
    published_at: string | null;
    reading_time_fa: number;
    reading_time_en: number;
}

interface BlogPostingJsonLdProps {
    article: ArticleData;
    locale: Locale;
    slug: string;
    wordCount: number;
}

/**
 * Generates BlogPosting JSON-LD structured data.
 * Only renders for published, complete articles (Req 6.9, 10.5).
 */
export function BlogPostingJsonLd({
    article,
    locale,
    slug,
    wordCount,
}: BlogPostingJsonLdProps) {
    // Only generate structured data for published articles (Req 6.9)
    if (article.status !== "published" || !article.published_at) {
        return null;
    }

    const title = locale === "fa" ? article.title_fa : article.title_en;
    const description = locale === "fa" ? article.excerpt_fa : article.excerpt_en;
    const readingTime = locale === "fa" ? article.reading_time_fa : article.reading_time_en;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: title,
        description: description || undefined,
        url: `${SITE_URL}/${locale}/blog/${slug}`,
        datePublished: article.published_at,
        inLanguage: locale === "fa" ? "fa-IR" : "en-US",
        author: {
            "@type": "Person",
            name: locale === "fa" ? "طاها محمدی" : "Taha Mohamadi",
            url: `${SITE_URL}/${locale}`,
        },
        publisher: {
            "@type": "Person",
            name: locale === "fa" ? "طاها محمدی" : "Taha Mohamadi",
            url: `${SITE_URL}/${locale}`,
        },
        ...(article.featured_image && {
            image: {
                "@type": "ImageObject",
                url: article.featured_image.file_url,
                ...(article.featured_image.width && {
                    width: article.featured_image.width,
                }),
                ...(article.featured_image.height && {
                    height: article.featured_image.height,
                }),
            },
        }),
        ...(article.topics.length > 0 && {
            keywords: article.topics
                .map((t) => (locale === "fa" ? t.name_fa : t.name_en))
                .join(", "),
        }),
        ...(wordCount > 0 && { wordCount }),
        ...(readingTime > 0 && {
            timeRequired: `PT${readingTime}M`,
        }),
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${SITE_URL}/${locale}/blog/${slug}`,
        },
    };
    const serializedJsonLd = JSON.stringify(jsonLd).replace(/</g, "\\u003c");

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializedJsonLd }}
        />
    );
}
