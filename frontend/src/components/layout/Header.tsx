"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import type { PublicNavigationItemDTO } from "@/lib/types";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface HeaderProps {
  locale: Locale;
  brandName: string | null;
  navigationItems: PublicNavigationItemDTO[];
}

function isExternalHref(href: string): boolean {
  return href.startsWith("https://");
}

export function Header({ locale, brandName, navigationItems }: HeaderProps) {
  const pathname = usePathname();
  const navigationLabel = locale === "fa" ? "ناوبری اصلی" : "Main navigation";
  const menuLabel = locale === "fa" ? "فهرست" : "Menu";
  const isActive = (href: string) =>
    href === `/${locale}` ? pathname === href : pathname.startsWith(`${href}/`) || pathname === href;

  const navigation = (mobile = false) => (
    <nav aria-label={mobile ? `${navigationLabel} — ${menuLabel}` : navigationLabel}>
      <ul className={mobile ? "flex flex-col" : "flex items-center gap-7 lg:gap-9"}>
        {navigationItems.map((link) => {
          const external = isExternalHref(link.href);
          const active = isActive(link.href);
          return (
            <li key={link.href}>
              {external ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className={
                    mobile
                      ? "block border-b border-black/10 px-5 py-4 text-base font-medium last:border-b-0"
                      : "relative block py-7 text-sm font-medium text-black transition-colors hover:text-[#1746e0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1746e0]"
                  }
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    mobile
                      ? "block border-b border-black/10 px-5 py-4 text-base font-medium last:border-b-0"
                      : `relative block py-7 text-sm font-medium transition-colors hover:text-[#1746e0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1746e0] ${
                          active
                            ? "text-[#1746e0] after:absolute after:inset-x-0 after:bottom-[18px] after:h-0.5 after:bg-[#1746e0]"
                            : "text-black"
                        }`
                  }
                >
                  {link.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <header className="relative z-50 w-full border-b border-black/10 bg-white text-black">
      <div className="mx-auto grid min-h-16 w-full max-w-[1440px] grid-cols-[1fr_auto] items-center gap-4 px-5 sm:px-8 md:min-h-[76px] md:grid-cols-[1fr_auto_1fr] lg:px-12">
        <div className="min-w-0">
          {brandName && (
            <Link
              href={`/${locale}`}
              className="block truncate text-base font-bold tracking-[-0.025em] sm:text-lg"
            >
              {brandName}
            </Link>
          )}
        </div>

        {navigationItems.length > 0 && <div className="hidden md:block">{navigation()}</div>}

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          {navigationItems.length > 0 && (
            <details className="group relative md:hidden">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 border border-black/15 px-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                <span aria-hidden="true" className="grid gap-1">
                  <span className="block h-px w-4 bg-black" />
                  <span className="block h-px w-4 bg-black" />
                  <span className="block h-px w-4 bg-black" />
                </span>
                {menuLabel}
              </summary>
              <div
                className={`absolute top-[calc(100%+10px)] w-64 border border-black/15 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.10)] ${
                  locale === "fa" ? "left-0" : "right-0"
                }`}
              >
                {navigation(true)}
              </div>
            </details>
          )}
          <LanguageSwitcher locale={locale} />
        </div>
      </div>
    </header>
  );
}
