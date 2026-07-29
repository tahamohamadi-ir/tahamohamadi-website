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

  const altLocale = getAlternateLocale(locale);

  const title =
    locale === "fa"
      ? "طاها محمدی — وبسایت شخصی"
      : "Taha Mohamadi — Personal Website";

  const description =
    locale === "fa"
      ? "وبسایت شخصی، بلاگ، نمونه‌کارها و رزومه طاها محمدی"
      : "Personal website, blog, portfolio and resume of Taha Mohamadi";

  return {
    title: {
      default: title,
      template:
        locale === "fa" ? "%s | طاها محمدی" : "%s | Taha Mohamadi",
    },
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
      title,
      description,
      url: `${SITE_URL}/${locale}`,
      siteName:
        locale === "fa" ? "طاها محمدی" : "Taha Mohamadi",
      locale: locale === "fa" ? "fa_IR" : "en_US",
      alternateLocale: altLocale === "fa" ? "fa_IR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
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
