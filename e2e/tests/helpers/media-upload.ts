import { type Page, expect } from "@playwright/test";
import path from "path";

/**
 * Media upload helper.
 * Navigates to the media library and uploads a test file.
 */
export async function uploadMediaFile(
    page: Page,
    options: {
        filePath?: string;
        altText?: string;
    } = {}
) {
    const {
        filePath = path.resolve(__dirname, "../fixtures/test-image.png"),
        altText = "E2E Test Image",
    } = options;

    // Navigate to media library
    await page.goto("/admin/media");
    await page.waitForLoadState("networkidle");

    // Click the upload button/area
    const uploadButton = page.getByRole("button", { name: /upload/i });
    await expect(uploadButton).toBeVisible();
    await uploadButton.click();

    // Handle file input (may be hidden, use setInputFiles)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // Wait for upload to complete (look for success indicator or the new media item)
    await expect(
        page.getByText(/uploaded|success/i).or(page.locator("[data-media-item]").first())
    ).toBeVisible({ timeout: 15_000 });

    // If alt text field is available, fill it
    const altInput = page.locator(
        'input[name="alt_text"], input[aria-label*="alt"], input[placeholder*="alt"]'
    );
    if (await altInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await altInput.fill(altText);
        // Save metadata if there's a save button nearby
        const saveBtn = page.getByRole("button", { name: /save|update/i });
        if (await saveBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
            await saveBtn.click();
        }
    }
}
