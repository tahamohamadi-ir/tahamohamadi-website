import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { getPublicPage } from "@/lib/api";
import { isValidLocale, SITE_URL, type Locale } from "@/lib/i18n";

// The CMS API is only available at request time in the Docker deployment.
export const dynamic = "force-dynamic";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const page = await getPublicPage("home", locale);
  if (!page) return {};

  const title = locale === "fa" ? page.title_fa : page.title_en;
  return {
    title,
    openGraph: {
      title,
      url: `${SITE_URL}/${locale}`,
      type: "website",
    },
  };
}

/** Render only the published, requested-locale Home composition. */
export default async function HomePage({ params }: HomePageProps) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) notFound();

  const locale: Locale = localeParam;
  const page = await getPublicPage("home", locale);
  if (!page) notFound();

  return (
    <div>
      {page.sections
        .filter((section) => section.enabled)
        .sort((a, b) => a.ordering - b.ordering)
        .map((section) => (
          <section key={section.id} className={`layout-${section.layout}`}>
            {section.blocks
              .sort((a, b) => a.ordering - b.ordering)
              .map((block) => (
                <BlockRenderer key={block.id} block={block} locale={locale} context="cms" />
              ))}
          </section>
        ))}
    </div>
  );
}
