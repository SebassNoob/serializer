import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for form-data-serializer integration tests
 */
export default defineConfig({
	// tests live in the next.js app src directory (relative to this config file)
	testDir: "./src",
	timeout: 30 * 1000,
	expect: {
		timeout: 5000,
	},
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "list",
	use: {
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
	},

	// Start the Next dev server for the integration app before tests
	webServer: {
		command: "bun dev",
		cwd: "./next.js",
		url: "http://localhost:3000",
		timeout: 120_000,
		reuseExistingServer: !process.env.CI,
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},

		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] },
		},

		{
			name: "webkit",
			use: { ...devices["Desktop Safari"] },
		},
	],
});
