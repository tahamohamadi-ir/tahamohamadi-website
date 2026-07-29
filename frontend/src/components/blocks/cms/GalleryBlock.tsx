import { cn } from "@/lib/utils";
import type { BlockComponentProps, GallerySettings } from "../types";

export function GalleryBlock({ data, locale }: BlockComponentProps<GallerySettings>) {
    const items = data.items ?? [];
    const isGrid = (data.layout ?? "grid") === "grid";

    if (items.length === 0) {
        return null;
    }

    return (
        <div
            className={cn(
                "w-full",
                isGrid && "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            )}
            dir={locale === "fa" ? "rtl" : "ltr"}
        >
            {items.map((item, index) => (
                <figure key={item.media_id ?? index} className="overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={item.url}
                        alt={item.alt ?? ""}
                        className="h-auto w-full object-cover transition-transform hover:scale-105"
                        loading="lazy"
                    />
                    {item.caption && (
                        <figcaption className="mt-2 text-sm text-muted-foreground">
                            {item.caption}
                        </figcaption>
                    )}
                </figure>
            ))}
        </div>
    );
}
