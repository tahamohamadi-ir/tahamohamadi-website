import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { getPublicPage } from "@/lib/api";
import { isValidLocale, SITE_URL, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

interface CustomCmsPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

function localizedPath(locale: Locale, slug: string): string {
  return `/${locale}/${slug}`;
}

export async function generateMetadata({ params }: CustomCmsPageProps): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  if (!isValidLocale(localeParam)) return {};

  const locale: Locale = localeParam;
  const page = await getPublicPage(slug, locale);
  if (!page) return {};

  const title = locale === "fa" ? page.title_fa : page.title_en;
  const canonical = localizedPath(locale, locale === "fa" ? page.slug_fa : page.slug_en);
  return {
    title,
    alternates: {
      canonical,
      languages: {
        fa: localizedPath("fa", page.slug_fa),
        en: localizedPath("en", page.slug_en),
      },
    },
    openGraph: { title, type: "website", url: `${SITE_URL}${canonical}` },
  };
}

const sectionLayoutClasses: Record<string, string> = {
  "full-width": "w-full",
  "two-column": "grid gap-8 md:grid-cols-2",
  "three-column": "grid gap-8 md:grid-cols-3",
  "sidebar-left": "grid gap-8 md:grid-cols-[minmax(0,0.4fr)_minmax(0,1fr)]",
  "sidebar-right": "grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,0.4fr)]",
};

export default async function CustomCmsPage({ params }: CustomCmsPageProps) {
  const { locale: localeParam, slug } = await params;
  if (!isValidLocale(localeParam)) return notFound();

  const locale: Locale = localeParam;
  const page = await getPublicPage(slug, locale);
  if (!page) return notFound();

  return (
    <div dir={locale === "fa" ? "rtl" : "ltr"} className="bg-white text-black">
      {page.sections
        .filter((section) => section.enabled)
        .sort((a, b) => a.ordering - b.ordering)
        .map((section) => (
          <section
            key={section.id}
            className={sectionLayoutClasses[section.layout] ?? "w-full"}
          >
            {section.blocks
              .slice()
              .sort((a, b) => a.ordering - b.ordering)
              .map((block) => (
                <BlockRenderer key={block.id} block={block} locale={locale} context="cms" />
              ))}
          </section>
        ))}
    </div>
  );
}
