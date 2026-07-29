import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
    isValidLocale,
    getAlternateLocale,
    SITE_URL,
    type Locale,
} from "@/lib/i18n";
import { fetchPublicAPI } from "@/lib/api";
import { BlockRenderer, filterKnownBlocks } from "@/components/blocks";
import type { BlockDTO } from "@/components/blocks";
import { TableOfContents } from "./TableOfContents";
import { RelatedArticles } from "./RelatedArticles";
import { ArticleNavigation } from "./ArticleNavigation";
import { BlogPostingJsonLd } from "./BlogPostingJsonLd";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface TopicDTO {
    id: string;
    slug: string;
    name_fa: string;
    name_en: string;
}

interface MediaAssetDTO {
    id: string;
    file_url: string;
    alt_text_fa: string;
    alt_text_en: string;
    caption_fa: string;
    caption_en: string;
    width: number | null;
    height: number | null;
}

interface ArticleDetailDTO {
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
    blocks: BlockDTO[];
    related_articles: RelatedArticleDTO[];
    previous_article: ArticleNavItemDTO | null;
    next_article: ArticleNavItemDTO | null;
}

interface RelatedArticleDTO {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    featured_image: MediaAssetDTO | null;
    published_at: string | null;
    reading_time: number;
}

interface ArticleNavItemDTO {
    slug: string;
    title: string;
}

interface TOCItem {
    id: string;
    text: string;
    level: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getLocalizedString(
    obj: ArticleDetailDTO,
    field: "title" | "excerpt" | "slug",
    locale: Locale
): string {
    const key = `${field}_${locale}` as keyof ArticleDetailDTO;
    return (obj[key] as string) ?? "";
}

function generateTOC(blocks: BlockDTO[]): TOCItem[] {
    return blocks
        .filter((block) => block.block_type === "heading")
        .map((block) => {
            const content = block.content as { text?: string; level?: number; id?: string } | undefined;
            if (!content) return null;
            const id = content.id || slugify(content.text || "");
            return {
                id,
                text: content.text || "",
                level: content.level || 2,
            };
        })
        .filter((item): item is TOCItem => item !== null && item.text !== "");
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s\u0600-\u06FF-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
}

function calculateWordCount(blocks: BlockDTO[]): number {
    let count = 0;
    for (const block of blocks) {
        const content = block.content as Record<string, unknown> | undefined;
        if (!content) continue;

        if (block.block_type === "paragraph" || block.block_type === "heading") {
            const text = (content.text as string) || "";
            count += text.split(/\s+/).filter(Boolean).length;
        } else if (block.block_type === "list") {
            const items = (content.items as string[]) || [];
            for (const item of items) {
                count += item.split(/\s+/).filter(Boolean).length;
            }
        } else if (block.block_type === "quote") {
            const text = (content.text as string) || "";
            count += text.split(/\s+/).filter(Boolean).length;
        } else if (block.block_type === "callout") {
            const text = (content.text as string) || "";
            count += text.split(/\s+/).filter(Boolean).length;
        }
    }
    return count;
}

// ─── Data Fetching ─────────────────────────────────────────────────────────────

async function getArticle(slug: string, locale: Locale): Promise<ArticleDetailDTO | null> {
    try {
        return await fetchPublicAPI<ArticleDetailDTO>(
            `/public/blog/articles/${slug}?locale=${locale}`
        );
    } catch {
        return null;
    }
}

// ─── Metadata ──────────────────────────────────────────────────────────────────

interface BlogDetailPageProps {
    params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({
    params,
}: BlogDetailPageProps): Promise<Metadata> {
    const { locale, slug } = await params;
    if (!isValidLocale(locale)) return {};

    const article = await getArticle(slug, locale);
    if (!article) return {};

    const title = getLocalizedString(article, "title", locale);
    const description = getLocalizedString(article, "excerpt", locale) || title;
    const altLocale = getAlternateLocale(locale);

    const images: { url: string; width?: number; height?: number; alt?: string }[] = [];
    if (article.featured_image) {
        images.push({
            url: article.featured_image.file_url,
            width: article.featured_image.width ?? undefined,
            height: article.featured_image.height ?? undefined,
            alt: locale === "fa"
                ? article.featured_image.alt_text_fa
                : article.featured_image.alt_text_en,
        });
    }

    return {
        title,
        description,
        alternates: {
            canonical: `/${locale}/blog/${slug}`,
            languages: {
                fa: `/fa/blog/${article.slug_fa}`,
                en: `/en/blog/${article.slug_en}`,
                "x-default": `/${locale}/blog/${slug}`,
            },
        },
        openGraph: {
            title,
            description,
            url: `${SITE_URL}/${locale}/blog/${slug}`,
            siteName: locale === "fa" ? "طاها محمدی" : "Taha Mohamadi",
            locale: locale === "fa" ? "fa_IR" : "en_US",
            alternateLocale: altLocale === "fa" ? "fa_IR" : "en_US",
            type: "article",
            publishedTime: article.published_at ?? undefined,
            authors: [locale === "fa" ? "طاها محمدی" : "Taha Mohamadi"],
            tags: article.topics.map((t) =>
                locale === "fa" ? t.name_fa : t.name_en
            ),
            images,
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: article.featured_image ? [article.featured_image.file_url] : undefined,
        },
        robots: {
            index: true,
            follow: true,
        },
    };
}

// ─── Page Component ────────────────────────────────────────────────────────────

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
    const { locale, slug } = await params;

