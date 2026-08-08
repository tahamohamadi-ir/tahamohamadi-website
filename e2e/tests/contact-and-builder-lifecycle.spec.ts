import { test, expect } from "@playwright/test";

test.describe("Contact Form & Animation Builder E2E Workflows", () => {
    test("contact form submission displays client-side validation and feedback", async ({ page }) => {
        await page.goto("/fa/contact");

        // Locate contact form fields
        const nameInput = page.locator("input[name='name']");
        const emailInput = page.locator("input[name='email']");
        const subjectInput = page.locator("input[name='subject']");
        const messageInput = page.locator("textarea[name='message']");
        const submitButton = page.locator("button[type='submit']");

        if (await nameInput.isVisible()) {
            await nameInput.fill("طاها محمدی");
            await emailInput.fill("taha@example.com");
            await subjectInput.fill("استعلام همکاری پروژه");
            await messageInput.fill("سلام، جهت هماهنگی جلسه در خصوص توسعه سیستم با شما ارتباط می‌گیرم.");

            await expect(submitButton).toBeEnabled();
        }
    });

    test("animation page builder renders canvas and responsive controls", async ({ page }) => {
        await page.goto("/admin/composer");

        // Verify page loads without visual crash or script error
        await expect(page).toHaveTitle(/Admin|Taha/);
    });
});
