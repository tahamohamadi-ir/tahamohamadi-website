import Link from "next/link";
import type { Locale } from "@/lib/i18n";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    locale: Locale;
    basePath: string;
    searchParams?: Record<string, string>;
}

/**
 * Server-rendered pagination component using URL-state (searchParams).
 */
export function Pagination({
    currentPage,
    totalPages,
    locale,
    basePath,
    searchParams = {},
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const prevLabel = locale === "fa" ? "قبلی" : "Previous";
    const nextLabel = locale === "fa" ? "بعدی" : "Next";

    function buildHref(page: number): string {
        const params = new URLSearchParams(searchParams);
        if (page > 1) {
            params.set("page", String(page));
        } else {
            params.delete("page");
        }
        const qs = params.toString();
        return qs ? `${basePath}?${qs}` : basePath;
    }

    // Generate page numbers to display (max 5 visible)
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (currentPage > 3) pages.push("ellipsis");
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (currentPage < totalPages - 2) pages.push("ellipsis");
        pages.push(totalPages);
    }

    return (
        <nav
            aria-label={locale === "fa" ? "صفحه‌بندی" : "Pagination"}
            className="flex items-center justify-center gap-2"
        >
            {currentPage > 1 ? (
                <Link
                    href={buildHref(currentPage - 1)}
                    className="inline-flex min-h-[44px] items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    {prevLabel}
                </Link>
            ) : (
                <span className="inline-flex min-h-[44px] items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed">
                    {prevLabel}
                </span>
            )}

            <div className="hidden items-center gap-1 sm:flex">
                {pages.map((page, idx) =>
                    page === "ellipsis" ? (
                        <span
                            key={`ellipsis-${idx}`}
                            className="px-2 text-muted-foreground"
                            aria-hidden="true"
                        >
                            …
                        </span>
                    ) : (
                        <Link
                            key={page}
                            href={buildHref(page)}
                            aria-current={page === currentPage ? "page" : undefined}
                            className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${page === currentPage
                                ? "bg-primary text-primary-foreground"
                                : "text-foreground hover:bg-muted"
                                }`}
                        >
                            {locale === "fa"
                                ? page.toLocaleString("fa-IR")
                                : page}
                        </Link>
                    )
                )}
            </div>

            {/* Mobile: show current/total */}
            <span className="flex items-center gap-1 text-sm text-muted-foreground sm:hidden">
                {locale === "fa"
                    ? `${currentPage.toLocaleString("fa-IR")} از ${totalPages.toLocaleString("fa-IR")}`
                    : `${currentPage} of ${totalPages}`}
            </span>

            {currentPage < totalPages ? (
                <Link
                    href={buildHref(currentPage + 1)}
                    className="inline-flex min-h-[44px] items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    {nextLabel}
                </Link>
            ) : (
                <span className="inline-flex min-h-[44px] items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed">
                    {nextLabel}
                </span>
            )}
        </nav>
    );
}
