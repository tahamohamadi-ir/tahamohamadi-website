import Link from "next/link";
import type { Locale } from "@/lib/i18n";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    locale: Locale;
    technology: string | null;
    role: string | null;
}

/**
 * Server-side pagination component using URL search params.
 * Renders numbered page links with previous/next navigation.
 */
export function Pagination({
    currentPage,
    totalPages,
    locale,
    technology,
    role,
}: PaginationProps) {
    const previousLabel = locale === "fa" ? "قبلی" : "Previous";
    const nextLabel = locale === "fa" ? "بعدی" : "Next";

    function buildHref(page: number): string {
        const params = new URLSearchParams();
        if (page > 1) params.set("page", String(page));
        if (technology) params.set("technology", technology);
        if (role) params.set("role", role);
        const query = params.toString();
        return `/${locale}/portfolio${query ? `?${query}` : ""}`;
    }

    // Generate page numbers to display (show max 5 around current)
    const pageNumbers = getPageNumbers(currentPage, totalPages);

    return (
        <nav
            className="mt-12 flex items-center justify-center gap-2"
            aria-label={locale === "fa" ? "صفحه‌بندی" : "Pagination"}
        >
            {/* Previous */}
            {currentPage > 1 ? (
                <Link
                    href={buildHref(currentPage - 1)}
                    className="inline-flex min-h-[44px] items-center rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label={previousLabel}
                >
                    {previousLabel}
                </Link>
            ) : (
                <span
                    className="inline-flex min-h-[44px] items-center cursor-not-allowed rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground opacity-50"
                    aria-disabled="true"
                >
                    {previousLabel}
                </span>
            )}

            {/* Page Numbers */}
            {pageNumbers.map((pageNum, index) => {
                if (pageNum === "ellipsis") {
                    return (
                        <span
                            key={`ellipsis-${index}`}
                            className="px-2 text-sm text-muted-foreground"
                        >
                            …
                        </span>
                    );
                }

                const isActive = pageNum === currentPage;
                return (
                    <Link
                        key={pageNum}
                        href={buildHref(pageNum)}
                        className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isActive
                            ? "bg-primary text-primary-foreground"
                            : "border border-border hover:bg-secondary"
                            }`}
                        aria-current={isActive ? "page" : undefined}
                    >
                        {pageNum}
                    </Link>
                );
            })}

            {/* Next */}
            {currentPage < totalPages ? (
                <Link
                    href={buildHref(currentPage + 1)}
                    className="inline-flex min-h-[44px] items-center rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label={nextLabel}
                >
                    {nextLabel}
                </Link>
            ) : (
                <span
                    className="cursor-not-allowed rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground opacity-50"
                    aria-disabled="true"
                >
                    {nextLabel}
                </span>
            )}
        </nav>
    );
}

/**
 * Generates an array of page numbers and ellipsis markers.
 * Shows first, last, and up to 5 pages around current.
 */
function getPageNumbers(
    current: number,
    total: number
): (number | "ellipsis")[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | "ellipsis")[] = [];

    // Always show first page
    pages.push(1);

    if (current > 3) {
        pages.push("ellipsis");
    }

    // Pages around current
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    if (current < total - 2) {
        pages.push("ellipsis");
    }

    // Always show last page
    pages.push(total);

    return pages;
}
