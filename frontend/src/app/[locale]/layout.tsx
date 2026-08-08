import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  isValidLocale,
  localeConfig,
  locales,
  getAlternateLocale,
  SITE_URL,
  type Locale,
} from "@/lib/i18n";
import { fetchPublicSiteConfig } from "@/lib/api";
import { inter, vazirmatn } from "@/lib/fonts";
import { PublicLayout } from "@/components/layout";
import "../globals.css";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const siteConfig = await fetchPublicSiteConfig(locale).catch(() => null);
  const settings = siteConfig?.settings;
  const siteTitle = settings?.site_title.trim() || undefined;
  const title = settings?.default_title.trim() || siteTitle;
  const description = settings?.default_description.trim() || undefined;
  const altLocale = getAlternateLocale(locale);

  return {
    ...(title
      ? {
          title: {
            default: title,
            template: siteTitle ? `%s | ${siteTitle}` : "%s",
          },
        }
      : {}),
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        fa: "/fa",
        en: "/en",
        "x-default": `/${locale}`,
      },
    },
    openGraph: {
      ...(title ? { title } : {}),
      description,
      url: `${SITE_URL}/${locale}`,
      siteName: siteTitle,
      locale: locale === "fa" ? "fa_IR" : "en_US",
      alternateLocale: altLocale === "fa" ? "fa_IR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      ...(title ? { title } : {}),
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale — return 404 if invalid
  if (!isValidLocale(locale)) {
    notFound();
  }

  const validLocale: Locale = locale;
  const { dir } = localeConfig[validLocale];

  // Apply locale-specific font: Vazirmatn for Persian (RTL), Inter for English (LTR)
  const fontClass =
    validLocale === "fa"
      ? `${vazirmatn.variable} font-vazirmatn`
      : `${inter.variable} font-inter`;

  return (
    <html lang={validLocale} dir={dir} suppressHydrationWarning>
      <body className={`${fontClass} antialiased`}>
        <PublicLayout locale={validLocale}>{children}</PublicLayout>
      </body>
    </html>
  );
}
