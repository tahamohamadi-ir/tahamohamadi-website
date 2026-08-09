import Link from "next/link";
import type { Locale } from "@/lib/i18n";

interface TechnologyFilterProps {
    technologies: string[];
    activeTechnology: string | null;
    activeRole?: string | null;
    locale: Locale;
}

/**
 * Technology filter bar for filtering portfolio case studies.
 * Uses URL search params for SSR-friendly state management.
 */
export function TechnologyFilter({
    technologies,
    activeTechnology,
    activeRole,
    locale,
}: TechnologyFilterProps) {
    const allLabel = locale === "fa" ? "همه" : "All";
    const filterLabel = locale === "fa" ? "فیلتر فناوری:" : "Filter by technology:";

    return (
        <nav
            className="mb-8"
            aria-label={locale === "fa" ? "فیلتر فناوری" : "Technology filter"}
        >
            <p className="mb-3 text-sm font-medium text-muted-foreground">
                {filterLabel}
            </p>
            <div className="flex flex-wrap gap-2">
                {/* "All" button */}
                <Link
                    href={`/${locale}/portfolio${activeRole ? `?role=${encodeURIComponent(activeRole)}` : ""}`}
                    className={`inline-flex min-h-[44px] items-center rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${!activeTechnology
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                >
                    {allLabel}
                </Link>

                {/* Technology filter buttons */}
                {technologies.map((tech) => {
                    const query = new URLSearchParams();
                    query.set("technology", tech);
                    if (activeRole) query.set("role", activeRole);
                    return (
                    <Link
                        key={tech}
                        href={`/${locale}/portfolio?${query.toString()}`}
                        className={`inline-flex min-h-[44px] items-center rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${activeTechnology === tech
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            }`}
                    >
                        {tech}
                    </Link>
                    );
                })}
            </div>
        </nav>
    );
}
