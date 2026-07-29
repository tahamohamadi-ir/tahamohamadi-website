import type { BlockComponentProps, CollectionSettings } from "../types";

/**
 * CollectionBlock renders a dynamic collection of content items
 * (portfolio, blog, publications). In SSR, the actual data fetching
 * and rendering will be handled by the parent page component.
 * This block acts as a placeholder/container for the collection layout.
 */
export function CollectionBlock({ data, locale }: BlockComponentProps<CollectionSettings>) {
    return (
        <div
            className="w-full py-8"
            dir={locale === "fa" ? "rtl" : "ltr"}
            data-collection-source={data.source}
            data-collection-limit={data.limit ?? 3}
        >
            {/* Collection items are rendered by the page-level data fetching.
          This container provides layout context for the collection. */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Populated by page-level SSR logic */}
            </div>
        </div>
    );
}
