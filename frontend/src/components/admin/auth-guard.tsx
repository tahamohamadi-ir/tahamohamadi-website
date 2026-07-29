"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./auth/AuthProvider";

interface AuthGuardProps {
    children: ReactNode;
}

/**
 * Auth guard component that protects admin routes.
 * Redirects unauthenticated users to /admin/login.
 * Shows a loading spinner while checking session status.
 */
export function AuthGuard({ children }: AuthGuardProps) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            // Redirect to login with return URL
            const returnUrl = encodeURIComponent(pathname);
            router.replace(`/admin/login?returnUrl=${returnUrl}`);
        }
    }, [isAuthenticated, isLoading, router, pathname]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
                    <p className="text-sm text-muted-foreground">
                        Checking authentication...
                    </p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Render nothing while redirect is in progress
        return null;
    }

    return <>{children}</>;
}
