import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/i18n";

/**
 * Generate robots.txt for TahaMohamadi.ir.
 * Allows crawling of all public content while excluding:
 * - /admin/* (CMS admin panel)
 * - /api/* (API endpoints)
 * - URLs containing /preview/ (preview tokens)
 * - URLs containing /draft/ (draft content)
 * - URLs containing /archive/ (archived content)
 *
 * Requirements: 10.7
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/admin/",
                    "/admin",
                    "/api/",
                    "/preview/",
                    "/draft/",
                    "/archive/",
                ],
            },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}
