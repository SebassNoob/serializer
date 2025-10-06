import { v7 as randomUUID } from "uuid";
import type { Serializable, SerializeConfig } from "./types";
import { _validateExtensions } from "./utils";
import { BlobExtension } from "@/extensions-refactor/blob";
import { DEFAULT_REFERENCE_PREFIX } from "./constants";

// NEW PHILOSOPHY: files should be an extension too, so everything is handled the same way

/**
 * Serializes a JavaScript object containing JSON primitives, Blobs, and custom extension types into a FormData object.
 *
 * The function recursively traverses the object structure, replacing any Blob instances and extension-handled
 * values with unique reference keys. The actual Blob data and extension data are stored separately in the
 * FormData under these reference keys, while the main object structure (with references) is stored under
 * a configurable data key (default: "$data") as JSON.
 *
 * The refactored serialize function treats all non-primitive types uniformly as extensions,
 * including Blobs and Files which are handled by the built-in BlobExtension.
 *
 * **Type Safety with Extensions:**
 *
 * The function accepts `unknown` to allow serializing objects with extension-handled types (like `Date`, `bigint`, etc.).
 * TypeScript cannot statically validate that extensions are provided for custom types, so type checking
 * happens at runtime through the extension's `canHandle` method.
 *
 * When using extensions, you may need to use type assertions:
 * ```typescript
 * // ✓ With type assertion when using extensions
 * const data = { date: new Date() } as const;
 * serialize(data, { extensions: [DateExtension] });
 *
 * // ✓ Or explicitly type as unknown
 * const data: unknown = { bigint: 123n };
 * serialize(data, { extensions: [BigIntExtension] });
 * ```
 *
 * @param obj - The object to serialize. Can contain JSON primitives
 *   (string, number, boolean, null), Blobs, Files, arrays, nested objects, and values handled by extensions.
 *   Cannot be `undefined`.
 * @param config - Optional configuration object with the following properties:
 *   - `extensions`: Array of SerializationExtension objects that define how to handle custom types.
 *     The BlobExtension is automatically included by default. Defaults to an empty array.
 *   - `referencePrefix`: Optional object to customize reference key prefixes:
 *     - `data`: The key for the main data structure (default: "$data")
 *     - `extension`: The prefix for extension references (default: "$ext")
 *   - `generateDataId`: Optional custom function to generate IDs for extension data.
 *     Receives the serialized value and should return a unique string identifier.
 *     Defaults to UUID v7 generation.
 * @returns A FormData object containing:
 *   - A data key (default: "$data"): JSON string of the main object structure with extension references
 *   - Extension data entries: "$ext:\_extension-name\_:\_uuid\_" for each extension-handled value
 *   - For Blobs/Files: "$ext:blob:\_uuid\_" containing the actual Blob/File objects
 *   - For other extensions: "$ext:\_extension-name\_:\_uuid\_" containing JSON strings
 *
 * @throws {@link Error} Throws an error if:
 *   - The input object is `undefined`
 *   - Extensions array contains invalid extension definitions
 *
 * @example Basic serialization without custom extensions
 * ```typescript
 * const data = {
 *   name: "John",
 *   age: 30,
 *   active: true,
 *   metadata: null,
 *   tags: ["user", "admin"],
 *   profile: {
 *     bio: "Software developer",
 *     avatar: new Blob(["image data"], { type: "image/png" })
 *   }
 * };
 *
 * const formData = serialize(data);
 *
 * // The FormData will contain:
 * // - "$data": '{"name":"John","age":30,"active":true,"metadata":null,"tags":["user","admin"],"profile":{"bio":"Software developer","avatar":"$ext:blob:01234567-89ab-cdef-0123-456789abcdef"}}'
 * // - "$ext:blob:01234567-89ab-cdef-0123-456789abcdef": [Blob object with image data]
 * ```
 *
 * @example With custom extensions (Date extension)
 * ```typescript
 * const dateExtension = {
 *   name: "date",
 *   canHandle: (value): value is Date => value instanceof Date,
 *   serialize: (date) => date.toISOString(),
 *   deserialize: (str) => new Date(str as string)
 * };
 *
 * const data = {
 *   user: "Alice",
 *   timestamps: {
 *     created: new Date("2023-01-01T10:30:00.000Z"),
 *     updated: new Date("2023-12-31T15:45:30.000Z"),
 *     lastLogin: new Date("2024-08-20T08:00:00.000Z")
 *   },
 *   events: [
 *     { name: "signup", date: new Date("2023-01-01T10:30:00.000Z") },
 *     { name: "purchase", date: new Date("2023-06-15T14:20:00.000Z") }
 *   ]
 * };
 *
 * const formData = serialize(data, { extensions: [dateExtension] });
 *
 * // The FormData will contain:
 * // - "$data": '{"user":"Alice","timestamps":{"created":"$ext:date:abc123...","updated":"$ext:date:def456...","lastLogin":"$ext:date:ghi789..."},"events":[{"name":"signup","date":"$ext:date:jkl012..."},{"name":"purchase","date":"$ext:date:mno345..."}]}'
 * // - "$ext:date:abc123...": "2023-01-01T10:30:00.000Z"
 * // - "$ext:date:def456...": "2023-12-31T15:45:30.000Z"
 * // - "$ext:date:ghi789...": "2024-08-20T08:00:00.000Z"
 * // - "$ext:date:jkl012...": "2023-01-01T10:30:00.000Z"
 * // - "$ext:date:mno345...": "2023-06-15T14:20:00.000Z"
 *
 * // Each Date object is replaced with a reference key in the main structure,
 * // and the serialized ISO string is stored separately in the FormData under
 * // the corresponding extension key.
 * ```
 *
 * @example With custom reference prefixes
 * ```typescript
 * const customConfig = {
 *   referencePrefix: {
 *     data: "main",
 *     extension: "@ref"
 *   },
 *   extensions: []
 * };
 *
 * const data = {
 *   name: "Alice",
 *   file: new Blob(["content"], { type: "text/plain" })
 * };
 *
 * const formData = serialize(data, customConfig);
 *
 * // The FormData will contain:
 * // - "main": '{"name":"Alice","file":"@ref:blob:abc123..."}'
 * // - "@ref:blob:abc123...": [Blob object]
 *
 * // Uses "main" instead of "$data" and "@ref:" instead of "$ext:"
 * ```
 *
 * @example Handling File objects (subclass of Blob)
 * ```typescript
 * const data = {
 *   document: new File(["content"], "document.pdf", { type: "application/pdf" }),
 *   metadata: {
 *     size: 1024,
 *     uploaded: new Date()
 *   }
 * };
 *
 * const formData = serialize(data);
 *
 * // The FormData will contain:
 * // - "$data": '{"document":"$ext:blob:file123...","metadata":{"size":1024,"uploaded":"$ext:blob:date456..."}}'
 * // - "$ext:blob:file123...": [File object: "document.pdf"]
 *
 * // File objects are automatically handled by the BlobExtension
 * // since File extends Blob
 * ```
 *
 * @example With custom ID generation
 * ```typescript
 * let counter = 0;
 * const customConfig = {
 *   generateDataId: () => `custom-${counter++}`,
 *   extensions: []
 * };
 *
 * const data = {
 *   files: [
 *     new Blob(["first"]),
 *     new Blob(["second"])
 *   ]
 * };
 *
 * const formData = serialize(data, customConfig);
 *
 * // The FormData will contain:
 * // - "$data": '{"files":["$ext:blob:custom-0","$ext:blob:custom-1"]}'
 * // - "$ext:blob:custom-0": [First Blob]
 * // - "$ext:blob:custom-1": [Second Blob]
 *
 * // Uses custom ID generation instead of UUIDs
 * ```
 */
