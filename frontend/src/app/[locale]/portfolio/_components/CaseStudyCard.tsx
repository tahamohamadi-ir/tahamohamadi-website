import Link from "next/link";
import { OptimizedImage } from "@/components/ui/optimized-image";
import type { CaseStudyListItem } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

interface CaseStudyCardProps {
    caseStudy: CaseStudyListItem;
    locale: Locale;
    featured?: boolean;
}

/**
 * Renders a single case study card in the portfolio grid.
 * Displays title, role, client, technologies, date range, and featured state.
 */
export function CaseStudyCard({
    caseStudy,
    locale,
    featured = false,
}: CaseStudyCardProps) {
    const title = locale === "fa" ? caseStudy.title_fa : caseStudy.title_en;
    const role = locale === "fa" ? caseStudy.role_fa : caseStudy.role_en;
    const client = locale === "fa" ? caseStudy.client_fa : caseStudy.client_en;
    const slug = locale === "fa" ? caseStudy.slug_fa : caseStudy.slug_en;
    const outcome = locale === "fa" ? caseStudy.outcome_fa : caseStudy.outcome_en;
    const firstMedia = caseStudy.gallery?.[0];

    const dateRange = formatDateRange(
        caseStudy.date_start,
        caseStudy.date_end,
        locale
    );

    return (
        <Link
            href={`/${locale}/portfolio/${slug}`}
            className={`group block overflow-hidden rounded-lg border bg-card transition-shadow motion-reduce:transition-none hover:shadow-md flex flex-col ${featured
                ? "border-primary/30 ring-1 ring-primary/20"
                : "border-border"
                }`}
        >
            {/* Media Image */}
            {firstMedia && (
                <div className="aspect-video w-full overflow-hidden bg-muted relative">
                    <OptimizedImage
                        src={firstMedia.file || ""}
                        alt={firstMedia.alt_text_fa || firstMedia.alt_text_en || title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </div>
            )}

            <div className="flex flex-1 flex-col p-6">
                {/* Featured Badge */}
                {featured && (
                    <span className="mb-3 inline-block self-start rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {locale === "fa" ? "برجسته" : "Featured"}
                    </span>
                )}

                {/* Title */}
                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-1">
                    {title}
                </h3>

                {/* Role */}
                <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{role}</p>

                {/* Client / Domain */}
                {client && (
                    <p className="mt-1 text-sm">
                        <span className="text-muted-foreground">
                            {locale === "fa" ? "کارفرما: " : "Client: "}
                        </span>
                        {client}
                    </p>
                )}

                {/* Outcome */}
                {outcome && (
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                        {outcome}
                    </p>
                )}

                {/* Date Range */}
                <p className="mt-3 text-xs text-muted-foreground">{dateRange}</p>

            {/* Technologies */}
            {caseStudy.technologies.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {caseStudy.technologies.map((tech) => (
                        <span
                            key={tech}
                            className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
                        >
                            {tech}
                        </span>
                    ))}
                </div>
            )}
            </div>
        </Link>
    );
}

/**
 * Formats a date range into a human-readable string.
 */
function formatDateRange(
    start: string,
    end: string | null,
    locale: Locale
): string {
    const dateLocale = locale === "fa" ? "fa-IR" : "en-US";
    const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
    };

    const startDate = new Date(start).toLocaleDateString(dateLocale, options);

    if (!end) {
        const present = locale === "fa" ? "اکنون" : "Present";
        return `${startDate} — ${present}`;
    }

    const endDate = new Date(end).toLocaleDateString(dateLocale, options);
    return `${startDate} — ${endDate}`;
}
