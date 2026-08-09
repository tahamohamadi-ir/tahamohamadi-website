import Link from "next/link";
import { Clock, Calendar } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import type { Locale } from "@/lib/i18n";
import type { ArticleListItemDTO } from "@/lib/types/blog";

interface ArticleCardProps {
    article: ArticleListItemDTO;
    locale: Locale;
    featured?: boolean;
}

/**
 * Renders an article card with title, excerpt, featured image,
 * topics, reading time, and published date.
 */
export function ArticleCard({ article, locale, featured = false }: ArticleCardProps) {
    const title = locale === "fa" ? article.title_fa : article.title_en;
    const excerpt = locale === "fa" ? article.excerpt_fa : article.excerpt_en;
    const slug = locale === "fa" ? article.slug_fa : article.slug_en;
    const readingTime = locale === "fa" ? article.reading_time_fa : article.reading_time_en;
    const alt = article.featured_image
        ? locale === "fa"
            ? article.featured_image.alt_text_fa
            : article.featured_image.alt_text_en
        : "";

    const publishedDate = article.published_at
        ? new Date(article.published_at).toLocaleDateString(
            locale === "fa" ? "fa-IR" : "en-US",
            { year: "numeric", month: "long", day: "numeric" }
        )
        : null;

    const readingTimeLabel =
        locale === "fa"
            ? `${readingTime} دقیقه مطالعه`
            : `${readingTime} min read`;

    if (featured) {
        return (
            <article className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow motion-reduce:transition-none hover:shadow-md">
                <Link
                    href={`/${locale}/blog/${slug}`}
                    className="flex flex-col md:flex-row"
                >
                    {article.featured_image && (
                        <div className="relative aspect-video w-full md:aspect-auto md:w-1/2">
                            <OptimizedImage
                                src={article.featured_image.file_url}
                                alt={alt || title}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    )}
                    <div className="flex flex-1 flex-col justify-center gap-4 p-6 md:p-8">
                        <div className="flex flex-wrap items-center gap-2">
                            {article.topics.slice(0, 3).map((topic) => (
                                <span
                                    key={topic.id}
                                    className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                                >
                                    {locale === "fa" ? topic.name_fa : topic.name_en}
                                </span>
                            ))}
                        </div>
                        <h2 className="text-2xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary md:text-3xl">
                            {title}
                        </h2>
                        {excerpt && (
                            <p className="line-clamp-3 text-base text-muted-foreground">
                                {excerpt}
                            </p>
                        )}
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {publishedDate && <time>{publishedDate}</time>}
                            {publishedDate && readingTime > 0 && (
                                <span aria-hidden="true">·</span>
                            )}
                            {readingTime > 0 && <span>{readingTimeLabel}</span>}
                        </div>
                    </div>
                </Link>
            </article>
        );
    }

    return (
        <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow motion-reduce:transition-none hover:shadow-md">
            <Link href={`/${locale}/blog/${slug}`} className="flex flex-col h-full">
                {article.featured_image && (
                    <div className="relative aspect-video w-full overflow-hidden">
                        <OptimizedImage
                            src={article.featured_image.file_url}
                            alt={alt || title}
                            fill
                            className="object-cover transition-transform duration-300 motion-reduce:transition-none group-hover:scale-105 motion-reduce:group-hover:transform-none"
                        />
                    </div>
                )}
                <div className="flex flex-1 flex-col gap-3 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                        {article.topics.slice(0, 2).map((topic) => (
                            <span
                                key={topic.id}
                                className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                            >
                                {locale === "fa" ? topic.name_fa : topic.name_en}
                            </span>
                        ))}
                    </div>
                    <h3 className="text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary line-clamp-2">
                        {title}
                    </h3>
                    {excerpt && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                            {excerpt}
                        </p>
                    )}
                    <div className="mt-auto flex items-center gap-3 pt-3 text-xs text-muted-foreground">
                        {publishedDate && <time>{publishedDate}</time>}
                        {publishedDate && readingTime > 0 && (
                            <span aria-hidden="true">·</span>
                        )}
                        {readingTime > 0 && <span>{readingTimeLabel}</span>}
                    </div>
                </div>
            </Link>
        </article>
    );
}