    if (!isValidLocale(locale)) {
        notFound();
    }

    const validLocale: Locale = locale;
    const article = await getArticle(slug, validLocale);

    if (!article || article.status !== "published") {
        notFound();
    }

    const title = getLocalizedString(article, "title", validLocale);
    const excerpt = getLocalizedString(article, "excerpt", validLocale);
    const readingTime = validLocale === "fa" ? article.reading_time_fa : article.reading_time_en;
    const knownBlocks = filterKnownBlocks(article.blocks, "article");
    const tocItems = generateTOC(knownBlocks);

    const featuredImageAlt = article.featured_image
        ? validLocale === "fa"
            ? article.featured_image.alt_text_fa
            : article.featured_image.alt_text_en
        : "";

    const formattedDate = article.published_at
        ? new Date(article.published_at).toLocaleDateString(
            validLocale === "fa" ? "fa-IR" : "en-US",
            { year: "numeric", month: "long", day: "numeric" }
        )
        : null;

    return (
        <>
            {/* Structured Data — only for published, complete articles (Req 6.9) */}
            <BlogPostingJsonLd
                article={article}
                locale={validLocale}
                slug={slug}
                wordCount={calculateWordCount(knownBlocks)}
            />

            <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Article Header */}
                <header className="mb-8 space-y-4">
                    {/* Topics */}
                    {article.topics.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {article.topics.map((topic) => (
                                <a
                                    key={topic.id}
                                    href={`/${validLocale}/blog?topic=${topic.slug}`}
                                    className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                                >
                                    {validLocale === "fa" ? topic.name_fa : topic.name_en}
                                </a>
                            ))}
                        </div>
                    )}

                    {/* Title */}
                    <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
                        {title}
                    </h1>

                    {/* Excerpt */}
                    {excerpt && (
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            {excerpt}
                        </p>
                    )}

                    {/* Meta: Date + Reading Time */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {formattedDate && (
                            <time dateTime={article.published_at ?? undefined}>
                                {formattedDate}
                            </time>
                        )}
                        {readingTime > 0 && (
                            <span className="flex items-center gap-1">
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                {validLocale === "fa"
                                    ? `${readingTime} دقیقه مطالعه`
                                    : `${readingTime} min read`}
                            </span>
                        )}
                    </div>
                </header>

                {/* Featured Image */}
                {article.featured_image && (
                    <figure className="mb-8 overflow-hidden rounded-lg">
                        <img
                            src={article.featured_image.file_url}
                            alt={featuredImageAlt}
                            width={article.featured_image.width ?? undefined}
                            height={article.featured_image.height ?? undefined}
                            className="w-full object-cover"
                        />
                    </figure>
                )}

                {/* Content Layout: TOC + Article Body */}
                <div className="lg:grid lg:grid-cols-[1fr_250px] lg:gap-8">
                    {/* Article Body */}
                    <div className="prose prose-lg max-w-none dark:prose-invert space-y-6">
                        {knownBlocks.map((block) => (
                            <BlockRenderer
                                key={block.id}
                                block={block}
                                locale={validLocale}
                                context="article"
                            />
                        ))}
                    </div>

                    {/* Table of Contents (desktop sidebar) */}
                    {tocItems.length > 0 && (
                        <aside className="hidden lg:block" aria-label={validLocale === "fa" ? "فهرست مطالب" : "Table of Contents"}>
                            <TableOfContents items={tocItems} locale={validLocale} />
                        </aside>
                    )}
                </div>

                {/* Previous/Next Navigation */}
                <ArticleNavigation
                    previous={article.previous_article}
                    next={article.next_article}
                    locale={validLocale}
                />
            </article>

            {/* Related Articles */}
            {article.related_articles.length > 0 && (
                <RelatedArticles
                    articles={article.related_articles}
                    locale={validLocale}
                />
            )}
        </>
    );
}
