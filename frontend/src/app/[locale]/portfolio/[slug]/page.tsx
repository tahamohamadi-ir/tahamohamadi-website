import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { isValidLocale, SITE_URL, type Locale } from "@/lib/i18n";
import { fetchPublicAPI } from "@/lib/api";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import type { BlockDTO } from "@/components/blocks/types";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface MediaAssetDTO {
    id: string;
    file: string | null;
    original_filename: string;
    mime_type: string;
    file_size: number;
    width: number | null;
    height: number | null;
    alt_text_fa: string;
    alt_text_en: string;
    caption_fa: string;
    caption_en: string;
    status: string;
}

interface CaseStudyDTO {
    id: string;
    slug_fa: string;
    slug_en: string;
    title_fa: string;
    title_en: string;
    role_fa: string;
    role_en: string;
    client_fa: string;
    client_en: string;
    date_start: string | null;
    date_end: string | null;
    technologies: string[];
    outcome_fa: string;
    outcome_en: string;
    gallery: MediaAssetDTO[];
    featured: boolean;
    status: string;
    published_at: string | null;
    narrative_blocks: BlockDTO[];
}

// ─── Data Fetching ─────────────────────────────────────────────────────────────

async function getCaseStudy(
    slug: string,
    locale: Locale
): Promise<CaseStudyDTO | null> {
    try {
        const data = await fetchPublicAPI<CaseStudyDTO>(
            `/public/portfolio/${slug}/?locale=${locale}`
        );
        return data;
    } catch {
        return null;
    }
}

// ─── Metadata ──────────────────────────────────────────────────────────────────

interface PageProps {
    params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale, slug } = await params;
    if (!isValidLocale(locale)) return {};

    const caseStudy = await getCaseStudy(slug, locale);
    if (!caseStudy) return {};

    const title = locale === "fa" ? caseStudy.title_fa : caseStudy.title_en;
    const role = locale === "fa" ? caseStudy.role_fa : caseStudy.role_en;
    const outcome = locale === "fa" ? caseStudy.outcome_fa : caseStudy.outcome_en;
    const description = outcome || role;

    const ogImage = caseStudy.gallery[0]?.file ?? undefined;
    const altSlug = locale === "fa" ? caseStudy.slug_en : caseStudy.slug_fa;

    return {
        title,
        description,
        alternates: {
            canonical: `/${locale}/portfolio/${slug}`,
            languages: {
                fa: `/fa/portfolio/${locale === "fa" ? slug : altSlug}`,
                en: `/en/portfolio/${locale === "en" ? slug : altSlug}`,
            },
        },
        openGraph: {
            title,
            description,
            url: `${SITE_URL}/${locale}/portfolio/${slug}`,
            type: "article",
            ...(ogImage && { images: [{ url: ogImage }] }),
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            ...(ogImage && { images: [ogImage] }),
        },
    };
}

// ─── Page Component ────────────────────────────────────────────────────────────

