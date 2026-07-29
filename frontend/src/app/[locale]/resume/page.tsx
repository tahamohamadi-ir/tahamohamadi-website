import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicPage } from "@/lib/api";
import { isValidLocale, SITE_URL, type Locale } from "@/lib/i18n";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";

interface ResumePageProps {
    params: Promise<{ locale: string }>;
}

export async function generateMetadata({
    params,
}: ResumePageProps): Promise<Metadata> {
    const { locale } = await params;
    if (!isValidLocale(locale)) return {};

    const page = await getPublicPage("resume", locale);

    const title = locale === "fa" ? "رزومه" : "Resume";
    const description =
        locale === "fa"
            ? "رزومه ساختاریافته، سوابق تحصیلی و حرفه‌ای طاها محمدی"
            : "Structured CV, academic and professional background of Taha Mohamadi";

    const pageTitle = page
        ? locale === "fa"
            ? page.title_fa
            : page.title_en
        : title;

    return {
        title: pageTitle,
        description,
        alternates: {
            canonical: `/${locale}/resume`,
            languages: {
                fa: "/fa/resume",
                en: "/en/resume",
            },
        },
        openGraph: {
            title: pageTitle,
            description,
            url: `${SITE_URL}/${locale}/resume`,
            type: "profile",
        },
    };
}

/**
 * Resume page — structured CV rendered via SSR.
 *
 * Fetches composed page content from Django CMS (page slug: "resume").
 * Renders blocks using BlockRenderer for education, experience, skills sections.
 * Exactly one H1 per page. No cross-locale fallback.
 */
export default async function ResumePage({ params }: ResumePageProps) {
    const { locale: localeParam } = await params;

    if (!isValidLocale(localeParam)) {
        notFound();
    }

    const locale: Locale = localeParam;
    const page = await getPublicPage("resume", locale);

    if (!page) {
        notFound();
    }

    const pageTitle = locale === "fa" ? page.title_fa : page.title_en;

    return (
        <main>
            <h1 className="sr-only">{pageTitle}</h1>
            {page.sections
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
        </main>
    );
}
