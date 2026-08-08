"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { useAuth } from "./auth-context";
import { useAdminNavigationGuard } from "./admin-navigation-guard";

const navItems = [
    { href: "/admin", label: "داشبورد", icon: "📊" },
    { href: "/admin/pages", label: "صفحات", icon: "📄" },
    { href: "/admin/blog", label: "مقالات", icon: "✍️" },
    { href: "/admin/portfolio", label: "نمونه‌کارها", icon: "💼" },
    { href: "/admin/media", label: "رسانه‌ها", icon: "🖼️" },
    { href: "/admin/workflow", label: "گردش‌کار", icon: "🔄" },
];

export function AdminNavbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const { confirmNavigation } = useAdminNavigationGuard();

    async function handleLogout() {
        if (!confirmNavigation()) return;
        await logout();
        window.location.href = "/admin/login";
    }

    function handleNavigation(event: MouseEvent<HTMLAnchorElement>) {
        if (!confirmNavigation()) event.preventDefault();
    }

    function isActive(href: string) {
        if (href === "/admin") return pathname === "/admin";
        return pathname.startsWith(href);
    }

    return (
        <nav className="border-b bg-white">
            <div className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-6">
                    <Link href="/admin" onClick={handleNavigation} className="text-lg font-semibold text-gray-900">
                        Admin CMS
                    </Link>
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={handleNavigation}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(item.href)
                                        ? "bg-gray-900 text-white"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {user && (
                        <span className="text-sm text-gray-600">{user.username}</span>
                    )}
                    <button
                        onClick={handleLogout}
                        className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
                    >
                        خروج
                    </button>
                </div>
            </div>

            {/* Mobile nav */}
            <div className="md:hidden flex overflow-x-auto border-t px-4 py-2 gap-1">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={handleNavigation}
                        className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${isActive(item.href)
                                ? "bg-gray-900 text-white"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
        </nav>
    );
}
