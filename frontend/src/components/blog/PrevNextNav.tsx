import Link from "next/link";
import type { Locale } from "@/lib/i18n";

interface ArticleLink {
    slug: string;
    title: string;
}

interface PrevNextNavProps {
    previous: ArticleLink | null;
    next: ArticleLink | null;
    locale: Locale;
}

export function PrevNextNav({ previous, next, locale }: PrevNextNavProps) {
    if (!previous && !next) return null;

    const isRtl = locale === "fa";

    return (
        <nav className="mt-12 flex flex-col justify-between gap-4 border-t border-border py-8 sm:flex-row">
            {previous ? (
                <Link
                    href={`/${locale}/blog/${previous.slug}`}
                    className="group flex flex-1 items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted"
                >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-background">
                        {isRtl ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        )}
                    </span>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">
                            {locale === "fa" ? "مقاله قبلی" : "Previous Article"}
                        </span>
                        <span className="line-clamp-1 font-semibold text-foreground transition-colors group-hover:text-primary">
                            {previous.title}
                        </span>
                    </div>
                </Link>
            ) : (
                <div className="flex-1" />
            )}

            {next ? (
                <Link
                    href={`/${locale}/blog/${next.slug}`}
                    className={`group flex flex-1 items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted ${
                        isRtl ? "sm:flex-row-reverse text-left sm:text-right" : "sm:flex-row-reverse text-right"
                    }`}
                >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-background">
                        {isRtl ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        )}
                    </span>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">
                            {locale === "fa" ? "مقاله بعدی" : "Next Article"}
                        </span>
                        <span className="line-clamp-1 font-semibold text-foreground transition-colors group-hover:text-primary">
                            {next.title}
                        </span>
                    </div>
                </Link>
            ) : (
                <div className="flex-1" />
            )}
        </nav>
    );
}
