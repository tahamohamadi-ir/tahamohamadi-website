import Link from "next/link";
import type { Locale } from "@/lib/i18n";

interface RoleFilterProps {
    roles: string[];
    activeRole: string | null;
    activeTechnology?: string | null;
    locale: Locale;
}

/**
 * Role filter bar for filtering portfolio case studies.
 * Uses URL search params for SSR-friendly state management.
 */
export function RoleFilter({
    roles,
    activeRole,
    activeTechnology,
    locale,
}: RoleFilterProps) {
    const allLabel = locale === "fa" ? "همه نقش‌ها" : "All Roles";
    const filterLabel = locale === "fa" ? "فیلتر بر اساس نقش:" : "Filter by role:";

    return (
        <nav
            className="mb-8"
            aria-label={locale === "fa" ? "فیلتر نقش" : "Role filter"}
        >
            <p className="mb-3 text-sm font-medium text-muted-foreground">
                {filterLabel}
            </p>
            <div className="flex flex-wrap gap-2">
                {/* "All" button */}
                <Link
                    href={`/${locale}/portfolio${activeTechnology ? `?technology=${encodeURIComponent(activeTechnology)}` : ""}`}
                    className={`inline-flex min-h-[44px] items-center rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${!activeRole
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                >
                    {allLabel}
                </Link>

                {/* Role filter buttons */}
                {roles.map((role) => {
                    const query = new URLSearchParams();
                    query.set("role", role);
                    if (activeTechnology) query.set("technology", activeTechnology);
                    return (
                    <Link
                        key={role}
                        href={`/${locale}/portfolio?${query.toString()}`}
                        className={`inline-flex min-h-[44px] items-center rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${activeRole === role
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            }`}
                    >
                        {role}
                    </Link>
                    );
                })}
            </div>
        </nav>
    );
}
