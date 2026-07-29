import { test, expect } from "@playwright/test";

/**
 * E2E Test: Locale switching on all public pages
 * Requirement: 15.6
 *
 * Verifies:
 * - Navigating between Persian (/fa) and English (/en) locales on all public pages
 * - dir="rtl" on HTML element for /fa, dir="ltr" for /en
 * - lang attribute matches the current locale
 * - No cross-locale fallback content (Persian text doesn't appear on English pages and vice versa)
 */

const PUBLIC_PAGES = [
    "", // Home page
    "/about",
    "/blog",
    "/contact",
    "/portfolio",
    "/publications",
    "/research",
    "/resume",
];

// Persian/Arabic Unicode character ranges to detect cross-locale fallback
const PERSIAN_CHAR_REGEX =
    /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

test.describe("Locale switching on all public pages", () => {
    for (const pagePath of PUBLIC_PAGES) {
        const pageName = pagePath || "/";

        test.describe(`Page: ${pageName}`, () => {
            test(`Persian locale (/fa${pagePath}) has dir="rtl" and lang="fa"`, async ({
                page,
            }) => {
                await page.goto(`/fa${pagePath}`);
                await page.waitForLoadState("domcontentloaded");

                const html = page.locator("html");
                await expect(html).toHaveAttribute("dir", "rtl");
                await expect(html).toHaveAttribute("lang", "fa");
            });

            test(`English locale (/en${pagePath}) has dir="ltr" and lang="en"`, async ({
                page,
            }) => {
                await page.goto(`/en${pagePath}`);
                await page.waitForLoadState("domcontentloaded");

                const html = page.locator("html");
                await expect(html).toHaveAttribute("dir", "ltr");
                await expect(html).toHaveAttribute("lang", "en");
            });

            test(`English page (/en${pagePath}) has no Persian fallback content in main area`, async ({
                page,
            }) => {
                await page.goto(`/en${pagePath}`);
                await page.waitForLoadState("domcontentloaded");

                // Check main content area for cross-locale fallback
                const mainContent = page.locator("main");
                const mainExists = (await mainContent.count()) > 0;

                if (mainExists) {
                    const textContent = await mainContent.textContent();
                    if (textContent && textContent.trim().length > 0) {
                        // English pages must not contain Persian characters in main content
                        expect(
                            PERSIAN_CHAR_REGEX.test(textContent),
                            `English page /en${pagePath} contains Persian characters — cross-locale fallback detected`
                        ).toBe(false);
                    }
                }
            });

            test(`Persian page (/fa${pagePath}) contains Persian content`, async ({
                page,
            }) => {
                await page.goto(`/fa${pagePath}`);
                await page.waitForLoadState("domcontentloaded");

                // Persian pages must contain Persian characters
                const body = page.locator("body");
                const textContent = await body.textContent();

                if (textContent && textContent.trim().length > 0) {
                    expect(
                        PERSIAN_CHAR_REGEX.test(textContent),
                        `Persian page /fa${pagePath} has no Persian characters — locale content missing`
                    ).toBe(true);
                }
            });

            test(`Switching from /fa${pagePath} to /en${pagePath} updates dir and lang`, async ({
                page,
            }) => {
                // Start on Persian page
                await page.goto(`/fa${pagePath}`);
                await page.waitForLoadState("domcontentloaded");

                const html = page.locator("html");
                await expect(html).toHaveAttribute("dir", "rtl");
                await expect(html).toHaveAttribute("lang", "fa");

                // Navigate to English version
                await page.goto(`/en${pagePath}`);
                await page.waitForLoadState("domcontentloaded");

                await expect(html).toHaveAttribute("dir", "ltr");
                await expect(html).toHaveAttribute("lang", "en");
            });

            test(`Switching from /en${pagePath} to /fa${pagePath} updates dir and lang`, async ({
                page,
            }) => {
                // Start on English page
                await page.goto(`/en${pagePath}`);
                await page.waitForLoadState("domcontentloaded");

                const html = page.locator("html");
                await expect(html).toHaveAttribute("dir", "ltr");
                await expect(html).toHaveAttribute("lang", "en");

                // Navigate to Persian version
                await page.goto(`/fa${pagePath}`);
                await page.waitForLoadState("domcontentloaded");

                await expect(html).toHaveAttribute("dir", "rtl");
                await expect(html).toHaveAttribute("lang", "fa");
            });
        });
    }
});
