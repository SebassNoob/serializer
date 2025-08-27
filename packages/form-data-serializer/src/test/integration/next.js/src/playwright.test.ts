import { test, expect } from "@playwright/test";

// Inline testcases (kept minimal and explicit for integration tests)
const allCases = [
	{ name: "basic-string", input: { value: "hello world" }, extensions: [] },
	{ name: "basic-number", input: { value: 42 }, extensions: [] },
	{ name: "basic-boolean", input: { t: true, f: false }, extensions: [] },
	{ name: "basic-null", input: { value: null }, extensions: [] },
	{ name: "basic-array", input: { value: ["a", 1, true, null] }, extensions: [] },
	{
		name: "basic-nested-object",
		input: { user: { id: 1, profile: { name: "Bob" } }, tags: ["x", "y"] },
		extensions: [],
	},
	{ name: "basic-undefined-property", input: { name: "Eve", maybe: undefined }, extensions: [] },

	{
		name: "blob-single",
		input: { value: new Blob(["plain text"], { type: "text/plain" }) },
		extensions: [],
	},
	{
		name: "blob-in-object",
		input: { title: "pic", data: new Blob(["imgdata"], { type: "application/octet-stream" }) },
		extensions: [],
	},
	{
		name: "blobs-in-array",
		input: { value: [new Blob(["one"]), new Blob(["two"])] },
		extensions: [],
	},
	{
		name: "file-single",
		input: { value: new File(["file bytes"], "notes.txt", { type: "text/plain" }) },
		extensions: [],
	},
	{
		name: "file-and-blob-mixed",
		input: {
			value: [
				new File(["F"], "f.txt", { type: "text/plain" }),
				new Blob(["B"], { type: "text/plain" }),
			],
		},
		extensions: [],
	},
	{
		name: "nested-blob",
		input: { a: { b: { c: new Blob(["deep"], { type: "text/plain" }) } } },
		extensions: [],
	},

	{
		name: "ext-date",
		input: { value: new Date("2023-05-01T12:00:00.000Z") },
		extensions: [{ name: "date" }],
	},
	{ name: "ext-bigint", input: { value: 9007199254740993n }, extensions: [{ name: "bigint" }] },
	{
		name: "ext-error",
		input: {
			err: (() => {
				const e = new Error("boom");
				e.name = "CustomError";
				return e;
			})(),
		},
		extensions: [{ name: "error" }],
	},
	{
		name: "ext-symbol",
		input: { key: Symbol("unique-identifier") },
		extensions: [{ name: "symbol" }],
	},
	{
		name: "ext-combined",
		input: {
			plain: "text",
			when: new Date("2024-01-01T00:00:00.000Z"),
			id: 12345678901234567890n,
			file: new File(["payload"], "p.bin", { type: "application/octet-stream" }),
			err: (() => {
				const e = new Error("boom");
				e.name = "CustomError";
				return e;
			})(),
			sym: Symbol("id"),
		},
		extensions: [{ name: "date" }, { name: "bigint" }, { name: "error" }, { name: "symbol" }],
	},
];

for (const tc of allCases) {
	test(tc.name, async ({ page }) => {
		// no-op: tests use programmatic helper only
		await page.goto("/");
		await page.waitForSelector("#test-only");

		// build input string (JSON or JS-literal fallback)
		let inputStr = "";
		try {
			inputStr = JSON.stringify(tc.input);
		} catch {
			const map: Record<string, string> = {
				"blob-single": '{ "value": new Blob(["plain text"], { type: "text/plain" }) }',
				"blob-in-object":
					'{ "title": "pic", "data": new Blob(["imgdata"], { type: "application/octet-stream" }) }',
				"blobs-in-array": '{ "value": [ new Blob(["one"]), new Blob(["two"]) ] }',
				"file-single": '{ "value": new File(["file bytes"], "notes.txt", { type: "text/plain" }) }',
				"file-and-blob-mixed":
					'{ "value": [ new File(["F"], "f.txt", { type: "text/plain" }), new Blob(["B"], { type: "text/plain" }) ] }',
				"nested-blob": '{ "a": { "b": { "c": new Blob(["deep"], { type: "text/plain" }) } } }',
				"ext-date": '{ "value": new Date("2023-05-01T12:00:00.000Z") }',
				"ext-bigint": '{ "value": 9007199254740993n }',
				"ext-error":
					'{ "err": (() => { const e = new Error("boom"); e.name = "CustomError"; return e; })() }',
				"ext-symbol": '{ "key": Symbol("unique-identifier") }',
				"ext-combined":
					'{ "plain": "text", "when": new Date("2024-01-01T00:00:00.000Z"), "id": 12345678901234567890n, "file": new File(["payload"], "p.bin", { type: "application/octet-stream" }), "err": (() => { const e = new Error("boom"); e.name = "CustomError"; return e; })(), "sym": Symbol("id") }',
			};
			inputStr =
				map[tc.name] ??
				JSON.stringify(tc.input, (_k, v) => {
					if (typeof v === "bigint") return `${String(v)}n`;
					if (typeof v === "symbol") return `Symbol("${String((v as any).description ?? "")}")`;
					return v;
				});
		}

		const flagsObj: Record<string, boolean> = {
			"flag-date": (tc.extensions ?? []).map((e: any) => e.name).includes("date"),
			"flag-bigint": (tc.extensions ?? []).map((e: any) => e.name).includes("bigint"),
			"flag-error": (tc.extensions ?? []).map((e: any) => e.name).includes("error"),
			"flag-symbol": (tc.extensions ?? []).map((e: any) => e.name).includes("symbol"),
		};

		await page.waitForFunction(() => typeof (window as any).__runSerialized === "function");
		const payload = JSON.stringify({ inputStr, name: tc.name, flags: flagsObj });
		const txt = await page.evaluate(async (payloadStr) => {
			const p = JSON.parse(payloadStr as string);
			// @ts-ignore
			return await (window as any).__runSerialized(p.inputStr, p.name, p.flags);
		}, payload);

		// helper returns a JSON string
		const parsed = JSON.parse(txt ?? "null");
		// assert success
		expect(parsed).not.toBeNull();
		expect(parsed.ok).toBe(true);
	});
}
