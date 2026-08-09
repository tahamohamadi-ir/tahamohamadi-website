import type { Locale } from "@/lib/i18n";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface MediaAssetDTO {
    id: string;
    file_url: string;
    alt_text_fa: string;
    alt_text_en: string;
    width: number | null;
    height: number | null;
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

interface RelatedArticlesProps {
    articles: RelatedArticleDTO[];
    locale: Locale;
}

export function RelatedArticles({ articles, locale }: RelatedArticlesProps) {
    if (articles.length === 0) return null;

    return (
        <section
            className="border-t border-border bg-muted/30 py-12"
            aria-labelledby="related-articles-heading"
        >
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                <h2
                    id="related-articles-heading"
                    className="mb-6 text-2xl font-bold text-foreground"
                >
                    {locale === "fa" ? "مطالب مرتبط" : "Related Articles"}
                </h2>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {articles.map((article) => (
                        <a
                            key={article.id}
                            href={`/${locale}/blog/${article.slug}`}
                            className="group flex flex-col overflow-hidden rounded-lg border border-border bg-background transition-shadow motion-reduce:transition-none hover:shadow-md"
                        >
                            {article.featured_image && (
                                <div className="aspect-video overflow-hidden">
                                    <OptimizedImage
                                        src={article.featured_image.file_url}
                                        alt={
                                            locale === "fa"
                                                ? article.featured_image.alt_text_fa
                                                : article.featured_image.alt_text_en
                                        }
                                        fill
                                        className="object-cover transition-transform group-hover:scale-105"
                                    />
                                </div>
                            )}
                            <div className="flex flex-1 flex-col p-4">
                                <h3 className="mb-2 text-base font-semibold text-foreground line-clamp-2 group-hover:text-primary">
                                    {article.title}
                                </h3>
                                {article.excerpt && (
                                    <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                                        {article.excerpt}
                                    </p>
                                )}
                                <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
                                    {article.published_at && (
                                        <time dateTime={article.published_at}>
                                            {new Date(article.published_at).toLocaleDateString(
                                                locale === "fa" ? "fa-IR" : "en-US",
                                                { year: "numeric", month: "short", day: "numeric" }
                                            )}
                                        </time>
                                    )}
                                    {article.reading_time > 0 && (
                                        <span>
                                            {locale === "fa"
                                                ? `${article.reading_time} دقیقه`
                                                : `${article.reading_time} min`}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
