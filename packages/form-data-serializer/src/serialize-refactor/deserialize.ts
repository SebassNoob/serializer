import type { Serializable, SerializeConfig } from "./types";
import { _validateExtensions } from "./utils";
import { BlobExtension } from "@/extensions-refactor/blob";
import { DEFAULT_REFERENCE_PREFIX } from "./constants";

/**
 * Deserializes a FormData object back into a JavaScript object containing JSON primitives, Blobs, and custom extension types.
 *
 * This function reverses the serialization process by:
 * 1. Parsing the main object structure from the configured data key (default: "$data")
 * 2. Replacing extension reference keys (e.g., "$ext:name:uuid") with their corresponding deserialized values
 * 3. Recursively reconstructing the original object structure
 * 4. Using the BlobExtension by default to handle Blob/File objects
 *
 * The refactored deserialize function treats all non-primitive types uniformly as extensions,
 * including Blobs and Files which are handled by the built-in BlobExtension.
 *
 * **Type Safety with Extensions:**
 *
 * The function returns `unknown` because the actual type depends on which extensions were used during serialization.
 * TypeScript cannot statically determine what types the extensions will reconstruct, so you should use type assertions
 * or type guards when working with the result:
 *
 * ```typescript
 * // ✓ With type assertion
 * const result = deserialize(formData, { extensions: [DateExtension] }) as { date: Date };
 *
 * // ✓ Or with type guard
 * const result = deserialize(formData);
 * if (typeof result === 'object' && result !== null && 'date' in result) {
 *   // TypeScript now knows result has a 'date' property
 * }
 * ```
 *
 * @param formData - The FormData object to deserialize. Must contain:
 *   - A data key (default: "$data"): JSON string of the main object structure with extension references
 *   - Extension data entries with keys matching the pattern "$ext:\_extension-name\_:\_uuid\_"
 *   - For Blobs/Files: keys like "$ext:blob:\_uuid\_" containing the actual Blob/File objects
 *   - For other extensions: keys like "$ext:\_extension-name\_:\_uuid\_" containing JSON strings
 * @param config - Optional configuration object with the following properties:
 *   - `extensions`: Array of SerializationExtension objects that match those used during serialization.
 *     The BlobExtension is automatically included by default. Defaults to an empty array.
 *   - `referencePrefix`: Optional object to customize reference key prefixes:
 *     - `data`: The key for the main data structure (default: "$data")
 *     - `extension`: The prefix for extension references (default: "$ext")
 * @returns The reconstructed JavaScript object with all extension references
 *   resolved back to their original types (Blobs, Files, custom extension types, etc.).
 *   Returned as `unknown` - use type assertions or type guards based on your data structure.
 *
 * @throws {@link Error} Throws an error if:
 *   - No data is found at the configured data key in the FormData
 *   - The data value cannot be parsed as JSON
 *   - An extension reference key points to missing data in the FormData
 *   - Extension data cannot be parsed or deserialized
 *   - A required extension is not provided in the config.extensions array
 *   - FormData contains invalid data types for extension keys
 *   - Extensions array contains invalid extension definitions
 *
 * @example Basic deserialization without custom extensions
 * ```typescript
 * // Given FormData from serialize() containing:
 * // - "$data": '{"name":"John","age":30,"profile":{"avatar":"$ext:blob:01234567-89ab-cdef-0123-456789abcdef"}}'
 * // - "$ext:blob:01234567-89ab-cdef-0123-456789abcdef": [Blob object with image data]
 *
 * const originalData = deserialize(formData);
 *
 * // Result:
 * // {
 * //   name: "John",
 * //   age: 30,
 * //   profile: {
 * //     avatar: Blob { size: 1024, type: "image/png" }
 * //   }
 * // }
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
 * // Given FormData from serialize() with date extension containing:
 * // - "$data": '{"user":"Alice","timestamps":{"created":"$ext:date:abc123...","updated":"$ext:date:def456..."},"events":[{"name":"signup","date":"$ext:date:jkl012..."}]}'
 * // - "$ext:date:abc123...": "2023-01-01T10:30:00.000Z"
 * // - "$ext:date:def456...": "2023-12-31T15:45:30.000Z"
 * // - "$ext:date:jkl012...": "2023-01-01T10:30:00.000Z"
 *
 * const originalData = deserialize(formData, { extensions: [dateExtension] });
 *
 * // Result:
 * // {
 * //   user: "Alice",
 * //   timestamps: {
 * //     created: Date("2023-01-01T10:30:00.000Z"),
 * //     updated: Date("2023-12-31T15:45:30.000Z")
 * //   },
 * //   events: [
 * //     { name: "signup", date: Date("2023-01-01T10:30:00.000Z") }
 * //   ]
 * // }
 *
 * // Each "$ext:date:\_uuid\_" reference is replaced with a reconstructed Date object
 * // using the extension's deserialize method on the stored ISO string.
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
 * // Given FormData serialized with the same custom config:
 * // - "main": '{"file":"@ref:blob:abc123..."}'
 * // - "@ref:blob:abc123...": [Blob object]
 *
 * const originalData = deserialize(formData, customConfig);
 *
 * // The function will look for "main" instead of "$data"
 * // and match references starting with "@ref:" instead of "$ext:"
 * ```
 *
 * @example Handling File objects (subclass of Blob)
 * ```typescript
 * // File objects are automatically handled by the BlobExtension
 * // Given FormData from serialize() containing:
 * // - "$data": '{"document":"$ext:blob:file123..."}'
 * // - "$ext:blob:file123...": [File object: "document.pdf"]
 *
 * const originalData = deserialize(formData);
 *
 * // Result:
 * // {
 * //   document: File { name: "document.pdf", size: 2048, type: "application/pdf" }
 * // }
 * ```
 */
