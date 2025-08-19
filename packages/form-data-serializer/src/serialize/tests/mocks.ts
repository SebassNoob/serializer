import type { SerializationExtension } from "../types";

// Mock Date extension for testing
export const mockDateExtension: SerializationExtension<Date> = {
	name: "date",
	serialize: (value: Date) => value.toISOString(),
	deserialize: (value) => new Date(value as string),
	canHandle: (value: unknown): value is Date => value instanceof Date,
};

// Mock BigInt extension for testing
export const mockBigIntExtension: SerializationExtension<bigint> = {
	name: "bigint",
	serialize: (value: bigint) => value.toString(),
	deserialize: (value) => BigInt(value as string),
	canHandle: (value: unknown): value is bigint => typeof value === "bigint",
};

// Mock Set extension
export const mockSetExtension: SerializationExtension<Set<string>> = {
	name: "set",
	serialize: (value: Set<string>) => JSON.stringify([...value]),
	deserialize: (value: string | Blob) => new Set(JSON.parse(value as string)),
	canHandle: (value: unknown): value is Set<string> => value instanceof Set,
};

// Mock Map extension
export const mockMapExtension: SerializationExtension<Map<string, number>> = {
	name: "map",
	serialize: (value: Map<string, number>) =>
		JSON.stringify([...value.entries()]),
	deserialize: (value: string | Blob) => new Map(JSON.parse(value as string)),
	canHandle: (value: unknown): value is Map<string, number> =>
		value instanceof Map,
};

// Mock RegExp extension
export const mockRegExpExtension: SerializationExtension<RegExp> = {
	name: "regex",
	serialize: (value: RegExp) =>
		JSON.stringify({ source: value.source, flags: value.flags }),
	deserialize: (value: string | Blob) => {
		const { source, flags } = JSON.parse(value as string);
		return new RegExp(source, flags);
	},
	canHandle: (value: unknown): value is RegExp => value instanceof RegExp,
};

// Mock URL extension
export const mockUrlExtension: SerializationExtension<URL> = {
	name: "url",
	serialize: (value: URL) => value.href,
	deserialize: (value: string | Blob) => new URL(value as string),
	canHandle: (value: unknown): value is URL => value instanceof URL,
};

// Mock Symbol extension
export const mockSymbolExtension: SerializationExtension<symbol> = {
	name: "symbol",
	serialize: (value: symbol) => value.toString(),
	deserialize: (value: string | Blob) =>
		Symbol.for((value as string).replace("Symbol(", "").replace(")", "")),
	canHandle: (value: unknown): value is symbol => typeof value === "symbol",
};

// Mock Error extension
export const mockErrorExtension: SerializationExtension<Error> = {
	name: "error",
	serialize: (value: Error) =>
		JSON.stringify({
			name: value.name,
			message: value.message,
			stack: value.stack,
		}),
	deserialize: (value: string | Blob) => {
		const parsed = JSON.parse(value as string);
		const error = new Error(parsed.message);
		error.name = parsed.name;
		error.stack = parsed.stack;
		return error;
	},
	canHandle: (value: unknown): value is Error => value instanceof Error,
};

// Mock extensions that return Blobs (for testing limitations)
export const mockImageDataExtension: SerializationExtension<{
	width: number;
	height: number;
	data: Uint8Array;
}> = {
	name: "imagedata",
	serialize: (value) => {
		const data = {
			width: value.width,
			height: value.height,
			data: Array.from(value.data),
		};
		return new Blob([JSON.stringify(data)], { type: "application/json" });
	},
	deserialize: (value: string | Blob) => {
		if (value instanceof Blob) {
			throw new Error("Cannot read Blob synchronously");
		}
		const parsed = JSON.parse(value as string);
		return {
			width: parsed.width,
			height: parsed.height,
			data: new Uint8Array(parsed.data),
		};
	},
	canHandle: (
		value: unknown,
	): value is { width: number; height: number; data: Uint8Array } =>
		typeof value === "object" &&
		value !== null &&
		"width" in value &&
		"height" in value &&
		"data" in value &&
		value.data instanceof Uint8Array,
};

export const mockArrayBufferExtension: SerializationExtension<ArrayBuffer> = {
	name: "arraybuffer",
	serialize: (value: ArrayBuffer) => new Blob([value]),
	deserialize: (value: string | Blob) => {
		if (value instanceof Blob) {
			throw new Error("Cannot read Blob synchronously");
		}
		throw new Error("Expected Blob for ArrayBuffer deserialization");
	},
	canHandle: (value: unknown): value is ArrayBuffer =>
		value instanceof ArrayBuffer,
};

export const mockBinaryDataExtension: SerializationExtension<{
	type: "binary";
	content: Uint8Array;
	metadata: { name: string; size: number };
}> = {
	name: "binary-data",
	serialize: (value) => {
		const metadata = JSON.stringify({
			type: value.type,
			metadata: value.metadata,
			content: Array.from(value.content),
		});
		return new Blob([metadata], { type: "application/json" });
	},
	deserialize: (value: string | Blob) => {
		if (value instanceof Blob) {
			throw new Error("Cannot read Blob synchronously");
		}
		const parsed = JSON.parse(value as string);
		return {
			type: parsed.type,
			content: new Uint8Array(parsed.content),
			metadata: parsed.metadata,
		};
	},
	canHandle: (
		value: unknown,
	): value is {
		type: "binary";
		content: Uint8Array;
		metadata: { name: string; size: number };
	} =>
		typeof value === "object" &&
		value !== null &&
		"type" in value &&
		value.type === "binary" &&
		"content" in value &&
		value.content instanceof Uint8Array,
};

