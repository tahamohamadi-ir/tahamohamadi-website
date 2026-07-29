import { type Page, expect } from "@playwright/test";

/**
 * Admin authentication helper.
 * Logs in via the admin login page using session-based auth.
 */
export async function loginAsAdmin(
    page: Page,
    credentials = {
        username: process.env.E2E_ADMIN_USERNAME || "admin",
        password: process.env.E2E_ADMIN_PASSWORD || "adminpass123",
    }
) {
    await page.goto("/admin/login");
    await page.waitForSelector('input[name="username"]');

    await page.fill('input[name="username"]', credentials.username);
    await page.fill('input[name="password"]', credentials.password);
    await page.click('button[type="submit"]');

    // Wait for redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin(?!\/login)/);
}
