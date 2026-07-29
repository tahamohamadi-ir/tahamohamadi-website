import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface HeaderProps {
    locale: Locale;
}

const navLinks = {
    fa: [
        { href: "/fa", label: "خانه" },
        { href: "/fa/blog", label: "بلاگ" },
        { href: "/fa/portfolio", label: "نمونه‌کارها" },
        { href: "/fa/about", label: "درباره" },
        { href: "/fa/contact", label: "تماس" },
    ],
    en: [
        { href: "/en", label: "Home" },
        { href: "/en/blog", label: "Blog" },
        { href: "/en/portfolio", label: "Portfolio" },
        { href: "/en/about", label: "About" },
        { href: "/en/contact", label: "Contact" },
    ],
};

export function Header({ locale }: HeaderProps) {
    const links = navLinks[locale];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link
                    href={`/${locale}`}
                    className="text-xl font-bold tracking-tight"
                    aria-label={locale === "fa" ? "صفحه اصلی" : "Home"}
                >
                    {locale === "fa" ? "طاها محمدی" : "Taha Mohamadi"}
                </Link>

                <nav aria-label={locale === "fa" ? "ناوبری اصلی" : "Main navigation"}>
                    <ul className="hidden items-center gap-1 md:flex">
                        {links.map((link) => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className="inline-flex min-h-[44px] items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                        <li>
                            <LanguageSwitcher locale={locale} />
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
}
