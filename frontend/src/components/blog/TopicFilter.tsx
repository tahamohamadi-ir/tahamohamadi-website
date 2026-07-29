import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { TopicDTO } from "@/lib/types/blog";

interface TopicFilterProps {
    topics: TopicDTO[];
    locale: Locale;
    activeTopic?: string;
    searchQuery?: string;
}

/**
 * Renders a horizontal scrollable topic filter bar.
 * Uses URL-state (searchParams) for filter persistence.
 */
export function TopicFilter({ topics, locale, activeTopic, searchQuery }: TopicFilterProps) {
    const allLabel = locale === "fa" ? "همه" : "All";
    const querySuffix = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : "";

    return (
        <nav
            aria-label={locale === "fa" ? "فیلتر موضوعات" : "Topic filter"}
            className="flex flex-wrap items-center gap-2"
        >
            <Link
                href={`/${locale}/blog${querySuffix}`}
                className={`inline-flex min-h-[44px] items-center rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${!activeTopic
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    }`}
            >
                {allLabel}
            </Link>
            {topics.map((topic) => {
                const isActive = activeTopic === topic.slug;
                const topicName = locale === "fa" ? topic.name_fa : topic.name_en;
                return (
                    <Link
                        key={topic.id}
                        href={`/${locale}/blog?topic=${encodeURIComponent(topic.slug)}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`}
                        className={`inline-flex min-h-[44px] items-center rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                            }`}
                    >
                        {topicName}
                    </Link>
                );
            })}
        </nav>
    );
}
