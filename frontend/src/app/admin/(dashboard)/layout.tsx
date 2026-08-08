"use client";

import { AuthGuard } from "@/components/admin/auth-guard";
import { AdminNavbar } from "@/components/admin/admin-navbar";
import { AdminNavigationGuardProvider } from "@/components/admin/admin-navigation-guard";

/**
 * Dashboard route group layout.
 * Applies the auth guard and renders the admin navigation bar.
 * Only authenticated admin users can see content inside this layout.
 */
export default function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <AdminNavigationGuardProvider>
                <div className="min-h-screen">
                    <AdminNavbar />
                    <main className="p-6">{children}</main>
                </div>
            </AdminNavigationGuardProvider>
        </AuthGuard>
    );
}
