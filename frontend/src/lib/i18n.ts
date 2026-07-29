/**
 * Internationalization configuration for the bilingual site.
 * Supports Persian (fa, RTL) and English (en, LTR).
 */

export const locales = ["fa", "en"] as const;
export type Locale = (typeof locales)[number];

export const SUPPORTED_LOCALES = locales;
export const defaultLocale: Locale = "fa";
export const DEFAULT_LOCALE = defaultLocale;

export const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://tahamohamadi.ir";

export const localeConfig: Record<Locale, { dir: "rtl" | "ltr"; name: string }> = {
    fa: { dir: "rtl", name: "فارسی" },
    en: { dir: "ltr", name: "English" },
};

/**
 * Get text direction for a given locale.
 */
export function getDirection(locale: Locale): "rtl" | "ltr" {
    return localeConfig[locale].dir;
}

/**
 * Get the alternate locale for hreflang tags.
 */
export function getAlternateLocale(locale: Locale): Locale {
    return locale === "fa" ? "en" : "fa";
}

/**
 * Check if a string is a valid supported locale.
 */
export function isValidLocale(value: string): value is Locale {
    return locales.includes(value as Locale);
}

/**
 * Extract the locale from the first segment of a pathname.
 * Returns null if no valid locale is found.
 */
export function getLocaleFromPathname(pathname: string): Locale | null {
    const segments = pathname.split("/").filter(Boolean);
    const firstSegment = segments[0];
    if (firstSegment && isValidLocale(firstSegment)) {
        return firstSegment;
    }
    return null;
}

/**
 * Detect preferred locale from Accept-Language header.
 * Returns the best matching locale or the default.
 */
export function detectLocaleFromHeaders(acceptLanguage: string | null): Locale {
    if (!acceptLanguage) return defaultLocale;

    // Parse Accept-Language header: e.g., "fa,en-US;q=0.9,en;q=0.8"
    const languages = acceptLanguage
        .split(",")
        .map((lang) => {
            const [code, qParam] = lang.trim().split(";");
            const q = qParam ? parseFloat(qParam.split("=")[1]) : 1;
            return { code: code.trim().toLowerCase(), q };
        })
        .sort((a, b) => b.q - a.q);

    for (const { code } of languages) {
        // Direct match
        if (isValidLocale(code)) return code;
        // Match by primary language subtag (e.g., "fa-IR" → "fa")
        const primary = code.split("-")[0];
        if (isValidLocale(primary)) return primary;
    }

    return defaultLocale;
}