export function serialize(obj: unknown, config?: SerializeConfig): FormData {
	// Validate input
	if (obj === undefined) {
		throw new Error("Cannot serialize undefined value");
	}
	if (config?.extensions) _validateExtensions(config.extensions);

	const GET_HOLE_KEY = (extName: string, id: string) =>
		config?.referencePrefix?.extension
			? `${config.referencePrefix.extension}:${extName}:${id}`
			: `${DEFAULT_REFERENCE_PREFIX.extension}:${extName}:${id}`;

	const extensions = [BlobExtension, ...(config?.extensions ?? [])];

	const formData = new FormData();

	// create a map to store all the holes (eg. $ext:blob:_uuid_ -> Blob object)
	const holes = new Map<string, string | Blob>();

	function replaceWithHole(extName: string, item: string | Blob): string {
		// Generate a unique ID for the object and store it in the holes object
		const id = config?.generateDataId ? config.generateDataId(item) : randomUUID();
		const key = GET_HOLE_KEY(extName, id);
		holes.set(key, item);
		return key;
	}

	// Recursively traverse the object and replace Blobs and extension-handled values with holes
	function recursivelyHandle(data: unknown): unknown {
		if (data === undefined || data === null) return data;

		// Check if any extension can handle this value
		for (const extension of extensions) {
			if (extension.canHandle(data)) {
				// TypeScript limitation: canHandle narrows the type, but we can't express
				// the correlation between the type guard and the generic parameter across
				// the array iteration. The cast is safe because canHandle guarantees the type.
				const serialized = extension.serialize(data as any);
				return replaceWithHole(extension.name, serialized);
			}
		}

		if (Array.isArray(data)) return data.map(recursivelyHandle);

		if (typeof data === "object" && data.constructor === Object) {
			const result: Record<string, unknown> = {};
			for (const [key, value] of Object.entries(data)) {
				result[key] = recursivelyHandle(value);
			}
			return result;
		}

		// If no extension handles it, it should be a primitive value
		return data;
	}

	const result = recursivelyHandle(obj);

	// Store the main data structure with holes as a JSON string under a "$data" key
	const DATA_KEY = config?.referencePrefix?.data ?? DEFAULT_REFERENCE_PREFIX.data;
	formData.set(DATA_KEY, JSON.stringify(result));

	// Store all the holes in the FormData
	for (const [key, value] of holes.entries()) {
		if (value instanceof Blob) {
			formData.set(key, value);
		} else {
			formData.set(key, JSON.stringify(value));
		}
	}
	return formData;
}
