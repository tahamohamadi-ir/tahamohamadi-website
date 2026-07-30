import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchResearchProject, PublicApiError } from "@/lib/api";
import { isValidLocale, SITE_URL, type Locale } from "@/lib/i18n";

interface ResearchDetailPageProps { params: Promise<{ locale: string; slug: string }>; }

export async function generateMetadata({ params }: ResearchDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};
  try {
    const project = await fetchResearchProject(slug, locale);
    return { title: project.title, description: project.summary || project.title, alternates: { canonical: `/${locale}/research/${slug}` }, openGraph: { title: project.title, description: project.summary || project.title, url: `${SITE_URL}/${locale}/research/${slug}`, type: "article" } };
  } catch { return {}; }
}

export default async function ResearchDetailPage({ params }: ResearchDetailPageProps) {
  const { locale: localeParam, slug } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale: Locale = localeParam;
  try {
    const project = await fetchResearchProject(slug, locale);
    return <div className="container mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8"><article><h1 className="text-3xl font-bold tracking-tight md:text-4xl">{project.title}</h1>{project.summary && <p className="mt-6 text-lg leading-8 text-muted-foreground">{project.summary}</p>}{project.methodology && <section className="mt-10"><h2 className="text-xl font-semibold">{locale === "fa" ? "روش" : "Methodology"}</h2><p className="mt-3 leading-8">{project.methodology}</p></section>}</article></div>;
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) notFound();
    return <div className="container mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8"><p role="alert" className="rounded-lg border border-destructive/30 p-5 text-destructive">{locale === "fa" ? "دریافت این پروژه در حال حاضر ممکن نیست." : "This research project is temporarily unavailable."}</p></div>;
  }
}
