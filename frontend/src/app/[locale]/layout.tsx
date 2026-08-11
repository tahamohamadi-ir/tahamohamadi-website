import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";
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
import { A11yProvider } from "@/components/a11y-provider";
import { hexToHsl, getContrastForegroundHsl } from "@/lib/color-utils";
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

  // Fetch site config for design tokens
  const siteConfig = await fetchPublicSiteConfig(validLocale).catch(() => null);
  const designTokens = (siteConfig?.settings?.design_tokens || {}) as { colors?: Record<string, { primary?: string }> };
  const primaryColorHex = designTokens?.colors?.[validLocale]?.primary;
  
  let customStyles = "";
  if (primaryColorHex) {
    const primaryHsl = hexToHsl(primaryColorHex);
    const primaryForegroundHsl = getContrastForegroundHsl(primaryColorHex);
    customStyles = `
      :root {
        --primary: ${primaryHsl};
        --primary-foreground: ${primaryForegroundHsl};
      }
      .dark {
        --primary: ${primaryHsl};
        --primary-foreground: ${primaryForegroundHsl};
      }
    `;
  }

  return (
    <html lang={validLocale} dir={dir} suppressHydrationWarning>
      {customStyles ? <style dangerouslySetInnerHTML={{ __html: customStyles }} /> : null}
      <body className={`${fontClass} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <A11yProvider>
            <PublicLayout locale={validLocale}>{children}</PublicLayout>
          </A11yProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
