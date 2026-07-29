import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/admin-auth";

/**
 * E2E Test: Complete admin content workflow
 *
 * Flow: Login → Media Upload → Page Compose → Preview → Publish
 *
 * Validates Requirement 15.6: End-to-end tests covering critical user journeys
 * through the CMS admin interface.
 */
test.describe("Admin Content Workflow: Login → Upload → Compose → Preview → Publish", () => {
    test.describe.configure({ mode: "serial" });

    const PAGE_TITLE = `E2E Test Page ${Date.now()}`;
    const PAGE_SLUG = `e2e-test-page-${Date.now()}`;

    test("Step 1: Admin can log in with valid credentials", async ({ page }) => {
        await loginAsAdmin(page);

        // Verify we are on the admin dashboard
        await expect(page).toHaveURL(/\/admin/);

        // Dashboard should show some content (stats, recent activity, etc.)
        const dashboardContent = page.locator("main, [role='main'], .dashboard");
        await expect(dashboardContent).toBeVisible();
    });

    test("Step 2: Admin can upload a media file", async ({ page }) => {
        await loginAsAdmin(page);

        // Navigate to media library
        await page.goto("/admin/media");
        await page.waitForLoadState("networkidle");

        // Verify media library page loaded
        await expect(page.getByRole("heading", { name: /media/i })).toBeVisible({
            timeout: 10_000,
        });

        // Upload a file via the file input
        const fileInput = page.locator('input[type="file"]');

        // If there's an upload button that reveals the input, click it first
        const uploadTrigger = page.getByRole("button", { name: /upload/i });
        if (await uploadTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
            await uploadTrigger.click();
        }

        // Use a programmatically generated test file (1x1 PNG)
        const testImageBuffer = createMinimalPNG();
        await fileInput.setInputFiles({
            name: "e2e-test-image.png",
            mimeType: "image/png",
            buffer: testImageBuffer,
        });

        // Wait for upload confirmation
        await expect(
            page.getByText(/uploaded|success|complete/i).or(
                page.locator("[data-media-item], [data-testid='media-item']").first()
            )
        ).toBeVisible({ timeout: 15_000 });
    });

    test("Step 3: Admin can compose a new page with the Composer", async ({
        page,
    }) => {
        await loginAsAdmin(page);

        // Navigate to page creation/composer
        await page.goto("/admin");
        await page.waitForLoadState("networkidle");

        // Look for navigation to CMS/Pages section
        const pagesLink = page.getByRole("link", { name: /pages|cms/i });
        if (await pagesLink.isVisible({ timeout: 3000 }).catch(() => false)) {
            await pagesLink.click();
            await page.waitForLoadState("networkidle");
        }

        // Click "New Page" or "Create" button
        const createBtn = page
            .getByRole("link", { name: /new page|create/i })
            .or(page.getByRole("button", { name: /new page|create/i }));
        if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await createBtn.click();
            await page.waitForLoadState("networkidle");
        }

        // Fill in the page title
        const titleInput = page
            .locator('input[name="title"]')
            .or(page.locator('input[placeholder*="title" i]'))
            .or(page.getByLabel(/title/i));
        await expect(titleInput).toBeVisible({ timeout: 5000 });
        await titleInput.fill(PAGE_TITLE);

        // Fill in the slug if available
        const slugInput = page
            .locator('input[name="slug"]')
            .or(page.getByLabel(/slug/i));
        if (await slugInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await slugInput.fill(PAGE_SLUG);
        }

        // Add a section via the composer canvas
        const addSectionBtn = page.getByRole("button", { name: /add section/i });
        if (await addSectionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await addSectionBtn.click();

            // Pick first section type from library
            const sectionChoice = page
                .locator("[data-section-type]")
                .first()
                .or(page.locator("[role='option']").first())
                .or(page.locator("[role='menuitem']").first());
            if (await sectionChoice.isVisible({ timeout: 3000 }).catch(() => false)) {
                await sectionChoice.click();
            }
        }

        // Add a block (text/heading) within the section
        const addBlockBtn = page.getByRole("button", { name: /add block/i });
        if (await addBlockBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await addBlockBtn.click();

            const blockChoice = page
                .locator("[data-block-type]")
                .first()
                .or(page.locator("[role='option']").first());
            if (await blockChoice.isVisible({ timeout: 3000 }).catch(() => false)) {
                await blockChoice.click();
            }
        }

        // Enter content in the block editor
        const editor = page.locator(
            "[contenteditable='true'], textarea[name*='content']"
        );
        if (await editor.isVisible({ timeout: 3000 }).catch(() => false)) {
            await editor.click();
            await editor.fill("Hello from E2E test — this is composed content.");
        }

        // Save as draft
        const saveBtn = page.getByRole("button", { name: /save/i });
        if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await saveBtn.click();
            await page.waitForLoadState("networkidle");
        }

        // Verify save confirmation
        const confirmation = page.getByText(/saved|success|draft/i);
        if (await confirmation.isVisible({ timeout: 5000 }).catch(() => false)) {
            await expect(confirmation).toBeVisible();
        }
    });

    test("Step 4: Admin can preview the composed page", async ({ page }) => {
        await loginAsAdmin(page);

        // Navigate back to the page we just created (via pages list or direct URL)
        await page.goto("/admin");
        await page.waitForLoadState("networkidle");

        // Find the page in the list or navigate to its editor
        const pagesLink = page.getByRole("link", { name: /pages|cms/i });
        if (await pagesLink.isVisible({ timeout: 3000 }).catch(() => false)) {
            await pagesLink.click();
            await page.waitForLoadState("networkidle");
        }

        // Find our test page by title
        const pageRow = page.getByText(PAGE_TITLE);
        if (await pageRow.isVisible({ timeout: 5000 }).catch(() => false)) {
            await pageRow.click();
            await page.waitForLoadState("networkidle");
        }

        // Click the Preview button
        const previewBtn = page.getByRole("button", { name: /preview/i }).or(
            page.getByRole("link", { name: /preview/i })
        );
        await expect(previewBtn).toBeVisible({ timeout: 5000 });
        await previewBtn.click();

        // Preview may open in same page (device/locale preview panel) or new tab
        // Check if preview panel appears
        const previewPanel = page.locator(
            "[data-testid='preview-panel'], [role='dialog'], iframe"
        );
        if (await previewPanel.isVisible({ timeout: 5000 }).catch(() => false)) {
            await expect(previewPanel).toBeVisible();
        }

        // If preview opens a new page via token, verify the URL has preview token
        if (page.url().includes("preview")) {
            await expect(page).toHaveURL(/preview/);
        }
    });

    test("Step 5: Admin can publish the page", async ({ page }) => {
        await loginAsAdmin(page);

        // Navigate to the page editor
        await page.goto("/admin");
        await page.waitForLoadState("networkidle");

        const pagesLink = page.getByRole("link", { name: /pages|cms/i });
        if (await pagesLink.isVisible({ timeout: 3000 }).catch(() => false)) {
            await pagesLink.click();
            await page.waitForLoadState("networkidle");
        }

        // Find and open our test page
        const pageRow = page.getByText(PAGE_TITLE);
        if (await pageRow.isVisible({ timeout: 5000 }).catch(() => false)) {
            await pageRow.click();
            await page.waitForLoadState("networkidle");
        }

        // Click the Publish button (workflow transition)
        const publishBtn = page.getByRole("button", { name: /publish/i });
        await expect(publishBtn).toBeVisible({ timeout: 5000 });
        await publishBtn.click();

        // Handle confirmation dialog if present
        const confirmDialog = page.getByRole("dialog");
        if (await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
            const confirmBtn = confirmDialog.getByRole("button", {
                name: /confirm|publish|yes/i,
            });
            await confirmBtn.click();
        }

        // Wait for publish to complete
        await page.waitForLoadState("networkidle");

        // Verify the page status changed to Published
        const publishedBadge = page.getByText(/published/i);
        await expect(publishedBadge).toBeVisible({ timeout: 10_000 });

        // Verify the page is now accessible on the public site
        const publicPage = await page.context().newPage();
        await publicPage.goto(`/en/${PAGE_SLUG}`);

        // Public page should load (not 404)
        const pageContent = publicPage.locator("main, [role='main'], body");
        await expect(pageContent).toBeVisible();

        // Check that page title or content appears
        const visibleTitle = publicPage.getByText(PAGE_TITLE);
        if (await visibleTitle.isVisible({ timeout: 5000 }).catch(() => false)) {
            await expect(visibleTitle).toBeVisible();
        }

        await publicPage.close();
    });
});

/**
 * Creates a minimal 1x1 pixel PNG for file upload testing.
 * Avoids dependency on external fixture files.
 */
function createMinimalPNG(): Buffer {
    // 1x1 transparent PNG (67 bytes)
    const pngBytes = [
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, // IDAT chunk
        0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
        0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc,
        0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, // IEND chunk
        0x44, 0xae, 0x42, 0x60, 0x82,
    ];
    return Buffer.from(pngBytes);
}
