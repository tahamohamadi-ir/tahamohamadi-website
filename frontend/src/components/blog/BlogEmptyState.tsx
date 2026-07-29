import type { Locale } from "@/lib/i18n";

interface BlogEmptyStateProps {
    locale: Locale;
    hasFilter?: boolean;
}

/**
 * Empty state displayed when no articles match the current filters.
 */
export function BlogEmptyState({ locale, hasFilter = false }: BlogEmptyStateProps) {
    const title = hasFilter
        ? locale === "fa"
            ? "مقاله‌ای یافت نشد"
            : "No articles found"
        : locale === "fa"
            ? "هنوز مقاله‌ای منتشر نشده"
            : "No articles published yet";

    const description = hasFilter
        ? locale === "fa"
            ? "با فیلتر انتخابی مقاله‌ای پیدا نشد. فیلتر دیگری را امتحان کنید."
            : "No articles match the selected filter. Try a different topic."
        : locale === "fa"
            ? "به‌زودی مقالات جدید منتشر خواهد شد."
            : "New articles will be published soon.";

    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 text-6xl" aria-hidden="true">
                📝
            </div>
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            <p className="mt-2 max-w-md text-muted-foreground">{description}</p>
        </div>
    );
}
