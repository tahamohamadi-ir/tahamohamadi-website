import Link from "next/link";
import type { BlockComponentProps, CollectionItem, CollectionSettings, CollectionSource } from "../types";

function value(item: CollectionItem, key: keyof CollectionItem): string | undefined {
    const candidate = item[key];
    return typeof candidate === "string" && candidate.trim() ? candidate : undefined;
}

function itemTitle(item: CollectionItem, locale: "fa" | "en"): string | undefined {
    return value(item, "title")
        ?? value(item, `title_${locale}`)
        ?? value(item, "label")
        ?? value(item, "name")
        ?? value(item, "organization")
        ?? value(item, "degree");
}

function itemSummary(item: CollectionItem, locale: "fa" | "en"): string | undefined {
    return value(item, "summary")
        ?? value(item, "abstract")
        ?? value(item, `excerpt_${locale}`)
        ?? value(item, `outcome_${locale}`);
}

function itemHref(source: CollectionSource, slug: string | undefined, locale: "fa" | "en"): string | undefined {
    if (!slug) return undefined;

    const encodedSlug = encodeURIComponent(slug);
    if (source === "portfolio") return `/${locale}/portfolio/${encodedSlug}`;
    if (source === "blog" || source === "posts") return `/${locale}/blog/${encodedSlug}`;
    if (source === "research_projects") return `/${locale}/research/${encodedSlug}`;
    if (source === "publications") return `/${locale}/publications/${encodedSlug}`;
    return undefined;
}

/**
 * CollectionBlock renders the typed, public items resolved by the CMS API.
 * Empty or invalid collections are suppressed instead of displaying a shell.
 */
export function CollectionBlock({ data, locale }: BlockComponentProps<CollectionSettings>) {
    const items = data.items ?? [];
    if (items.length === 0) return null;

    return (
        <div
            className="w-full py-8"
            dir={locale === "fa" ? "rtl" : "ltr"}
            data-collection-source={data.source}
            data-collection-limit={data.limit ?? 3}
        >
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item, index) => {
                    const title = itemTitle(item, locale);
                    if (!title) return null;

                    const slug = locale === "fa" ? value(item, "slug_fa") : value(item, "slug_en");
                    const href = itemHref(data.source, slug, locale);
                    const summary = itemSummary(item, locale);
                    const key = slug ?? `${data.source}-${title}-${index}`;

                    return (
                        <article key={key} className="border-b border-border pb-5 last:border-b-0">
                            <h2 className="text-xl font-semibold leading-snug">
                                {href ? (
                                    <Link
                                        href={href}
                                        className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        {title}
                                    </Link>
                                ) : title}
                            </h2>
                            {summary && <p className="mt-2 text-sm leading-6 text-muted-foreground">{summary}</p>}
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
