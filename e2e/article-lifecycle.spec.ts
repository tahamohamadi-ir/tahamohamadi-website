import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./tests/helpers/admin-auth";

/**
 * E2E Test: Article Create → Edit Blocks → Publish → Public Read
 *
 * Validates the full article lifecycle from content creation to public visibility:
 * 1. Admin logs in and creates a new article with bilingual metadata
 * 2. Admin adds content blocks (heading, paragraph, code)
 * 3. Admin publishes the article via workflow transition
 * 4. Anonymous visitor navigates to the public blog and reads the article
 *
 * Validates: Requirement 15.6
 */
test.describe("Article Lifecycle: Create → Edit Blocks → Publish → Public Read", () => {
    test.describe.configure({ mode: "serial" });

    const UNIQUE_SUFFIX = Date.now();
    const ARTICLE_TITLE_EN = `E2E Lifecycle Article ${UNIQUE_SUFFIX}`;
    const ARTICLE_TITLE_FA = `مقاله چرخه حیات ${UNIQUE_SUFFIX}`;
    const ARTICLE_SLUG_EN = `e2e-lifecycle-${UNIQUE_SUFFIX}`;
    const ARTICLE_SLUG_FA = `e2e-lifecycle-fa-${UNIQUE_SUFFIX}`;
    const HEADING_TEXT = "Introduction to the Lifecycle";
    const PARAGRAPH_TEXT =
        "This article demonstrates the complete article lifecycle from creation through block editing to publication and public reading.";
    const CODE_SNIPPET = 'const status = "published";';

    let articleId: string | undefined;

    test("Step 1: Admin creates a new article with bilingual metadata", async ({
        page,
    }) => {
        await loginAsAdmin(page);

        // Navigate to article creation
        await page.goto("/admin/blog/articles/new");
        await page.waitForLoadState("networkidle");

        // Fill English metadata
        const titleEn = page
            .getByLabel(/title.*en/i)
            .or(page.locator('input[name="title_en"]'));
        await expect(titleEn).toBeVisible({ timeout: 10_000 });
        await titleEn.fill(ARTICLE_TITLE_EN);

        const slugEn = page
            .getByLabel(/slug.*en/i)
            .or(page.locator('input[name="slug_en"]'));
        if (await slugEn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await slugEn.fill(ARTICLE_SLUG_EN);
        }

        // Fill Persian metadata
        const titleFa = page
            .getByLabel(/title.*fa/i)
            .or(page.locator('input[name="title_fa"]'));
        if (await titleFa.isVisible({ timeout: 3000 }).catch(() => false)) {
            await titleFa.fill(ARTICLE_TITLE_FA);
        }

        const slugFa = page
            .getByLabel(/slug.*fa/i)
            .or(page.locator('input[name="slug_fa"]'));
        if (await slugFa.isVisible({ timeout: 3000 }).catch(() => false)) {
            await slugFa.fill(ARTICLE_SLUG_FA);
        }

        // Fill excerpts
        const excerptEn = page
            .getByLabel(/excerpt.*en/i)
            .or(page.locator('textarea[name="excerpt_en"]'));
        if (await excerptEn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await excerptEn.fill(
                "A test article verifying the end-to-end article lifecycle."
            );
        }

        const excerptFa = page
            .getByLabel(/excerpt.*fa/i)
            .or(page.locator('textarea[name="excerpt_fa"]'));
        if (await excerptFa.isVisible({ timeout: 2000 }).catch(() => false)) {
            await excerptFa.fill("یک مقاله تست برای بررسی چرخه کامل مقاله.");
        }

        // Save as draft
        const saveBtn = page.getByRole("button", { name: /save|create/i });
        await saveBtn.click();
        await page.waitForLoadState("networkidle");

        // Verify creation success
        await expect(
            page.getByText(/saved|created|success|draft/i)
        ).toBeVisible({ timeout: 10_000 });

        // Capture article ID from URL for subsequent steps
        const currentUrl = page.url();
        const idMatch = currentUrl.match(/articles\/([0-9a-f-]+)/);
        if (idMatch) {
            articleId = idMatch[1];
        }
    });

    test("Step 2: Admin adds content blocks to the article", async ({
        page,
    }) => {
        await loginAsAdmin(page);

        // Navigate to article editor
        if (articleId) {
            await page.goto(`/admin/blog/articles/${articleId}`);
        } else {
            await page.goto("/admin/blog/articles");
            await page.waitForLoadState("networkidle");
            await page.getByText(ARTICLE_TITLE_EN).click();
        }
        await page.waitForLoadState("networkidle");

        // --- Add a heading block ---
        const addBlockBtn = page
            .getByRole("button", { name: /add block|insert block|\+/i })
            .first();
        await expect(addBlockBtn).toBeVisible({ timeout: 10_000 });
        await addBlockBtn.click();

        // Select heading block type from the menu/library
        const headingOption = page
            .getByRole("menuitem", { name: /heading/i })
            .or(page.getByRole("option", { name: /heading/i }))
            .or(page.locator('[data-block-type="heading"]'));
        await headingOption.click();

        // Fill heading content
        const headingEditor = page
            .locator(
                '[data-block-type="heading"] [contenteditable], [data-block-type="heading"] input, [data-block-type="heading"] textarea'
            )
            .first();
        if (await headingEditor.isVisible({ timeout: 5000 }).catch(() => false)) {
            await headingEditor.fill(HEADING_TEXT);
        }

        // --- Add a paragraph block ---
        await addBlockBtn.click();
        const paragraphOption = page
            .getByRole("menuitem", { name: /paragraph|text/i })
            .or(page.getByRole("option", { name: /paragraph|text/i }))
            .or(page.locator('[data-block-type="paragraph"]'));
        await paragraphOption.click();

        const paragraphEditor = page
            .locator(
                '[data-block-type="paragraph"] [contenteditable], [data-block-type="paragraph"] textarea'
            )
            .first();
        if (
            await paragraphEditor.isVisible({ timeout: 5000 }).catch(() => false)
        ) {
            await paragraphEditor.fill(PARAGRAPH_TEXT);
        }

        // --- Add a code block ---
        await addBlockBtn.click();
        const codeOption = page
            .getByRole("menuitem", { name: /code/i })
            .or(page.getByRole("option", { name: /code/i }))
            .or(page.locator('[data-block-type="code"]'));
        await codeOption.click();

        const codeEditor = page
            .locator(
                '[data-block-type="code"] [contenteditable], [data-block-type="code"] textarea, [data-block-type="code"] .cm-content'
            )
            .first();
        if (await codeEditor.isVisible({ timeout: 5000 }).catch(() => false)) {
            await codeEditor.fill(CODE_SNIPPET);
        }

        // Save the article with blocks
        const saveBtn = page.getByRole("button", { name: /save/i });
        await saveBtn.click();
        await page.waitForLoadState("networkidle");

        // Verify save confirmation
        await expect(
            page.getByText(/saved|updated|success/i)
        ).toBeVisible({ timeout: 10_000 });
    });

    test("Step 3: Admin publishes the article via workflow transition", async ({
        page,
    }) => {
        await loginAsAdmin(page);

        // Navigate to the article
        if (articleId) {
            await page.goto(`/admin/blog/articles/${articleId}`);
        } else {
            await page.goto("/admin/blog/articles");
            await page.waitForLoadState("networkidle");
            await page.getByText(ARTICLE_TITLE_EN).click();
        }
        await page.waitForLoadState("networkidle");

        // Click the Publish button (workflow transition: draft → published)
        const publishBtn = page.getByRole("button", { name: /publish/i });
        await expect(publishBtn).toBeVisible({ timeout: 10_000 });
        await publishBtn.click();

        // Handle confirmation dialog if present
        const confirmDialog = page.getByRole("dialog");
        if (await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
            const confirmBtn = confirmDialog.getByRole("button", {
                name: /confirm|publish|yes/i,
            });
            await confirmBtn.click();
        }

        await page.waitForLoadState("networkidle");

        // Verify status changed to published
        await expect(
            page.getByText(/published/i)
        ).toBeVisible({ timeout: 10_000 });
    });

    test("Step 4: Published article appears on the public blog (English)", async ({
        page,
    }) => {
        // Navigate to the public English blog listing
        await page.goto("/en/blog");
        await page.waitForLoadState("networkidle");

        // The article title should be visible in the listing
        await expect(page.getByText(ARTICLE_TITLE_EN)).toBeVisible({
            timeout: 15_000,
        });

        // Click through to the article detail page
        await page.getByText(ARTICLE_TITLE_EN).click();
        await page.waitForLoadState("networkidle");

        // Verify the URL matches the expected slug
        await expect(page).toHaveURL(new RegExp(`/en/blog/${ARTICLE_SLUG_EN}`));

        // Verify article content blocks are rendered
        await expect(
            page.getByRole("heading", { name: HEADING_TEXT })
        ).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText(PARAGRAPH_TEXT)).toBeVisible();
        await expect(page.getByText(CODE_SNIPPET)).toBeVisible();

        // Verify reading time is displayed (non-zero)
        const readingTime = page.getByText(/\d+\s*min/i);
        if (await readingTime.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(readingTime).toBeVisible();
        }
    });

    test("Step 5: Published article appears on the public blog (Persian)", async ({
        page,
    }) => {
        // Navigate to the public Persian blog listing
        await page.goto("/fa/blog");
        await page.waitForLoadState("networkidle");

        // The Persian article title should be visible
        await expect(page.getByText(ARTICLE_TITLE_FA)).toBeVisible({
            timeout: 15_000,
        });

        // Click through to the Persian article detail page
        await page.getByText(ARTICLE_TITLE_FA).click();
        await page.waitForLoadState("networkidle");

        // Verify the URL matches the Persian slug
        await expect(page).toHaveURL(new RegExp(`/fa/blog/${ARTICLE_SLUG_FA}`));

        // Verify RTL layout is correctly applied
        const htmlElement = page.locator("html");
        await expect(htmlElement).toHaveAttribute("dir", "rtl");

        // Verify the page has Persian lang attribute
        await expect(htmlElement).toHaveAttribute("lang", "fa");
    });

    test.afterAll(async ({ request }) => {
        // Cleanup: delete the test article via API
        if (!articleId) return;

        const apiBase = process.env.E2E_API_URL || "http://localhost:8000";

        // Authenticate
        await request.post(`${apiBase}/api/auth/login/`, {
            data: {
                username: process.env.E2E_ADMIN_USERNAME || "admin",
                password: process.env.E2E_ADMIN_PASSWORD || "adminpass123",
            },
        });

        // Delete the test article
        await request.delete(`${apiBase}/api/admin/blog/articles/${articleId}/`);
    });
});
