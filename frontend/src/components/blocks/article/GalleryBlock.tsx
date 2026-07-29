import type { BlockComponentProps, GallerySettings } from "../types";

/**
 * Article-level gallery block.
 * Reuses the same GallerySettings interface as the CMS gallery.
 */
export function ArticleGalleryBlock({ data, locale }: BlockComponentProps<GallerySettings>) {
    const items = data.items ?? [];
    const isGrid = (data.layout ?? "grid") === "grid";

    if (items.length === 0) {
        return null;
    }

    return (
        <div
            className={
                isGrid
                    ? "grid w-full grid-cols-1 gap-3 sm:grid-cols-2"
                    : "flex w-full gap-3 overflow-x-auto"
            }
            dir={locale === "fa" ? "rtl" : "ltr"}
        >
            {items.map((item, index) => (
                <figure key={item.media_id ?? index} className="overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={item.url}
                        alt={item.alt ?? ""}
                        className="h-auto w-full object-cover"
                        loading="lazy"
                    />
                    {item.caption && (
                        <figcaption className="mt-1.5 text-xs text-muted-foreground">
                            {item.caption}
                        </figcaption>
                    )}
                </figure>
            ))}
        </div>
    );
}
