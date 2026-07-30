import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { Pagination } from "@/components/blog/Pagination";
import { fetchPublicSiteAggregate, fetchResumeVariants, getPublicPage } from "@/lib/api";
import { isValidLocale, SITE_URL, type Locale } from "@/lib/i18n";
import type { PageDTO, PaginatedResumeVariantsResponse } from "@/lib/types";

interface ResumePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}

const copy = {
  fa: {
    title: "رزومه",
    description: "نسخه‌های منتشرشدهٔ رزومه",
    variants: "نسخه‌های قابل دریافت",
    download: "دریافت فایل",
    empty: "هنوز نسخهٔ منتشرشده‌ای از رزومه در دسترس نیست.",
    error: "دریافت نسخه‌های رزومه در حال حاضر ممکن نیست.",
  },
  en: {
    title: "Resume",
    description: "Published resume variants",
    variants: "Available versions",
    download: "Download file",
    empty: "No published resume variant is available yet.",
    error: "Resume variants are temporarily unavailable.",
  },
} as const;

function parsePage(value?: string): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export async function generateMetadata({ params }: ResumePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const text = copy[locale];
  let page: PageDTO | null = null;
  try {
    page = await getPublicPage("resume", locale);
  } catch {
    // The typed resume projection remains independently available at render time.
  }
  const title = page ? (locale === "fa" ? page.title_fa : page.title_en) : text.title;

  return {
    title,
    description: text.description,
    alternates: {
      canonical: `/${locale}/resume`,
      languages: { fa: "/fa/resume", en: "/en/resume" },
    },
    openGraph: {
      title,
      description: text.description,
      url: `${SITE_URL}/${locale}/resume`,
      type: "profile",
    },
  };
}

export default async function ResumePage({ params, searchParams }: ResumePageProps) {
  const { locale: localeParam } = await params;
  const { page: pageParam } = await searchParams;
  if (!isValidLocale(localeParam)) notFound();

  const locale: Locale = localeParam;
  const text = copy[locale];
  const [pageResult, variantsResult, aggregateResult] = await Promise.allSettled([
    getPublicPage("resume", locale),
    fetchResumeVariants({ locale, page: parsePage(pageParam) }),
    fetchPublicSiteAggregate(locale),
  ]);
  const page = pageResult.status === "fulfilled" ? pageResult.value : null;
  const variants: PaginatedResumeVariantsResponse | null = variantsResult.status === "fulfilled"
    ? variantsResult.value
    : null;
  const profile = aggregateResult.status === "fulfilled" ? aggregateResult.value.identity.profile : null;
  const pageTitle = page ? (locale === "fa" ? page.title_fa : page.title_en) : text.title;

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      {page ? (
        <>
          <h1 className="sr-only">{pageTitle}</h1>
          {page.sections
            .filter((section) => section.enabled)
            .sort((a, b) => a.ordering - b.ordering)
            .map((section) => (
              <section key={section.id} className={`layout-${section.layout}`}>
                {section.blocks
                  .sort((a, b) => a.ordering - b.ordering)
                  .map((block) => <BlockRenderer key={block.id} block={block} locale={locale} context="cms" />)}
              </section>
            ))}
        </>
      ) : (
        <header className="mx-auto mb-10 max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{text.title}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{profile?.headline || text.description}</p>
        </header>
      )}

      <section className="mx-auto mt-10 max-w-4xl" aria-labelledby="resume-variants-heading">
        <h2 id="resume-variants-heading" className="text-2xl font-semibold">{text.variants}</h2>
        {variants === null ? (
          <p role="alert" className="mt-5 rounded-lg border border-destructive/30 p-5 text-center text-destructive">{text.error}</p>
        ) : variants.results.length === 0 ? (
          <p className="py-12 text-center text-lg text-muted-foreground">{text.empty}</p>
        ) : (
          <>
            <div className="mt-5 divide-y divide-border border-y border-border">
              {variants.results.map((variant) => (
                <article key={variant.slug} className="flex flex-col gap-4 py-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{variant.label}</h3>
                    {variant.summary && <p className="mt-2 text-muted-foreground">{variant.summary}</p>}
                  </div>
                  {variant.file.file && (
                    <a
                      href={variant.file.file}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {text.download}
                    </a>
                  )}
                </article>
              ))}
            </div>
            <div className="mt-10">
              <Pagination currentPage={variants.page} totalPages={variants.total_pages} locale={locale} basePath={`/${locale}/resume`} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