// Mock custom class for testing
export class MockPerson {
	constructor(
		public name: string,
		public age: number,
		public email: string,
	) {}

	greet() {
		return `Hello, I'm ${this.name}`;
	}
}

export const mockPersonExtension: SerializationExtension<MockPerson> = {
	name: "person",
	serialize: (value: MockPerson) =>
		JSON.stringify({
			name: value.name,
			age: value.age,
			email: value.email,
		}),
	deserialize: (value: string | Blob) => {
		const parsed = JSON.parse(value as string);
		return new MockPerson(parsed.name, parsed.age, parsed.email);
	},
	canHandle: (value: unknown): value is MockPerson =>
		value instanceof MockPerson,
};

// Helper extensions for various test scenarios
export const mockEmptyExtension: SerializationExtension<{ isEmpty: true }> = {
	name: "empty",
	serialize: () => "",
	deserialize: () => ({ isEmpty: true }),
	canHandle: (value: unknown): value is { isEmpty: true } =>
		typeof value === "object" &&
		value !== null &&
		"isEmpty" in value &&
		value.isEmpty === true,
};

export const mockNullableExtension: SerializationExtension<{
	value: null | Date;
}> = {
	name: "nullable-date",
	serialize: (value) =>
		JSON.stringify({
			hasDate: value.value !== null,
			date: value.value ? value.value.toISOString() : null,
		}),
	deserialize: (value: string | Blob) => {
		const parsed = JSON.parse(value as string);
		return {
			value: parsed.hasDate ? new Date(parsed.date) : null,
		};
	},
	canHandle: (value: unknown): value is { value: null | Date } =>
		typeof value === "object" &&
		value !== null &&
		"value" in value &&
		(value.value === null || value.value instanceof Date),
};

// Mock complex recursive type for testing
export interface MockComplexType {
	id: string;
	children: MockComplexType[];
	parent?: MockComplexType;
}

export const mockComplexExtension: SerializationExtension<MockComplexType> = {
	name: "complex-recursive",
	serialize: (value: MockComplexType) => {
		// Flatten to avoid circular references
		const flattened = {
			id: value.id,
			children: value.children.map((c) => c.id),
			parentId: value.parent?.id,
		};
		return JSON.stringify(flattened);
	},
	deserialize: (value: string | Blob) => {
		const parsed = JSON.parse(value as string);
		// This is a simplified deserialization for testing
		return {
			id: parsed.id,
			children: parsed.children.map((id: string) => ({
				id,
				children: [],
				parent: undefined,
			})),
			parent: parsed.parentId
				? { id: parsed.parentId, children: [], parent: undefined }
				: undefined,
		} as MockComplexType;
	},
	canHandle: (value: unknown): value is MockComplexType =>
		typeof value === "object" &&
		value !== null &&
		"id" in value &&
		"children" in value &&
		Array.isArray(value.children),
};

// Extensions for error testing
export const mockErrorProneExtension: SerializationExtension<{
	shouldError: true;
}> = {
	name: "error-prone",
	serialize: () => {
		throw new Error("Serialization failed");
	},
	deserialize: () => ({ shouldError: true }),
	canHandle: (value: unknown): value is { shouldError: true } =>
		typeof value === "object" && value !== null && "shouldError" in value,
};

// Competing extensions for priority testing
export const mockFirstDateExtension: SerializationExtension<Date> = {
	name: "first-date",
	serialize: (value: Date) => `FIRST:${value.toISOString()}`,
	deserialize: (value: string | Blob) =>
		new Date((value as string).replace("FIRST:", "")),
	canHandle: (value: unknown): value is Date => value instanceof Date,
};

export const mockSecondDateExtension: SerializationExtension<Date> = {
	name: "second-date",
	serialize: (value: Date) => `SECOND:${value.getTime()}`,
	deserialize: (value: string | Blob) =>
		new Date(Number.parseInt((value as string).replace("SECOND:", ""), 10)),
	canHandle: (value: unknown): value is Date => value instanceof Date,
};

// Invalid extensions for validation testing
export const mockInvalidExtensions = [
	{
		name: "test:invalid",
		serialize: () => "",
		deserialize: () => null,
		canHandle: () => false,
	},
	{
		name: "",
		serialize: () => "",
		deserialize: () => null,
		canHandle: () => false,
	},
	{
		name: "   ",
		serialize: () => "",
		deserialize: () => null,
		canHandle: () => false,
	},
	{
		name: "$invalid",
		serialize: () => "",
		deserialize: () => null,
		canHandle: () => false,
	},
	{
		name: "refinvalid",
		serialize: () => "",
		deserialize: () => null,
		canHandle: () => false,
	},
	{
		name: "extinvalid",
		serialize: () => "",
		deserialize: () => null,
		canHandle: () => false,
	},
];

export const mockDuplicateExtensions = [
	{
		name: "duplicate",
		serialize: () => "",
		deserialize: () => null,
		canHandle: () => false,
	},
	{
		name: "duplicate",
		serialize: () => "",
		deserialize: () => null,
		canHandle: () => false,
	},
];
