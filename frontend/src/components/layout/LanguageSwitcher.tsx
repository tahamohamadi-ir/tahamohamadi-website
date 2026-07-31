"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { getAlternateLocale, localeConfig } from "@/lib/i18n";

interface LanguageSwitcherProps {
  locale: Locale;
}

function getLocalizedPath(pathname: string, targetLocale: Locale): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return `/${targetLocale}`;

  if (segments[0] === "fa" || segments[0] === "en") {
    segments[0] = targetLocale;
  } else {
    segments.unshift(targetLocale);
  }

  return `/${segments.join("/")}`;
}

export function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const altLocale = getAlternateLocale(locale);
  const altConfig = localeConfig[altLocale];
  const targetPath = getLocalizedPath(pathname, altLocale);

  return (
    <Link
      href={targetPath}
      className="inline-flex min-h-11 items-center gap-1.5 border border-black/15 bg-white px-3 py-2 text-sm font-medium text-black transition-colors hover:border-[#1746e0] hover:text-[#1746e0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1746e0] focus-visible:ring-offset-2"
      lang={altLocale}
      hrefLang={altLocale}
      aria-label={
        locale === "fa"
          ? `تغییر زبان به ${altConfig.name}`
          : `Switch language to ${altConfig.name}`
      }
    >
      <span className="sr-only">
        {locale === "fa" ? "زبان فعلی: فارسی. " : "Current language: English. "}
      </span>
      <span aria-hidden="true" className="text-xs opacity-70">
        {locale === "fa" ? "EN" : "FA"}
      </span>
      <span>{altConfig.name}</span>
    </Link>
  );
}
