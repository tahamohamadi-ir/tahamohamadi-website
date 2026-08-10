import type { Metadata } from "next";
import { AuthProvider } from "@/components/admin/auth-context";

export const metadata: Metadata = {
  title: "Admin CMS — TahaMohamadi.ir",
  description: "Content management system",
  robots: { index: false, follow: false },
};

/**
 * Root admin layout.
 * Provides the AuthProvider context to all admin routes (including login).
 * The AuthGuard is applied within the (dashboard) route group, not here,
 * so that the login page remains accessible without authentication.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
