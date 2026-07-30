import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pagination } from "@/components/blog/Pagination";
import { fetchResearchProjects } from "@/lib/api";
import { isValidLocale, SITE_URL, type Locale } from "@/lib/i18n";
import type { PaginatedResearchProjectsResponse } from "@/lib/types";

interface ResearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}

const copy = {
  fa: {
    title: "پژوهش",
    description: "پروژه‌ها و فعالیت‌های پژوهشی منتشرشده",
    empty: "هنوز پروژهٔ پژوهشی منتشر نشده است.",
    error: "دریافت پروژه‌های پژوهشی در حال حاضر ممکن نیست.",
    method: "روش",
    featured: "برجسته",
  },
  en: {
    title: "Research",
    description: "Published research projects and activities",
    empty: "No research projects have been published yet.",
    error: "Research projects are temporarily unavailable.",
    method: "Methodology",
    featured: "Featured",
  },
} as const;

function parsePage(value?: string): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export async function generateMetadata({ params }: ResearchPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const text = copy[locale];
  return {
    title: text.title,
    description: text.description,
    alternates: { canonical: `/${locale}/research`, languages: { fa: "/fa/research", en: "/en/research" } },
    openGraph: { title: text.title, description: text.description, url: `${SITE_URL}/${locale}/research`, type: "website" },
  };
}

export default async function ResearchPage({ params, searchParams }: ResearchPageProps) {
  const { locale: localeParam } = await params;
  const { page } = await searchParams;
  if (!isValidLocale(localeParam)) notFound();
  const locale: Locale = localeParam;
  const text = copy[locale];
  let data: PaginatedResearchProjectsResponse | null = null;

  try {
    data = await fetchResearchProjects({ locale, page: parsePage(page) });
  } catch {
    data = null;
  }

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <header className="mx-auto mb-10 max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{text.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{text.description}</p>
      </header>
      {data === null ? (
        <p role="alert" className="mx-auto max-w-2xl rounded-lg border border-destructive/30 p-5 text-center text-destructive">{text.error}</p>
      ) : data.results.length === 0 ? (
        <p className="py-16 text-center text-lg text-muted-foreground">{text.empty}</p>
      ) : (
        <>
          <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
            {data.results.map((project) => {
              const slug = locale === "fa" ? project.slug_fa : project.slug_en;
              return (
                <article key={slug} className="rounded-lg border border-border bg-card p-6">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-xl font-semibold"><Link className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/${locale}/research/${slug}`}>{project.title}</Link></h2>
                    {project.featured && <span className="shrink-0 text-sm text-muted-foreground">{text.featured}</span>}
                  </div>
                  {project.summary && <p className="mt-3 text-muted-foreground">{project.summary}</p>}
                  {project.methodology && <p className="mt-4 text-sm"><span className="font-medium">{text.method}: </span>{project.methodology}</p>}
                </article>
              );
            })}
          </div>
          <div className="mt-10"><Pagination currentPage={data.page} totalPages={data.total_pages} locale={locale} basePath={`/${locale}/research`} /></div>
        </>
      )}
    </div>
  );
}