export default async function PortfolioCaseStudyPage({ params }: PageProps) {
    const { locale, slug } = await params;

    if (!isValidLocale(locale)) {
        notFound();
    }

    const validLocale: Locale = locale;
    const caseStudy = await getCaseStudy(slug, validLocale);

    if (!caseStudy) {
        notFound();
    }

    const title = validLocale === "fa" ? caseStudy.title_fa : caseStudy.title_en;
    const role = validLocale === "fa" ? caseStudy.role_fa : caseStudy.role_en;
    const client = validLocale === "fa" ? caseStudy.client_fa : caseStudy.client_en;
    const outcome = validLocale === "fa" ? caseStudy.outcome_fa : caseStudy.outcome_en;

    return (
        <>
            {/* Schema.org Structured Data */}
            <CaseStudyStructuredData
                caseStudy={caseStudy}
                locale={validLocale}
                slug={slug}
            />

            <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                {/* Header */}
                <header className="mb-8 lg:mb-12">
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                        {title}
                    </h1>
                    {role && (
                        <p className="mt-3 text-lg text-muted-foreground">{role}</p>
                    )}
                </header>

                {/* Facts Section */}
                <CaseStudyFacts
                    client={client}
                    role={role}
                    dateStart={caseStudy.date_start}
                    dateEnd={caseStudy.date_end}
                    technologies={caseStudy.technologies}
                    outcome={outcome}
                    locale={validLocale}
                />

                {/* Narrative Blocks */}
                {caseStudy.narrative_blocks.length > 0 && (
                    <section className="mt-10 space-y-6 lg:mt-12" aria-label={validLocale === "fa" ? "شرح پروژه" : "Project Narrative"}>
                        {caseStudy.narrative_blocks.map((block) => (
                            <BlockRenderer
                                key={block.id}
                                block={block}
                                locale={validLocale}
                                context="article"
                            />
                        ))}
                    </section>
                )}

                {/* Gallery */}
                {caseStudy.gallery.length > 0 && (
                    <CaseStudyGallery
                        images={caseStudy.gallery}
                        locale={validLocale}
                    />
                )}

                {/* Technology Tags */}
                {caseStudy.technologies.length > 0 && (
                    <section className="mt-10 lg:mt-12" aria-label={validLocale === "fa" ? "فناوری‌ها" : "Technologies"}>
                        <h2 className="mb-4 text-xl font-semibold">
                            {validLocale === "fa" ? "فناوری‌ها" : "Technologies"}
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {caseStudy.technologies.map((tech) => (
                                <span
                                    key={tech}
                                    className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground"
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </section>
                )}
            </article>
        </>
    );
}

// ─── Sub-Components ────────────────────────────────────────────────────────────

function CaseStudyFacts({
    client,
    role,
    dateStart,
    dateEnd,
    technologies,
    outcome,
    locale,
}: {
    client: string;
    role: string;
    dateStart: string | null;
    dateEnd: string | null;
    technologies: string[];
    outcome: string;
    locale: Locale;
}) {
    const facts: { label: string; value: string }[] = [];

    if (client) {
        facts.push({
            label: locale === "fa" ? "مشتری" : "Client",
            value: client,
        });
    }

    if (role) {
        facts.push({
            label: locale === "fa" ? "نقش" : "Role",
            value: role,
        });
    }

    if (dateStart) {
        const dateRange = formatDateRange(dateStart, dateEnd, locale);
        facts.push({
            label: locale === "fa" ? "بازه زمانی" : "Duration",
            value: dateRange,
        });
    }

    if (technologies.length > 0) {
        facts.push({
            label: locale === "fa" ? "فناوری‌ها" : "Technologies",
            value: technologies.join(", "),
        });
    }

    if (outcome) {
        facts.push({
            label: locale === "fa" ? "نتیجه" : "Outcome",
            value: outcome,
        });
    }

    if (facts.length === 0) return null;

    return (
        <section
            aria-label={locale === "fa" ? "اطلاعات پروژه" : "Project Facts"}
            className="rounded-lg border bg-card p-6"
        >
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {facts.map((fact) => (
                    <div key={fact.label}>
                        <dt className="text-sm font-medium text-muted-foreground">
                            {fact.label}
                        </dt>
                        <dd className="mt-1 text-base font-medium">{fact.value}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}

function CaseStudyGallery({
    images,
    locale,
}: {
    images: MediaAssetDTO[];
    locale: Locale;
}) {
    return (
        <section
            className="mt-10 lg:mt-12"
            aria-label={locale === "fa" ? "گالری تصاویر" : "Image Gallery"}
        >
            <h2 className="mb-4 text-xl font-semibold">
                {locale === "fa" ? "گالری" : "Gallery"}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((image) => {
                    if (!image.file) return null;
                    const alt =
                        locale === "fa"
                            ? image.alt_text_fa || image.original_filename
                            : image.alt_text_en || image.original_filename;
                    const caption = locale === "fa" ? image.caption_fa : image.caption_en;

                    return (
                        <figure key={image.id} className="overflow-hidden rounded-lg">
                            <Image
                                src={image.file}
                                alt={alt}
                                width={image.width ?? 800}
                                height={image.height ?? 600}
                                className="h-auto w-full object-cover"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                            {caption && (
                                <figcaption className="mt-2 px-1 text-sm text-muted-foreground">
                                    {caption}
                                </figcaption>
                            )}
                        </figure>
                    );
                })}
            </div>
        </section>
    );
}

function CaseStudyStructuredData({
    caseStudy,
    locale,
    slug,
}: {
    caseStudy: CaseStudyDTO;
    locale: Locale;
    slug: string;
}) {
    const title = locale === "fa" ? caseStudy.title_fa : caseStudy.title_en;
    const description =
        locale === "fa" ? caseStudy.outcome_fa : caseStudy.outcome_en;

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: title,
        description: description || undefined,
        url: `${SITE_URL}/${locale}/portfolio/${slug}`,
        datePublished: caseStudy.published_at ?? undefined,
        dateCreated: caseStudy.date_start ?? undefined,
        author: {
            "@type": "Person",
            name: "Taha Mohamadi",
            url: SITE_URL,
        },
        ...(caseStudy.technologies.length > 0 && {
            keywords: caseStudy.technologies.join(", "),
        }),
        ...(caseStudy.gallery[0]?.file && {
            image: caseStudy.gallery[0].file,
        }),
        inLanguage: locale === "fa" ? "fa" : "en",
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

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
        const present = locale === "fa" ? "تا کنون" : "Present";
        return `${startDate} — ${present}`;
    }

    const endDate = new Date(end).toLocaleDateString(dateLocale, options);
    return `${startDate} — ${endDate}`;
}
