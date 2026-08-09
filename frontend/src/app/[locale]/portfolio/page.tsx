import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale, SITE_URL, type Locale } from "@/lib/i18n";
import { fetchPortfolioList } from "@/lib/api";
import type { CaseStudyListItem, PaginatedResponse } from "@/lib/types";
import { CaseStudyCard } from "./_components/CaseStudyCard";
import { TechnologyFilter } from "./_components/TechnologyFilter";
import { RoleFilter } from "./_components/RoleFilter";
import { Pagination } from "./_components/Pagination";

interface PortfolioPageProps {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ page?: string; technology?: string; role?: string }>;
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    if (!isValidLocale(locale)) return {};

    const title = locale === "fa" ? "نمونه‌کارها" : "Portfolio";
    const description =
        locale === "fa"
            ? "مجموعه پروژه‌ها و نمونه‌کارهای طاها محمدی"
            : "Case studies and projects by Taha Mohamadi";

    return {
        title,
        description,
        alternates: {
            canonical: `/${locale}/portfolio`,
            languages: {
                fa: "/fa/portfolio",
                en: "/en/portfolio",
            },
        },
        openGraph: {
            title,
            description,
            url: `${SITE_URL}/${locale}/portfolio`,
            type: "website",
        },
    };
}

export default async function PortfolioPage({
    params,
    searchParams,
}: PortfolioPageProps) {
    const { locale } = await params;
    const { page, technology, role } = await searchParams;

    if (!isValidLocale(locale)) {
        notFound();
    }

    const validLocale: Locale = locale;
    const currentPage = page ? parseInt(page, 10) : 1;

    let data: PaginatedResponse<CaseStudyListItem>;

    try {
        data = await fetchPortfolioList({
            page: currentPage,
            technologies: technology || undefined,
            role: role || undefined,
        });
    } catch {
        // If API is unavailable, render empty state
        data = {
            count: 0,
            page: 1,
            page_size: 20,
            total_pages: 0,
            next: null,
            previous: null,
            results: [],
        };
    }

    const caseStudies = data.results;
    const featuredStudies = caseStudies.filter((cs) => cs.featured);
    const regularStudies = caseStudies.filter((cs) => !cs.featured);

    // Extract all unique technologies for filter options
    const allTechnologies = Array.from(
        new Set(caseStudies.flatMap((cs) => cs.technologies))
    ).sort();

    // Extract all unique roles
    const allRoles = Array.from(
        new Set(
            caseStudies
                .map((cs) => (validLocale === "fa" ? cs.role_fa : cs.role_en))
                .filter(Boolean)
        )
    ).sort();

    const pageTitle = validLocale === "fa" ? "نمونه‌کارها" : "Portfolio";
    const pageSubtitle =
        validLocale === "fa"
            ? "مجموعه پروژه‌ها و تجربه‌های حرفه‌ای"
            : "A collection of projects and professional experiences";
    const emptyMessage =
        validLocale === "fa"
            ? "هنوز نمونه‌کاری منتشر نشده است."
            : "No case studies published yet.";
    const featuredLabel =
        validLocale === "fa" ? "پروژه‌های برجسته" : "Featured Projects";

    return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            {/* Page Header */}
            <header className="mb-8 text-center">
                <h1 className="text-3xl font-bold md:text-4xl">{pageTitle}</h1>
                <p className="mt-2 text-lg text-muted-foreground">{pageSubtitle}</p>
            </header>

            {/* Filters */}
            <div className="mb-8 space-y-6">
                {allRoles.length > 0 && (
                    <RoleFilter
                        roles={allRoles}
                        activeRole={role || null}
                        activeTechnology={technology || null}
                        locale={validLocale}
                    />
                )}
                
                {allTechnologies.length > 0 && (
                    <TechnologyFilter
                        technologies={allTechnologies}
                        activeTechnology={technology || null}
                        activeRole={role || null}
                        locale={validLocale}
                    />
                )}
            </div>

            {/* Empty State */}
            {caseStudies.length === 0 && (
                <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
                    <p className="text-lg text-muted-foreground">{emptyMessage}</p>
                </div>
            )}

            {/* Featured Case Studies */}
            {featuredStudies.length > 0 && (
                <section className="mb-12" aria-label={featuredLabel}>
                    <h2 className="mb-6 text-2xl font-semibold">{featuredLabel}</h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {featuredStudies.map((cs) => (
                            <CaseStudyCard
                                key={cs.id}
                                caseStudy={cs}
                                locale={validLocale}
                                featured
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Regular Case Studies Grid */}
            {regularStudies.length > 0 && (
                <section aria-label={validLocale === "fa" ? "پروژه‌ها" : "Projects"}>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {regularStudies.map((cs) => (
                            <CaseStudyCard key={cs.id} caseStudy={cs} locale={validLocale} />
                        ))}
                    </div>
                </section>
            )}

            {/* Pagination */}
            {data.total_pages > 1 && (
                <Pagination
                    currentPage={data.page}
                    totalPages={data.total_pages}
                    locale={validLocale}
                    technology={technology || null}
                    role={role || null}
                />
            )}
        </div>
    );
}
