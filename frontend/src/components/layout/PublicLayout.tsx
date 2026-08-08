import type { Locale } from "@/lib/i18n";
import { fetchPublicSiteConfig, getPublicPage } from "@/lib/api";
import type { PageDTO } from "@/lib/types";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface PublicLayoutProps {
  locale: Locale;
  children: React.ReactNode;
}

function homeHeroTitle(page: PageDTO | null): string | null {
  if (!page) return null;

  for (const section of page.sections) {
    for (const block of section.blocks) {
      if (block.block_type !== "hero") continue;
      const title = block.settings?.title;
      if (typeof title === "string" && title.trim()) return title.trim();
    }
  }

  return null;
}

/** Shared public chrome backed by the requested locale's published content. */
export async function PublicLayout({ locale, children }: PublicLayoutProps) {
  const [siteResult, homeResult] = await Promise.allSettled([
    fetchPublicSiteConfig(locale),
    getPublicPage("home", locale),
  ]);
  const siteConfig = siteResult.status === "fulfilled" ? siteResult.value : null;
  const homePage = homeResult.status === "fulfilled" ? homeResult.value : null;
  const configuredTitle = siteConfig?.settings?.site_title?.trim();
  const brandName = configuredTitle || homeHeroTitle(homePage);
  const configuredCtaLabel = siteConfig?.settings?.primary_cta_label?.trim();
  const configuredCtaUrl = siteConfig?.settings?.primary_cta_url?.trim();
  const primaryCta =
    configuredCtaLabel && configuredCtaUrl
      ? { label: configuredCtaLabel, href: configuredCtaUrl }
      : null;

  return (
    <div className="flex min-h-screen flex-col bg-white text-black">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-black focus:shadow-lg focus:ring-2 focus:ring-[#1746e0]"
      >
        {locale === "fa" ? "رفتن به محتوای اصلی" : "Skip to content"}
      </a>
      <Header
        locale={locale}
        brandName={brandName}
        navigationItems={siteConfig?.navigation.header ?? []}
        primaryCta={primaryCta}
      />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer locale={locale} siteConfig={siteConfig} />
    </div>
  );
}
