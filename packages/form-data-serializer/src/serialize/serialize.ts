import { randomUUIDv7 } from "bun";
import { DATA_KEY, EXTENSION_KEY, FILE_HOLE_KEY } from "./constants";
import type { ExtractExtensionTypes, Serializable, SerializationExtension } from "./types";
import { _validateExtensions } from "./utils";

/**
 * Serializes a JavaScript object containing JSON primitives, Blobs, and custom extension types into a FormData object.
 *
 * The function recursively traverses the object structure, replacing any Blob instances and extension-handled
 * values with unique reference keys. The actual Blob data and extension data are stored separately in the
 * FormData under these reference keys, while the main object structure (with references) is stored under
 * the "$data" key as JSON.
 *
 * @typeParam T - Array type of serialization extensions
 * @param obj - The object to serialize. Can contain JSON primitives
 *   (string, number, boolean, null), Blobs, arrays, nested objects, and values handled by extensions.
 * @param extensions - Array of serialization extensions that define how to handle custom types.
 *   Defaults to an empty array.
 * @returns A FormData object containing:
 *   - "$data": JSON string of the main object structure with Blob/extension references
 *   - "$ref:\_uuid\_": Individual Blob entries referenced in the main structure
 *   - "$ext:\_extension-name\_:\_uuid\_": Extension-serialized data (either as Blob or JSON string)
 *
 * @throws {@link Error} Throws an error if the input object is undefined
 *
 * @example Basic serialization without extensions
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
 * // - "$data": '{"name":"John","age":30,"active":true,"metadata":null,"tags":["user","admin"],"profile":{"bio":"Software developer","avatar":"$ref:01234567-89ab-cdef-0123-456789abcdef"}}'
 * // - "$ref:01234567-89ab-cdef-0123-456789abcdef": [Blob object with image data]
 * ```
 *
 * @example With extensions for custom types (Date extension)
 * ```typescript
 * const dateExtension = {
 *   name: "date",
 *   canHandle: (value) => value instanceof Date,
 *   serialize: (date) => date.toISOString(),
 *   deserialize: (str) => new Date(str)
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
 * const formData = serialize(data, [dateExtension]);
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
 */
// biome-ignore lint/suspicious/noExplicitAny: unavoidable due to dynamic nature of extensions
export function serialize<T extends readonly SerializationExtension<any>[]>(
	obj: Serializable<ExtractExtensionTypes<T>>,
	extensions: T = [] as unknown as T,
): FormData {
	// Handle edge case: undefined object
	if (obj === undefined) {
		throw new Error("Cannot serialize undefined value");
	}

	_validateExtensions(extensions);
	const formData = new FormData();

	const holes: Record<string, Blob> = {};
	const extensionData: Record<string, unknown> = {};

	// yippee side effects
	function replaceFileWithHole(file: Blob) {
		// Generate a unique ID for the file and store it in the holes object
		const id = randomUUIDv7();
		holes[FILE_HOLE_KEY(id)] = file;
		return FILE_HOLE_KEY(id);
	}

	function handleExtensions(data: unknown): unknown {
		for (const extension of extensions) {
			if (extension.canHandle(data)) {
				const serialized = extension.serialize(data);
				const id = randomUUIDv7();
				const key = EXTENSION_KEY(extension.name, id);

				if (serialized instanceof Blob) {
					// Treat extension Blobs like regular Blobs
					holes[key] = serialized;
				} else {
					// String data goes to extensionData
					extensionData[key] = serialized;
				}
				return key;
			}
		}
		return data;
	}

	function recursiveReplaceFile(data: Serializable): Serializable {
		// Check for extension handling first (before Blob check)
		const extensionResult = handleExtensions(data);
		if (extensionResult !== data) {
			return extensionResult as Serializable;
		}

		// Encountered a Blob (or File), replace it with a reference
		if (data instanceof Blob) {
			return replaceFileWithHole(data);
		}
		// Handle arrays recursively
		if (Array.isArray(data)) {
			return data.map((item) => recursiveReplaceFile(item)) as Serializable;
		}
		// Handle objects and null
		// typeof null check because typeof null is 'object'
		if (data === null) return null;
		if (typeof data === "object") {
			const result: { [key: string]: Serializable } = {};
			for (const key in data) {
				if (data[key] !== undefined) {
					result[key] = recursiveReplaceFile(data[key]);
				}
			}
			return result as Serializable;
		}
		// Handle primitive types (string, number, boolean)
		return data;
	}
	const result = recursiveReplaceFile(obj);

	for (const [key, blob] of Object.entries(holes)) {
		if (blob !== undefined) {
			formData.append(key, blob);
		}
	}

	for (const [key, value] of Object.entries(extensionData)) {
		formData.append(key, JSON.stringify(value));
	}

	formData.append(DATA_KEY, JSON.stringify(result));

	return formData;
}
