import { type Page, expect } from "@playwright/test";

/**
 * Page Composer helper.
 * Creates/composes a CMS page with sections and blocks.
 */
export async function composeNewPage(
    page: Page,
    options: {
        title?: string;
        slug?: string;
        locale?: string;
    } = {}
) {
    const {
        title = "E2E Test Page",
        slug = "e2e-test-page",
        locale = "en",
    } = options;

    // Navigate to CMS pages (admin dashboard or pages list)
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Click "New Page" or "Create Page" button
    const createPageBtn = page.getByRole("link", { name: /new page|create page/i })
        .or(page.getByRole("button", { name: /new page|create page/i }));
    await expect(createPageBtn).toBeVisible({ timeout: 5000 });
    await createPageBtn.click();

    // Fill in page metadata (title, slug)
    const titleInput = page.locator(
        'input[name="title"], input[aria-label*="title"], input[placeholder*="title"]'
    );
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill(title);

    const slugInput = page.locator(
        'input[name="slug"], input[aria-label*="slug"], input[placeholder*="slug"]'
    );
    if (await slugInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await slugInput.fill(slug);
    }

    // Add a section to the composer canvas
    const addSectionBtn = page.getByRole("button", { name: /add section/i });
    if (await addSectionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addSectionBtn.click();

        // Select a section type from the library (first available)
        const sectionOption = page
            .locator("[data-section-type], [role='option']")
            .first();
        if (await sectionOption.isVisible({ timeout: 2000 }).catch(() => false)) {
            await sectionOption.click();
        }
    }

    // Add a block within the section
    const addBlockBtn = page.getByRole("button", { name: /add block/i });
    if (await addBlockBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addBlockBtn.click();

        // Select a block type (e.g., text or heading)
        const blockOption = page
            .locator("[data-block-type='text'], [data-block-type='heading']")
            .first()
            .or(page.locator("[role='option']").first());
        if (await blockOption.isVisible({ timeout: 2000 }).catch(() => false)) {
            await blockOption.click();
        }
    }

    // Fill in some block content if a text editor appears
    const blockEditor = page.locator(
        "[contenteditable='true'], textarea[name*='content']"
    );
    if (await blockEditor.isVisible({ timeout: 3000 }).catch(() => false)) {
        await blockEditor.fill(`This is test content for ${title}`);
    }

    // Save the page as draft
    const saveBtn = page.getByRole("button", { name: /save|save draft/i });
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForLoadState("networkidle");
    }
}
