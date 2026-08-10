import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { PublicSiteConfigDTO } from "@/lib/types";

interface FooterProps {
  locale: Locale;
  siteConfig: PublicSiteConfigDTO | null;
}

function isExternalHref(href: string): boolean {
  return href.startsWith("https://");
}

export function Footer({ locale, siteConfig }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const settings = siteConfig?.settings;
  const links = siteConfig?.navigation.footer ?? [];

  if (!settings && links.length === 0) return null;

  const copyright = settings?.footer_text || (settings?.site_title ? `© ${currentYear} ${settings.site_title}` : "");

  const getLocalizedHref = (href: string) => {
    if (isExternalHref(href)) return href;
    const cleanHref = href.startsWith('/') ? href : `/${href}`;
    if (cleanHref === `/${locale}` || cleanHref.startsWith(`/${locale}/`)) {
      return cleanHref;
    }
    return cleanHref === '/' ? `/${locale}` : `/${locale}${cleanHref}`;
  };

  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {copyright && <p className="text-sm text-muted-foreground">{copyright}</p>}
          {links.length > 0 && (
            <nav aria-label={locale === "fa" ? "ناوبری پاورقی" : "Footer navigation"}>
              <ul className="flex flex-wrap items-center gap-2">
                {links.map((item) => {
                  const localizedHref = getLocalizedHref(item.href);
                  return (
                  <li key={`${item.href}-${item.label}`}>
                    {isExternalHref(item.href) ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        href={localizedHref}
                        className="inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                )})}
              </ul>
            </nav>
          )}
        </div>
      </div>
    </footer>
  );
}
