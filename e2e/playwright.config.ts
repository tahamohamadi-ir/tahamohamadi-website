import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for TahaMohamadi.ir E2E tests.
 * Assumes both Django backend (port 8000) and Next.js frontend (port 3000) are running.
 */
export default defineConfig({
    testDir: ".",
    testMatch: "**/*.spec.ts",
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: "html",
    timeout: 60_000,

    use: {
        baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        video: "on-first-retry",
    },

    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],

    /* Optionally start servers before tests (uncomment when needed):
    webServer: [
      {
        command: "cd ../backend && python manage.py runserver 0.0.0.0:8000",
        port: 8000,
        reuseExistingServer: true,
      },
      {
        command: "cd ../frontend && npm run dev",
        port: 3000,
        reuseExistingServer: true,
      },
    ],
    */
});
