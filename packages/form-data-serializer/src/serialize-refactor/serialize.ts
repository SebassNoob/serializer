import { v7 as randomUUID } from "uuid";
import type {
	ExtractExtensionTypes,
	Serializable,
	SerializationExtension,
	SerializeConfig,
} from "./types";
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
 * the "$data" key as JSON.
 *
 * @typeParam T - Array type of serialization extensions
 * @param obj - The object to serialize. Can contain JSON primitives
 *   (string, number, boolean, null), Blobs, arrays, nested objects, and values handled by extensions.
 * @param config - Configuration object containing an array of serialization extensions that define how to handle custom types.
 *   Defaults to an empty array.
 * @returns A FormData object containing:
 *   - "$data": JSON string of the main object structure with Blob/extension references
 *   - "$ext:name:uuid": Individual Blob or extension data referenced in the main structure
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
 * // - "$data": '{"name":"John","age":30,"active":true,"metadata":null,"tags":["user","admin"],"profile":{"bio":"Software developer","avatar":"$ext:blob:01234567-89ab-cdef-0123-456789abcdef"}}'
 * // - "$ext:blob:01234567-89ab-cdef-0123-456789abcdef": [Blob object with image data]
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
 */
// biome-ignore lint/suspicious/noExplicitAny: unavoidable due to dynamic nature of extensions
export function serialize<T = unknown>(obj: T, config?: SerializeConfig): FormData {
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

	// create a map to store all the holes (eg. $ref:file:_uuid_ -> Blob object)
	const holes = new Map<string, Serializable<Blob>>();
	function replaceWithHole(extName: string, item: Serializable<Blob>) {
		// Generate a unique ID for the object and store it in the holes object
		const id = config?.generateDataId ? config.generateDataId(item) : randomUUID();
		holes.set(GET_HOLE_KEY(extName, id), item);
		return GET_HOLE_KEY(extName, id);
	}

	// Recursively traverse the object and replace Blobs and extension-handled values with holes
	function recursivelyHandle(data: unknown): Serializable | undefined {
		if (data === undefined || data === null) return data;

		// Check if any extension can handle this value
		for (const extension of extensions) {
			if (extension.canHandle(data)) {
				const serialized = extension.serialize(data as any);
				return replaceWithHole(extension.name, serialized);
			}
		}

		if (Array.isArray(data)) return data.map(recursivelyHandle) as Serializable[];
		if (typeof data === "object" && data.constructor === Object)
			return Object.entries(data).reduce(
				(acc, [key, value]) => {
					acc[key] = recursivelyHandle(value as Serializable)!;
					return acc;
				},
				{} as Record<string, Serializable>,
			);

		// If no extension handles it, it should be a primitive value
		return data as Serializable;
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
