import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, getLocaleFromPathname, detectLocaleFromHeaders, locales } from "@/lib/i18n";

/**
 * i18n middleware for locale-prefixed routing.
 *
 * - Detects locale from URL path (/fa/... or /en/...)
 * - Redirects root (/) to the preferred locale based on Accept-Language
 * - Skips locale handling for static assets, API routes, and admin paths
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip middleware for paths that should not be locale-prefixed
    if (shouldSkipMiddleware(pathname)) {
        return NextResponse.next();
    }

    // Check if the pathname already has a valid locale prefix
    const pathnameLocale = getLocaleFromPathname(pathname);

    if (pathnameLocale) {
        // Locale is present — set response header for downstream use
        const response = NextResponse.next();
        response.headers.set("x-locale", pathnameLocale);
        return response;
    }

    // No locale in the path — redirect to the appropriate locale
    const preferredLocale = detectLocaleFromHeaders(
        request.headers.get("accept-language")
    );
    const locale = preferredLocale || defaultLocale;

    // Build the redirect URL with the locale prefix
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

    return NextResponse.redirect(redirectUrl);
}

/**
 * Determine if middleware should skip a given path.
 * Static files, API routes, Next.js internals, and admin routes are skipped.
 */
function shouldSkipMiddleware(pathname: string): boolean {
    // Next.js internals and static assets
    if (pathname.startsWith("/_next/")) return true;
    if (pathname.startsWith("/api/")) return true;
    if (pathname.startsWith("/admin")) return true;

    // Static file extensions
    if (/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|otf|css|js|map)$/.test(pathname)) {
        return true;
    }

    // Public files
    if (pathname === "/favicon.ico" || pathname === "/robots.txt" || pathname === "/sitemap.xml") {
        return true;
    }

    return false;
}

export const config = {
    // Match all paths except Next.js internals and static files
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    ],
};
