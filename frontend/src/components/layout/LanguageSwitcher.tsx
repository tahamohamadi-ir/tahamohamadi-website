"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { getAlternateLocale, localeConfig } from "@/lib/i18n";

interface LanguageSwitcherProps {
    locale: Locale;
}

/**
 * Replaces the locale prefix in a pathname with the target locale.
 * e.g., /fa/blog → /en/blog, /en/portfolio/my-project → /fa/portfolio/my-project
 */
function getLocalizedPath(pathname: string, targetLocale: Locale): string {
    // Remove the current locale prefix and prepend the target locale
    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0) {
        return `/${targetLocale}`;
    }

    // If the first segment is a locale, replace it
    const firstSegment = segments[0];
    if (firstSegment === "fa" || firstSegment === "en") {
        segments[0] = targetLocale;
    } else {
        // No locale prefix found — prepend the target locale
        segments.unshift(targetLocale);
    }

    return `/${segments.join("/")}`;
}

/**
 * Language switcher component that navigates to the equivalent page
 * in the alternate locale while preserving the current path.
 */
export function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
    const pathname = usePathname();
    const altLocale = getAlternateLocale(locale);
    const altConfig = localeConfig[altLocale];
    const currentConfig = localeConfig[locale];
    const targetPath = getLocalizedPath(pathname, altLocale);

    return (
        <Link
            href={targetPath}
            locale={false}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
