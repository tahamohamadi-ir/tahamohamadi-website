import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchPublicSiteAggregate, getPublicPage } from "@/lib/api";
import { isValidLocale, SITE_URL, type Locale } from "@/lib/i18n";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";

interface AboutPageProps {
    params: Promise<{ locale: string }>;
}

export async function generateMetadata({
    params,
}: AboutPageProps): Promise<Metadata> {
    const { locale } = await params;
    if (!isValidLocale(locale)) return {};

    const [pageResult, aggregateResult] = await Promise.allSettled([
        getPublicPage("about", locale),
        fetchPublicSiteAggregate(locale),
    ]);
    const page = pageResult.status === "fulfilled" ? pageResult.value : null;
    const profile = aggregateResult.status === "fulfilled" ? aggregateResult.value.identity.profile : null;

    const title = locale === "fa" ? "درباره من" : "About";
    const description =
        locale === "fa"
            ? "بیوگرافی، معرفی و پروفایل حرفه‌ای طاها محمدی"
            : "Biography, introduction and professional profile of Taha Mohamadi";

    const pageTitle = page
        ? locale === "fa"
            ? page.title_fa
            : page.title_en
        : profile?.name || title;

    return {
        title: pageTitle,
        description: profile?.headline || description,
        alternates: {
            canonical: `/${locale}/about`,
            languages: {
                fa: "/fa/about",
                en: "/en/about",
            },
        },
        openGraph: {
            title: pageTitle,
            description: profile?.headline || description,
            url: `${SITE_URL}/${locale}/about`,
            type: "profile",
        },
    };
}

/**
 * About page — profile/bio rendered via SSR.
 *
 * Fetches composed page content from Django CMS (page slug: "about").
 * Renders blocks using BlockRenderer. Exactly one H1 per page.
 * No cross-locale fallback.
 */
export default async function AboutPage({ params }: AboutPageProps) {
    const { locale: localeParam } = await params;

    if (!isValidLocale(localeParam)) {
        notFound();
    }

    const locale: Locale = localeParam;
    const [pageResult, aggregateResult] = await Promise.allSettled([
        getPublicPage("about", locale),
        fetchPublicSiteAggregate(locale),
    ]);
    const page = pageResult.status === "fulfilled" ? pageResult.value : null;
    const identity = aggregateResult.status === "fulfilled" ? aggregateResult.value.identity : null;
    const profile = identity?.profile ?? null;

    if (!page && !profile) {
        notFound();
    }

    if (!page && profile) {
        const labels = locale === "fa"
            ? { experience: "تجربه", education: "تحصیلات", present: "اکنون" }
            : { experience: "Experience", education: "Education", present: "Present" };
        const formatDate = (value: string) => new Intl.DateTimeFormat(
            locale === "fa" ? "fa-IR" : "en-US",
            { year: "numeric", month: "short" },
        ).format(new Date(value));
        const formatRange = (startedOn: string | null, endedOn: string | null) => {
            if (!startedOn) return null;
            return `${formatDate(startedOn)} — ${endedOn ? formatDate(endedOn) : labels.present}`;
        };

        return (
            <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <header className="mx-auto max-w-3xl text-center">
                    <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{profile.name}</h1>
                    {profile.headline && <p className="mt-3 text-lg text-muted-foreground">{profile.headline}</p>}
                    {profile.bio && <p className="mt-6 whitespace-pre-line text-base leading-8 text-muted-foreground">{profile.bio}</p>}
                </header>

                {identity?.experience.length ? (
                    <section className="mx-auto mt-14 max-w-4xl" aria-labelledby="experience-heading">
                        <h2 id="experience-heading" className="text-2xl font-semibold">{labels.experience}</h2>
                        <ol className="mt-6 divide-y divide-border border-y border-border">
                            {identity.experience.map((item, index) => (
                                <li key={`${item.organization}-${item.title}-${index}`} className="py-6">
                                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                                        <h3 className="text-xl font-semibold">{item.title}</h3>
                                        {formatRange(item.started_on, item.ended_on) && <p className="text-sm text-muted-foreground">{formatRange(item.started_on, item.ended_on)}</p>}
                                    </div>
                                    {item.organization && <p className="mt-1 font-medium text-muted-foreground">{item.organization}</p>}
                                    {item.summary && <p className="mt-3 leading-7 text-muted-foreground">{item.summary}</p>}
                                </li>
                            ))}
                        </ol>
                    </section>
                ) : null}

                {identity?.education.length ? (
                    <section className="mx-auto mt-14 max-w-4xl" aria-labelledby="education-heading">
                        <h2 id="education-heading" className="text-2xl font-semibold">{labels.education}</h2>
                        <ol className="mt-6 divide-y divide-border border-y border-border">
                            {identity.education.map((item, index) => (
                                <li key={`${item.institution}-${item.degree}-${index}`} className="py-6">
                                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                                        <h3 className="text-xl font-semibold">{item.degree}</h3>
                                        {formatRange(item.started_on, item.ended_on) && <p className="text-sm text-muted-foreground">{formatRange(item.started_on, item.ended_on)}</p>}
                                    </div>
                                    {item.institution && <p className="mt-1 font-medium text-muted-foreground">{item.institution}</p>}
                                    {item.field && <p className="mt-3 leading-7 text-muted-foreground">{item.field}</p>}
                                </li>
                            ))}
                        </ol>
                    </section>
                ) : null}
            </div>
        );
    }

    const cmsPage = page!;
    const pageTitle = locale === "fa" ? cmsPage.title_fa : cmsPage.title_en;

    return (
        <div>
            <h1 className="sr-only">{pageTitle}</h1>
            {cmsPage.sections
                .filter((section) => section.enabled)
                .sort((a, b) => a.ordering - b.ordering)
                .map((section) => (
                    <section
                        key={section.id}
                        className={`layout-${section.layout}`}
                    >
                        {section.blocks
                            .sort((a, b) => a.ordering - b.ordering)
                            .map((block) => (
                                <BlockRenderer
                                    key={block.id}
                                    block={block}
                                    locale={locale}
                                    context="cms"
                                />
                            ))}
                    </section>
                ))}
        </div>
    );
}
