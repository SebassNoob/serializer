import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
	await page.goto("/");
	await page.waitForSelector('#input-test-name');
	await page.waitForSelector('#input-json');
	await page.waitForSelector('#result');
});

test("basic-string test case runs and returns ok", async ({ page }) => {
 	await page.fill('#input-test-name', 'basic-string');
 	await expect(page.locator('#input-test-name')).toHaveValue('basic-string');
 	await page.fill('#input-json', '{ "value": "hello world" }');
 	await page.click('button:has-text("Run serializer server action")');
 	await page.waitForFunction(() => document.querySelector('#result')?.textContent !== 'No output yet');
 	await expect(page.locator('#result')).toContainText('"ok": true');
});

test("ext-symbol test case runs and returns ok", async ({ page }) => {
 	// enable symbol extension checkbox
	await page.click('#flag-symbol');
 	await page.fill('#input-test-name', 'ext-symbol');
 	await expect(page.locator('#input-test-name')).toHaveValue('ext-symbol');
 	// input uses JS literal, so rely on eval fallback
 	await page.fill('#input-json', '{ key: Symbol("unique-identifier") }');
	await page.click('#run-btn');
 	await page.waitForFunction(() => document.querySelector('#result')?.textContent !== 'No output yet');
 	await expect(page.locator('#result')).toContainText('"ok": true');
});

test("file-single test case runs and returns ok", async ({ page }) => {
 	await page.fill('#input-test-name', 'file-single');
 	await expect(page.locator('#input-test-name')).toHaveValue('file-single');
 	await page.fill('#input-json', '{ "value": new File(["file bytes"], "notes.txt", { type: "text/plain" }) }');
	await page.click('#run-btn');
 	await page.waitForFunction(() => document.querySelector('#result')?.textContent !== 'No output yet');
 	await expect(page.locator('#result')).toContainText('"ok": true');
});
