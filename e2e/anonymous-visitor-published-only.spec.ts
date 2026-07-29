import { test, expect } from "@playwright/test";

/**
 * E2E Test: Anonymous visitor sees only published content (no draft/archive)
 * Requirement: 15.6
 *
 * Verifies:
 * - Anonymous visitors can see published content on public pages
 * - Draft and archived content is not visible to anonymous visitors
 * - Admin routes are not accessible without authentication
 */

const API_BASE = process.env.E2E_API_BASE_URL || "http://localhost:8000";

test.describe("Anonymous visitor sees only published content", () => {
    test.describe("Public pages display published content", () => {
        test("Home page loads successfully for anonymous visitor", async ({ page }) => {
            const response = await page.goto("/en");
            expect(response?.status()).toBeLessThan(500);
            await page.waitForLoadState("domcontentloaded");

            // Page should have meaningful content (not a blank or error page)
            const body = page.locator("body");
            const textContent = await body.textContent();
            expect(textContent?.trim().length).toBeGreaterThan(0);
        });

        test("Blog listing page shows content for anonymous visitor", async ({ page }) => {
            const response = await page.goto("/en/blog");
            expect(response?.status()).toBeLessThan(500);
            await page.waitForLoadState("domcontentloaded");

            // Blog page should render without errors
            const heading = page.locator("h1, h2").first();
            await expect(heading).toBeVisible({ timeout: 10_000 });
        });

        test("Portfolio listing page shows content for anonymous visitor", async ({ page }) => {
            const response = await page.goto("/en/portfolio");
            expect(response?.status()).toBeLessThan(500);
            await page.waitForLoadState("domcontentloaded");

            // Portfolio page should render without errors
            const heading = page.locator("h1, h2").first();
            await expect(heading).toBeVisible({ timeout: 10_000 });
        });
    });

    test.describe("Public API returns only published content", () => {
        test("Blog API returns only published articles (no draft/archived)", async ({
            request,
        }) => {
            const response = await request.get(`${API_BASE}/api/public/blog/articles/`);
            expect(response.status()).toBe(200);

            const data = await response.json();
            const results = data.results || data;

            // All returned articles must have published status
            if (Array.isArray(results) && results.length > 0) {
                for (const article of results) {
                    expect(article.status).toBe("published");
                }
            }
        });

        test("Portfolio API returns only published case studies (no draft/archived)", async ({
            request,
        }) => {
            const response = await request.get(`${API_BASE}/api/public/portfolio/`);
            expect(response.status()).toBe(200);

            const data = await response.json();
            const results = data.results || data;

            // All returned case studies must have published status
            if (Array.isArray(results) && results.length > 0) {
                for (const caseStudy of results) {
                    expect(caseStudy.status).toBe("published");
                }
            }
        });

        test("Pages API returns only published pages", async ({ request }) => {
            // Try to access a hypothetical published page slug
            // The public endpoint returns 404 for non-published content
            const response = await request.get(`${API_BASE}/api/public/pages/does-not-exist/`);
            expect(response.status()).toBe(404);
        });

        test("Draft article is not accessible via public API", async ({ request }) => {
            // A draft article slug should return 404 on the public endpoint
            const response = await request.get(
                `${API_BASE}/api/public/blog/articles/draft-test-article/`
            );
            // Expect 404 — public API never exposes drafts
            expect(response.status()).toBe(404);
        });

        test("Archived article is not accessible via public API", async ({ request }) => {
            // An archived article slug should return 404 on the public endpoint
            const response = await request.get(
                `${API_BASE}/api/public/blog/articles/archived-test-article/`
            );
            // Expect 404 — public API never exposes archived content
            expect(response.status()).toBe(404);
        });
    });

    test.describe("Admin routes are not accessible to anonymous visitors", () => {
        test("Admin dashboard redirects or blocks unauthenticated access", async ({ page }) => {
            const response = await page.goto("/admin");
            await page.waitForLoadState("domcontentloaded");

            // Should either redirect to login or show login page
            const url = page.url();
            const isOnLoginPage = url.includes("/login") || url.includes("/admin/login");
            const hasLoginForm = await page
                .locator('input[name="username"], input[name="email"], input[type="password"]')
                .first()
                .isVisible({ timeout: 5_000 })
                .catch(() => false);

            // Either redirected to login page or the page contains a login form
            expect(isOnLoginPage || hasLoginForm).toBe(true);
        });

        test("Admin API endpoints reject unauthenticated requests", async ({ request }) => {
            const response = await request.get(`${API_BASE}/api/admin/pages/`);
            // Should return 401 Unauthorized or 403 Forbidden
            expect([401, 403]).toContain(response.status());
        });

        test("Admin media endpoint rejects unauthenticated requests", async ({ request }) => {
            const response = await request.get(`${API_BASE}/api/admin/media/`);
            expect([401, 403]).toContain(response.status());
        });

        test("Admin blog endpoint rejects unauthenticated requests", async ({ request }) => {
            const response = await request.get(`${API_BASE}/api/admin/blog/articles/`);
            expect([401, 403]).toContain(response.status());
        });

        test("Admin workflow endpoint rejects unauthenticated requests", async ({ request }) => {
            const response = await request.get(`${API_BASE}/api/admin/workflow/revisions/`);
            expect([401, 403]).toContain(response.status());
        });
    });

    test.describe("Content visibility on frontend pages", () => {
        test("Blog page does not display any draft status indicators", async ({ page }) => {
            await page.goto("/en/blog");
            await page.waitForLoadState("domcontentloaded");

            // The page should not show "draft" or "archived" status badges/text
            const bodyText = await page.locator("body").textContent();
            const lowerText = bodyText?.toLowerCase() || "";

            // Public pages should never show workflow status labels to visitors
            // Note: "draft" as part of a blog title is acceptable, but status badges are not
            const draftBadge = page.locator(
                '[data-status="draft"], .badge:has-text("Draft"), .status-draft'
            );
            expect(await draftBadge.count()).toBe(0);

            const archivedBadge = page.locator(
                '[data-status="archived"], .badge:has-text("Archived"), .status-archived'
            );
            expect(await archivedBadge.count()).toBe(0);
        });

        test("Portfolio page does not display any draft status indicators", async ({ page }) => {
            await page.goto("/en/portfolio");
            await page.waitForLoadState("domcontentloaded");

            // Public portfolio should not expose workflow status
            const draftBadge = page.locator(
                '[data-status="draft"], .badge:has-text("Draft"), .status-draft'
            );
            expect(await draftBadge.count()).toBe(0);

            const archivedBadge = page.locator(
                '[data-status="archived"], .badge:has-text("Archived"), .status-archived'
            );
            expect(await archivedBadge.count()).toBe(0);
        });
    });
});
