import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale, SITE_URL, type Locale } from "@/lib/i18n";
import { fetchArticles, fetchTopics } from "@/lib/api";
import type { PaginatedArticlesResponse, TopicDTO } from "@/lib/types/blog";
import {
    ArticleCard,
    TopicFilter,
    Pagination,
    BlogEmptyState,
} from "@/components/blog";

interface BlogPageProps {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const PAGE_SIZE = 9;

export async function generateMetadata({
    params,
}: BlogPageProps): Promise<Metadata> {
    const { locale } = await params;
    if (!isValidLocale(locale)) return {};

    const title = locale === "fa" ? "بلاگ" : "Blog";
    const description =
        locale === "fa"
            ? "آخرین مقالات و نوشته‌های طاها محمدی درباره فناوری، تحقیقات و برنامه‌نویسی"
            : "Latest articles and writings by Taha Mohamadi on technology, research, and programming";

    return {
        title,
        description,
        alternates: {
            canonical: `/${locale}/blog`,
            languages: {
                fa: "/fa/blog",
                en: "/en/blog",
            },
        },
        openGraph: {
            title,
            description,
            url: `${SITE_URL}/${locale}/blog`,
            type: "website",
        },
    };
}

export default async function BlogPage({ params, searchParams }: BlogPageProps) {
    const { locale } = await params;
    const resolvedSearchParams = await searchParams;

    if (!isValidLocale(locale)) {
        notFound();
    }

    const validLocale: Locale = locale;
    const currentPage = Number(resolvedSearchParams.page) || 1;
    const activeTopic =
        typeof resolvedSearchParams.topic === "string"
            ? resolvedSearchParams.topic
            : undefined;

    // Fetch data from Django API - handle gracefully if API is unavailable
    let articles: PaginatedArticlesResponse;
    let topics: TopicDTO[];

    try {
        [articles, topics] = await Promise.all([
            fetchArticles({
                locale: validLocale,
                page: currentPage,
                topic: activeTopic,
                pageSize: PAGE_SIZE,
            }),
            fetchTopics(),
        ]);
    } catch {
        // If API is not available, render empty state
        articles = { count: 0, next: null, previous: null, results: [] };
        topics = [];
    }

    const totalPages = Math.ceil(articles.count / PAGE_SIZE);

    // Pick first article as featured only on page 1 with no topic filter
    const featuredArticle =
        currentPage === 1 && !activeTopic && articles.results.length > 0
            ? articles.results[0]
            : null;

    // Remaining articles (exclude featured from the grid)
    const gridArticles = featuredArticle
        ? articles.results.slice(1)
        : articles.results;

    const pageTitle = validLocale === "fa" ? "بلاگ" : "Blog";
    const pageSubtitle =
        validLocale === "fa"
            ? "آخرین نوشته‌ها و مقالات"
            : "Latest articles and writings";

    // Build search params for pagination links (preserve topic filter)
    const paginationSearchParams: Record<string, string> = {};
    if (activeTopic) {
        paginationSearchParams.topic = activeTopic;
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
            {/* Page Header */}
            <header className="mb-8 lg:mb-12">
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {pageTitle}
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">{pageSubtitle}</p>
            </header>

            {/* Topic Filter */}
            {topics.length > 0 && (
                <div className="mb-8">
                    <TopicFilter
                        topics={topics}
                        locale={validLocale}
                        activeTopic={activeTopic}
                    />
                </div>
            )}

            {/* Empty State */}
            {articles.results.length === 0 && (
                <BlogEmptyState locale={validLocale} hasFilter={!!activeTopic} />
            )}

            {/* Featured Article */}
            {featuredArticle && (
                <section className="mb-10" aria-label={validLocale === "fa" ? "مقاله ویژه" : "Featured article"}>
                    <ArticleCard
                        article={featuredArticle}
                        locale={validLocale}
                        featured
                    />
                </section>
            )}

            {/* Article Grid */}
            {gridArticles.length > 0 && (
                <section
                    aria-label={validLocale === "fa" ? "مقالات" : "Articles"}
                    className="mb-12"
                >
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {gridArticles.map((article) => (
                            <ArticleCard
                                key={article.id}
                                article={article}
                                locale={validLocale}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-8">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        locale={validLocale}
                        basePath={`/${validLocale}/blog`}
                        searchParams={paginationSearchParams}
                    />
                </div>
            )}
        </div>
    );
}
