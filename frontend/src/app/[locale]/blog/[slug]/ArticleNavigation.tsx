import type { Locale } from "@/lib/i18n";

interface ArticleNavItemDTO {
    slug: string;
    title: string;
}

interface ArticleNavigationProps {
    previous: ArticleNavItemDTO | null;
    next: ArticleNavItemDTO | null;
    locale: Locale;
}

export function ArticleNavigation({
    previous,
    next,
    locale,
}: ArticleNavigationProps) {
    if (!previous && !next) return null;

    return (
        <nav
            className="mt-12 border-t border-border pt-8"
            aria-label={locale === "fa" ? "ناوبری مقالات" : "Article navigation"}
        >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Previous Article */}
                {previous ? (
                    <a
                        href={`/${locale}/blog/${previous.slug}`}
                        className="group flex flex-col rounded-lg border border-border p-4 transition-colors hover:bg-muted"
                    >
                        <span className="mb-1 text-xs text-muted-foreground">
                            {locale === "fa" ? "← مقاله قبلی" : "← Previous"}
                        </span>
                        <span className="text-sm font-medium text-foreground group-hover:text-primary line-clamp-2">
                            {previous.title}
                        </span>
                    </a>
                ) : (
                    <div />
                )}

                {/* Next Article */}
                {next ? (
                    <a
                        href={`/${locale}/blog/${next.slug}`}
                        className="group flex flex-col rounded-lg border border-border p-4 text-end transition-colors hover:bg-muted sm:items-end"
                    >
                        <span className="mb-1 text-xs text-muted-foreground">
                            {locale === "fa" ? "مقاله بعدی →" : "Next →"}
                        </span>
                        <span className="text-sm font-medium text-foreground group-hover:text-primary line-clamp-2">
                            {next.title}
                        </span>
                    </a>
                ) : (
                    <div />
                )}
            </div>
        </nav>
    );
}
