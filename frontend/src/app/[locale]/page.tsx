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
    <div className="home-landing bg-white text-black">
      {page.sections
        .sort((a, b) => a.ordering - b.ordering)
        .map((section) => (
          <div
            key={section.id}
            className={
              section.layout === "grid"
                ? "layout-grid border-y border-black/10 bg-[#f5f5f2] px-5 py-16 sm:px-8 md:py-24 lg:px-12 [&_.prose]:mx-auto [&_.prose]:max-w-[1120px] [&_.prose]:border-s-2 [&_.prose]:border-[#1746e0] [&_.prose]:ps-7 [&_.prose]:text-start [&_.prose]:text-xl [&_.prose]:font-medium [&_.prose]:leading-9 [&_.prose]:text-black sm:[&_.prose]:ps-10 sm:[&_.prose]:text-2xl md:[&_.prose]:text-3xl md:[&_.prose]:leading-[1.45]"
                : `layout-${section.layout}`
            }
          >
            {section.blocks
              .sort((a, b) => a.ordering - b.ordering)
              .map((block) => (
                <BlockRenderer key={block.id} block={block} locale={locale} context="cms" />
              ))}
          </div>
        ))}
    </div>
  );
}
