// Flag constants and helper used by tests
export const FLAGS = {
	DATE: "flag-date",
	BIGINT: "flag-bigint",
	ERROR: "flag-error",
	SYMBOL: "flag-symbol",
} as const;

export function buildFlags(extensions?: Array<{ name: string }>): Record<string, boolean> {
	const names = (extensions ?? []).map((e) => e.name);
	return {
		[FLAGS.DATE]: names.includes("date"),
		[FLAGS.BIGINT]: names.includes("bigint"),
		[FLAGS.ERROR]: names.includes("error"),
		[FLAGS.SYMBOL]: names.includes("symbol"),
	};
}

// Shared list of integration test cases used by multiple runtimes (Next.js, Hono)
export const ALL_CASES = [
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

// Mapping for cases that can't be JSON.stringified (blobs, files, symbols, bigints, errors)
export const INPUT_MAP: Record<string, string> = {
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