export function deserialize(formData: FormData, config?: SerializeConfig): unknown {
	if (config?.extensions) _validateExtensions(config.extensions);

	const extensions = [BlobExtension, ...(config?.extensions ?? [])];
	const extensionsMap = new Map(extensions.map((ext) => [ext.name, ext]));
	const dataKey = config?.referencePrefix?.data ?? DEFAULT_REFERENCE_PREFIX.data;
	const extPrefix = config?.referencePrefix?.extension ?? DEFAULT_REFERENCE_PREFIX.extension;
	const escapedExtPrefix = extPrefix.replace(/\$/g, "\\$");
	const extRegex = new RegExp(`^${escapedExtPrefix}:([^:]+):(.+)$`);

	const dataString = formData.get(dataKey);
	if (typeof dataString !== "string") {
		throw new Error("No data found in FormData");
	}

	let parsedData: unknown;
	try {
		parsedData = JSON.parse(dataString);
	} catch (error) {
		throw new Error(
			`Failed to parse data from FormData: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}

	// Create a map of stored values
	const storedValues = new Map<string, string | Blob>();

	for (const [key, value] of formData.entries()) {
		if (key === dataKey) continue;
		const extMatch = key.match(extRegex);
		if (extMatch) {
			const [, name] = extMatch;
			if (name === "blob") {
				// File extends Blob, so this handles both File and Blob
				const blobValue = value as File | Blob | string;
				if (blobValue instanceof Blob) {
					storedValues.set(key, blobValue);
				} else {
					throw new Error(`Expected Blob for extension key '${key}', but got ${typeof value}`);
				}
			} else {
				if (typeof value === "string") {
					try {
						const parsed = JSON.parse(value);
						if (typeof parsed === "string") {
							storedValues.set(key, parsed);
						} else {
							throw new Error(`Expected string from JSON.parse for key '${key}'`);
						}
					} catch (error) {
						throw new Error(
							`Failed to parse extension data for key '${key}': ${error instanceof Error ? error.message : "Unknown error"}`,
						);
					}
				} else {
					throw new Error(`Unexpected value type for extension key '${key}': ${typeof value}`);
				}
			}
		}
	}

	// Recursive function to replace references
	function recursivelyHandle(data: unknown): unknown {
		if (typeof data === "string") {
			const extMatch = data.match(extRegex);
			if (extMatch) {
				const [, name] = extMatch;
				const extension = extensionsMap.get(name);
				if (!extension) {
					throw new Error(`Extension '${name}' not found in provided extensions`);
				}
				const stored = storedValues.get(data);
				if (stored === undefined) {
					throw new Error(`Extension data not found for key: ${data}`);
				}
				// TypeScript limitation: stored is `string | Blob` but extension.deserialize
				// expects its specific SerializedType. The cast is safe because we know
				// which extension stored this value based on the key pattern.
				return extension.deserialize(stored as any);
			}
		}

		if (Array.isArray(data)) {
			return data.map(recursivelyHandle);
		}
		if (data === null || data === undefined) return data;
		if (typeof data === "object") {
			const result: Record<string, unknown> = {};
			for (const [key, value] of Object.entries(data)) {
				result[key] = recursivelyHandle(value);
			}
			return result;
		}
		return data;
	}

	return recursivelyHandle(parsedData) as Serializable;
}
