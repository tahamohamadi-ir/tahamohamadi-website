import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicPage } from "@/lib/api";
import { isValidLocale, SITE_URL, type Locale } from "@/lib/i18n";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";

interface ResearchPageProps {
    params: Promise<{ locale: string }>;
}

export async function generateMetadata({
    params,
}: ResearchPageProps): Promise<Metadata> {
    const { locale } = await params;
    if (!isValidLocale(locale)) return {};

    const page = await getPublicPage("research", locale);

    const title = locale === "fa" ? "پژوهش" : "Research";
    const description =
        locale === "fa"
            ? "علایق پژوهشی، حوزه‌های تحقیقاتی و زمینه‌های تمرکز طاها محمدی"
            : "Research interests, focus areas and academic pursuits of Taha Mohamadi";

    const pageTitle = page
        ? locale === "fa"
            ? page.title_fa
            : page.title_en
        : title;

    return {
        title: pageTitle,
        description,
        alternates: {
            canonical: `/${locale}/research`,
            languages: {
                fa: "/fa/research",
                en: "/en/research",
            },
        },
        openGraph: {
            title: pageTitle,
            description,
            url: `${SITE_URL}/${locale}/research`,
            type: "website",
        },
    };
}

/**
 * Research page — research interests and focus areas rendered via SSR.
 *
 * Fetches composed page content from Django CMS (page slug: "research").
 * Renders blocks using BlockRenderer for research focus, publications highlights.
 * Exactly one H1 per page. No cross-locale fallback.
 */
export default async function ResearchPage({ params }: ResearchPageProps) {
    const { locale: localeParam } = await params;

    if (!isValidLocale(localeParam)) {
        notFound();
    }

    const locale: Locale = localeParam;
    const page = await getPublicPage("research", locale);

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
