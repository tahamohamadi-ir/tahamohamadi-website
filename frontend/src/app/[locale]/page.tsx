import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicPage } from "@/lib/api";
import { isValidLocale, SITE_URL, type Locale } from "@/lib/i18n";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";

// Force dynamic rendering — do not pre-render at build time
// since the Django API is not available during Docker build.
export const dynamic = "force-dynamic";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const page = await getPublicPage("home", locale);
  if (!page) return {};

  const title =
    locale === "fa" ? page.title_fa : page.title_en;

  return {
    title,
    openGraph: {
      title,
      url: `${SITE_URL}/${locale}`,
      type: "website",
    },
  };
}

/**
 * Home page with SSR — fetches composed page data from Django API.
 *
 * Renders sections: hero, research focus, selected work,
 * featured publications, latest writing, contact CTA.
 *
 * Displays collections from real published data only (Req 10.10).
 * Unknown block types are excluded (fail-closed).
 */
export default async function HomePage({ params }: HomePageProps) {
  const { locale: localeParam } = await params;

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;
  const page = await getPublicPage("home", locale);

  // If API is unreachable or page not found, show a minimal fallback
  // instead of 404 — the page will revalidate and show real content
  // once the API becomes available.
  if (!page) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold">
            {locale === "fa" ? "طاها محمدی" : "Taha Mohamadi"}
          </h1>
          <p className="mt-4 text-muted-foreground">
            {locale === "fa"
              ? "محتوا در حال بارگذاری است..."
              : "Content is loading..."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main>
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
