import { test, expect } from "@playwright/test";
import { ALL_CASES as allCases, INPUT_MAP, buildFlags } from "../../constants";

for (const tc of allCases) {
	test(tc.name, async ({ page, request }) => {
		await page.goto("/");
		await page.waitForSelector("#test-only");

		// Build input string similar to Next.js test
		let inputStr = "";
		try {
			inputStr = JSON.stringify(tc.input);
		} catch {
			inputStr =
				INPUT_MAP[tc.name] ??
				JSON.stringify(tc.input, (_k, v) => {
					if (typeof v === "bigint") return `${String(v)}n`;
					if (typeof v === "symbol") return `Symbol("${String((v as symbol).description ?? "")}")`;
					return v as unknown;
				});
		}

		const flagsObj = buildFlags(tc.extensions);

		// Use the server-provided client helper which posts JSON to /runRaw and returns a JSON string
		await page.waitForFunction(
			() =>
				(window as unknown as { __runSerialized?: (...args: unknown[]) => unknown })
					.__runSerialized !== undefined,
		);
		const payload = JSON.stringify({ inputStr, name: tc.name, flags: flagsObj });
		const txt = await page.evaluate(async (payloadStr) => {
			const p = JSON.parse(payloadStr as string);
			// call the helper registered by the server page
			// it returns a JSON string
			// @ts-ignore
			return await (
				window as unknown as { __runSerialized?: (...args: unknown[]) => Promise<unknown> }
			).__runSerialized?.(p.inputStr, p.name, p.flags);
		}, payload);

		const parsed = JSON.parse(String(txt ?? "null"));
		expect(parsed).not.toBeNull();
		expect(parsed.ok).toBe(true);
	});
}
