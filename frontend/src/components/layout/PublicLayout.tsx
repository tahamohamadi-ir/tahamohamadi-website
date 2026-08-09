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

function hexToHSL(hex: string): string | null {
  if (!hex || !/^#([0-9a-fA-F]{3}){1,2}$/.test(hex)) return null;
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  } else {
    return null;
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
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

  // Extract design tokens
  const primaryColorFa = siteConfig?.settings?.design_tokens?.colors?.fa?.primary;
  const primaryColorEn = siteConfig?.settings?.design_tokens?.colors?.en?.primary;
  const activePrimaryColor = locale === "fa" ? primaryColorFa : primaryColorEn;
  const hslPrimary = activePrimaryColor ? hexToHSL(activePrimaryColor) : null;

  // Use a data attribute for theme preset
  const themePreset = siteConfig?.settings?.theme_preset || "default";
  const density = siteConfig?.settings?.density || "comfortable";

  return (
    <div 
      className="flex min-h-screen flex-col bg-background text-foreground"
      data-theme={themePreset}
      data-density={density}
      style={{
        ...(hslPrimary ? { "--primary": hslPrimary, "--brand-primary": hslPrimary } as React.CSSProperties : {})
      }}
    >
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
