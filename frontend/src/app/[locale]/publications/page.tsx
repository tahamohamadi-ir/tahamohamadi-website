import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicPage } from "@/lib/api";
import { isValidLocale, SITE_URL, type Locale } from "@/lib/i18n";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";

interface PublicationsPageProps {
    params: Promise<{ locale: string }>;
}

export async function generateMetadata({
    params,
}: PublicationsPageProps): Promise<Metadata> {
    const { locale } = await params;
    if (!isValidLocale(locale)) return {};

    const page = await getPublicPage("publications", locale);

    const title = locale === "fa" ? "انتشارات" : "Publications";
    const description =
        locale === "fa"
            ? "آرشیو مقالات علمی، انتشارات و پژوهش‌های آکادمیک طاها محمدی"
            : "Academic publications archive, research papers and scholarly work by Taha Mohamadi";

    const pageTitle = page
        ? locale === "fa"
            ? page.title_fa
            : page.title_en
        : title;

    return {
        title: pageTitle,
        description,
        alternates: {
            canonical: `/${locale}/publications`,
            languages: {
                fa: "/fa/publications",
                en: "/en/publications",
            },
        },
        openGraph: {
            title: pageTitle,
            description,
            url: `${SITE_URL}/${locale}/publications`,
            type: "website",
        },
    };
}

/**
 * Publications page — academic publication archive rendered via SSR.
 *
 * Fetches composed page content from Django CMS (page slug: "publications").
 * Renders blocks using BlockRenderer for publication lists, highlights.
 * Exactly one H1 per page. No cross-locale fallback.
 */
export default async function PublicationsPage({ params }: PublicationsPageProps) {
    const { locale: localeParam } = await params;

    if (!isValidLocale(localeParam)) {
        notFound();
    }

    const locale: Locale = localeParam;
    const page = await getPublicPage("publications", locale);

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
