import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pagination } from "@/components/blog/Pagination";
import { fetchPublications } from "@/lib/api";
import { isValidLocale, SITE_URL, type Locale } from "@/lib/i18n";
import type { PaginatedPublicationsResponse, PublicationDTO } from "@/lib/types";

interface PublicationsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; type?: string; year?: string }>;
}

const copy = {
  fa: {
    title: "انتشارات",
    description: "آرشیو آثار و انتشارهای علمی",
    empty: "هنوز اثری منتشر نشده است.",
    error: "دریافت انتشارات در حال حاضر ممکن نیست.",
    type: "نوع",
    year: "سال",
    apply: "اعمال",
    all: "همه",
  },
  en: {
    title: "Publications",
    description: "Archive of published scholarly work",
    empty: "No publications have been published yet.",
    error: "Publications are temporarily unavailable.",
    type: "Type",
    year: "Year",
    apply: "Apply",
    all: "All",
  },
} as const;

const publicationTypes: PublicationDTO["publication_type"][] = [
  "article",
  "book",
  "conference",
  "report",
  "manuscript",
];

function parsePage(value?: string): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function validType(value?: string): PublicationDTO["publication_type"] | undefined {
  return publicationTypes.includes(value as PublicationDTO["publication_type"])
    ? (value as PublicationDTO["publication_type"])
    : undefined;
}

function validYear(value?: string): string | undefined {
  return value && /^\d{4}$/.test(value) ? value : undefined;
}

export async function generateMetadata({ params }: PublicationsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const text = copy[locale];
  return {
    title: text.title,
    description: text.description,
    alternates: {
      canonical: `/${locale}/publications`,
      languages: { fa: "/fa/publications", en: "/en/publications" },
    },
    openGraph: {
      title: text.title,
      description: text.description,
      url: `${SITE_URL}/${locale}/publications`,
      type: "website",
    },
  };
}

export default async function PublicationsPage({ params, searchParams }: PublicationsPageProps) {
  const { locale: localeParam } = await params;
  const { page, type, year: yearParam } = await searchParams;
  if (!isValidLocale(localeParam)) notFound();

  const locale: Locale = localeParam;
  const text = copy[locale];
  const selectedType = validType(type);
  const year = validYear(yearParam);
  let data: PaginatedPublicationsResponse | null = null;

  try {
    data = await fetchPublications({ locale, page: parsePage(page), type: selectedType, year });
  } catch {
    data = null;
  }

  const labels: Record<PublicationDTO["publication_type"], string> = locale === "fa"
    ? {
        article: "مقاله",
        book: "کتاب",
        conference: "مقالهٔ کنفرانسی",
        report: "گزارش",
        manuscript: "دست‌نویس",
      }
    : {
        article: "Article",
        book: "Book",
        conference: "Conference paper",
        report: "Report",
        manuscript: "Manuscript",
      };
  const paginationSearchParams: Record<string, string> = {};
  if (selectedType) paginationSearchParams.type = selectedType;
  if (year) paginationSearchParams.year = year;

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <header className="mx-auto mb-8 max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{text.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{text.description}</p>
      </header>

      <form action={`/${locale}/publications`} className="mx-auto mb-10 flex max-w-2xl flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="publication-type">{text.type}</label>
        <select id="publication-type" name="type" defaultValue={selectedType ?? ""} className="min-h-11 rounded-md border border-input bg-background px-3">
          <option value="">{text.all}</option>
          {publicationTypes.map((value) => <option key={value} value={value}>{labels[value]}</option>)}
        </select>
        <label className="sr-only" htmlFor="publication-year">{text.year}</label>
        <input id="publication-year" name="year" defaultValue={year} inputMode="numeric" pattern="[0-9]{4}" placeholder={text.year} className="min-h-11 rounded-md border border-input bg-background px-3" />
        <button className="min-h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" type="submit">{text.apply}</button>
      </form>

      {data === null ? (
        <p role="alert" className="mx-auto max-w-2xl rounded-lg border border-destructive/30 p-5 text-center text-destructive">{text.error}</p>
      ) : data.results.length === 0 ? (
        <p className="py-16 text-center text-lg text-muted-foreground">{text.empty}</p>
      ) : (
        <>
          <div className="mx-auto max-w-4xl divide-y divide-border border-y border-border">
            {data.results.map((publication) => {
              const slug = locale === "fa" ? publication.slug_fa : publication.slug_en;
              return (
                <article key={slug} className="py-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h2 className="text-xl font-semibold">
                      <Link className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/${locale}/publications/${slug}`}>{publication.title}</Link>
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      {labels[publication.publication_type]}{publication.published_on ? ` · ${publication.published_on.slice(0, 4)}` : ""}
                    </span>
                  </div>
                  {publication.abstract && <p className="mt-3 text-muted-foreground">{publication.abstract}</p>}
                  {publication.citation && <p className="mt-3 text-sm text-muted-foreground">{publication.citation}</p>}
                </article>
              );
            })}
          </div>
          <div className="mt-10">
            <Pagination currentPage={data.page} totalPages={data.total_pages} locale={locale} basePath={`/${locale}/publications`} searchParams={paginationSearchParams} />
          </div>
        </>
      )}
    </div>
  );
}
