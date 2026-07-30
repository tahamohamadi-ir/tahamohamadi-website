import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPublication, PublicApiError } from "@/lib/api";
import { isValidLocale, SITE_URL, type Locale } from "@/lib/i18n";

interface PublicationDetailPageProps { params: Promise<{ locale: string; slug: string }>; }

export async function generateMetadata({ params }: PublicationDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};
  try { const publication = await fetchPublication(slug, locale); return { title: publication.title, description: publication.abstract || publication.title, alternates: { canonical: `/${locale}/publications/${slug}` }, openGraph: { title: publication.title, description: publication.abstract || publication.title, url: `${SITE_URL}/${locale}/publications/${slug}`, type: "article" } }; } catch { return {}; }
}

export default async function PublicationDetailPage({ params }: PublicationDetailPageProps) {
  const { locale: localeParam, slug } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale: Locale = localeParam;
  try {
    const publication = await fetchPublication(slug, locale);
    return <div className="container mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8"><article><p className="text-sm text-muted-foreground">{publication.publication_type}{publication.published_on ? ` · ${publication.published_on}` : ""}</p><h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{publication.title}</h1>{publication.abstract && <p className="mt-6 text-lg leading-8 text-muted-foreground">{publication.abstract}</p>}{publication.citation && <section className="mt-10"><h2 className="text-xl font-semibold">{locale === "fa" ? "ارجاع" : "Citation"}</h2><p className="mt-3 leading-8">{publication.citation}</p></section>}{publication.doi && <p className="mt-6"><a className="text-primary underline underline-offset-4" href={`https://doi.org/${encodeURIComponent(publication.doi)}`} rel="noreferrer">DOI: {publication.doi}</a></p>}{publication.isbn && <p className="mt-3">ISBN: {publication.isbn}</p>}</article></div>;
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) notFound();
    return <div className="container mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8"><p role="alert" className="rounded-lg border border-destructive/30 p-5 text-destructive">{locale === "fa" ? "دریافت این اثر در حال حاضر ممکن نیست." : "This publication is temporarily unavailable."}</p></div>;
  }
}
