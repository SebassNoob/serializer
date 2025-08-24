import type { SerializationExtension } from "../../serialize/types";
import { DateExtension, BigIntExtension, ErrorExtension, SymbolExtension } from "../../extensions";

export type TestCase = {
	name: string;
	input: unknown;
	extensions?: SerializationExtension<any>[];
};

export function getCases(): TestCase[] {
	return [
		// 1) Basic cases
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

		// 2) Blob and File cases
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

		// 3) Built-in extensions (use actual extension objects)
		{
			name: "ext-date",
			input: { value: new Date("2023-05-01T12:00:00.000Z") },
			extensions: [DateExtension],
		},
		{
			name: "ext-bigint",
			input: { value: BigInt("9007199254740993") },
			extensions: [BigIntExtension],
		},
		{
			name: "ext-error",
			input: {
				err: (() => {
					const e = new Error("boom");
					e.name = "CustomError";
					return e;
				})(),
			},
			extensions: [ErrorExtension],
		},
		{
			name: "ext-symbol",
			input: { key: Symbol("unique-identifier") },
			extensions: [SymbolExtension],
		},
		{
			name: "ext-combined",
			input: {
				plain: "text",
				when: new Date("2024-01-01T00:00:00.000Z"),
				id: BigInt("12345678901234567890"),
				file: new File(["payload"], "p.bin", { type: "application/octet-stream" }),
				err: (() => {
					const e = new Error("boom");
					e.name = "CustomError";
					return e;
				})(),
				sym: Symbol("id"),
			},
			extensions: [DateExtension, BigIntExtension, ErrorExtension, SymbolExtension],
		},
	];
}

export default getCases;
