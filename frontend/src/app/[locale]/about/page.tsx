import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicPage } from "@/lib/api";
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

    const page = await getPublicPage("about", locale);

    const title = locale === "fa" ? "درباره من" : "About";
    const description =
        locale === "fa"
            ? "بیوگرافی، معرفی و پروفایل حرفه‌ای طاها محمدی"
            : "Biography, introduction and professional profile of Taha Mohamadi";

    const pageTitle = page
        ? locale === "fa"
            ? page.title_fa
            : page.title_en
        : title;

    return {
        title: pageTitle,
        description,
        alternates: {
            canonical: `/${locale}/about`,
            languages: {
                fa: "/fa/about",
                en: "/en/about",
            },
        },
        openGraph: {
            title: pageTitle,
            description,
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
    const page = await getPublicPage("about", locale);

    if (!page) {
        notFound();
    }

    const pageTitle = locale === "fa" ? page.title_fa : page.title_en;

    return (
        <div>
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
        </div>
    );
}
