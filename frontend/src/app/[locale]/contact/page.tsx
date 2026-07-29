import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale, SITE_URL, type Locale } from "@/lib/i18n";
import { ContactForm } from "@/components/contact/ContactForm";

interface ContactPageProps {
    params: Promise<{ locale: string }>;
}

const content = {
    fa: {
        title: "تماس با من",
        description: "برای ارتباط، پیشنهاد همکاری یا هر سوالی، از فرم زیر استفاده کنید.",
        metaTitle: "تماس",
        metaDescription: "فرم تماس — طاها محمدی",
    },
    en: {
        title: "Get in Touch",
        description:
            "Have a question, collaboration idea, or just want to say hello? Send me a message.",
        metaTitle: "Contact",
        metaDescription: "Contact form — Taha Mohamadi",
    },
} as const;

export async function generateMetadata({
    params,
}: ContactPageProps): Promise<Metadata> {
    const { locale } = await params;
    if (!isValidLocale(locale)) return {};

    const t = content[locale];

    return {
        title: t.metaTitle,
        description: t.metaDescription,
        alternates: {
            canonical: `/${locale}/contact`,
            languages: {
                fa: "/fa/contact",
                en: "/en/contact",
            },
        },
        openGraph: {
            title: t.metaTitle,
            description: t.metaDescription,
            url: `${SITE_URL}/${locale}/contact`,
            type: "website",
        },
    };
}

export default async function ContactPage({ params }: ContactPageProps) {
    const { locale: localeParam } = await params;

    if (!isValidLocale(localeParam)) {
        notFound();
    }

    const locale: Locale = localeParam;
    const t = content[locale];

    return (
        <main className="min-h-[60vh] py-12 md:py-20">
            <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                <div className="mb-8 md:mb-12">
                    <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                        {t.title}
                    </h1>
                    <p className="mt-3 text-lg text-muted-foreground">
                        {t.description}
                    </p>
                </div>

                <ContactForm locale={locale} />
            </div>
        </main>
    );
}
