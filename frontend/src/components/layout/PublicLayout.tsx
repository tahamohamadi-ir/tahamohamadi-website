import type { Locale } from "@/lib/i18n";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface PublicLayoutProps {
    locale: Locale;
    children: React.ReactNode;
}

/**
 * PublicLayout wraps all public-facing pages with shared
 * navigation header and footer. Locale-specific styling
 * (RTL/LTR, fonts) is handled at the [locale]/layout.tsx level.
 */
export function PublicLayout({ locale, children }: PublicLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col">
            {/* Skip to content link for keyboard users */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg focus:ring-2 focus:ring-ring"
            >
                {locale === "fa" ? "رفتن به محتوای اصلی" : "Skip to content"}
            </a>
            <Header locale={locale} />
            <main id="main-content" className="flex-1">{children}</main>
            <Footer locale={locale} />
        </div>
    );
}
