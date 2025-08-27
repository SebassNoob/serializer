import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./src",
	timeout: 30 * 1000,
	expect: { timeout: 5000 },
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "list",
	use: { baseURL: "http://localhost:3001", trace: "on-first-retry" },
	webServer: {
		command: "bun dev",
		cwd: ".",
		url: "http://localhost:3001",
		timeout: 120_000,
		reuseExistingServer: !process.env.CI,
	},
	projects: [
		{ name: "chromium", use: { ...devices["Desktop Chrome"] } },
		{ name: "firefox", use: { ...devices["Desktop Firefox"] } },
		{ name: "webkit", use: { ...devices["Desktop Safari"] } },
	],
});
