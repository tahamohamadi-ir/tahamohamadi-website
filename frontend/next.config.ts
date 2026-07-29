import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 80, 90],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "django",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "tahamohamadi.ir",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "www.tahamohamadi.ir",
        pathname: "/media/**",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/nextjs

  // Only upload source maps in CI (requires SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT)
  silent: !process.env.CI,

  // Automatically tree-shake the SDK so it's not included in bundles when disabled
  disableLogger: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
  tunnelRoute: "/monitoring",

  // Configure source maps upload
  sourcemaps: {
    disable: !process.env.CI,
  },
});

// Code Splitting Verification (Requirement 13.3)
//
// This project uses Next.js 15 App Router which provides automatic per-route
// code splitting. The architecture ensures admin bundles never ship to public pages:
//
// 1. Route Separation:
//    - Public pages: app/[locale]/ - React Server Components (no "use client")
//    - Admin pages:  app/admin/   - Client Components ("use client" directives)
//
// 2. Admin-Only Dependencies (isolated to src/components/admin/):
//    - @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (Composer)
//    - @tiptap/react, @tiptap/starter-kit, @tiptap/extension-placeholder (Editor)
//    These are only imported by files under src/components/admin/ which are only
//    referenced by app/admin/ routes.
//
// 3. Per-Route Chunks (verified via .next/app-build-manifest.json):
//    - Each route gets its own chunk (e.g., app/[locale]/blog/page-*.js)
//    - Admin route chunks (app/admin/*/page-*.js) are completely separate
//    - No admin chunk IDs appear in public page entries
//
// 4. No Cross-Contamination:
//    - No file under app/[locale]/ or src/components/layout/ imports from
//      src/components/admin/
//    - Shared UI primitives (src/components/ui/) contain no admin logic
//    - Public pages use zero "use client" directives (fully SSR)
//
// Last verified: 2025-07-15
