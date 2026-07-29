import Link from "next/link";
import type { Locale } from "@/lib/i18n";

interface FooterProps {
    locale: Locale;
}

export function Footer({ locale }: FooterProps) {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-border/40 bg-muted/30">
            <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                    <p className="text-sm text-muted-foreground">
                        {locale === "fa"
                            ? `© ${currentYear} طاها محمدی. تمامی حقوق محفوظ است.`
                            : `© ${currentYear} Taha Mohamadi. All rights reserved.`}
                    </p>
                    <nav aria-label={locale === "fa" ? "ناوبری پاورقی" : "Footer navigation"}>
                        <ul className="flex items-center gap-2">
                            <li>
                                <Link
                                    href={`/${locale}/about`}
                                    className="inline-flex min-h-[44px] items-center rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    {locale === "fa" ? "درباره" : "About"}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${locale}/contact`}
                                    className="inline-flex min-h-[44px] items-center rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    {locale === "fa" ? "تماس" : "Contact"}
                                </Link>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </footer>
    );
}
