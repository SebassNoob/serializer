import { DATA_KEY, EXT_KEY_REGEX, EXTENSION_KEY, FILE_HOLE_KEY, REF_KEY_REGEX } from "./constants";
import type { ExtractExtensionTypes, Serializable, SerializationExtension } from "./types";
import { _validateExtensions } from "./utils";

/**
 * Deserializes a FormData object back into a JavaScript object containing JSON primitives, Blobs, and custom extension types.
 *
 * This function reverses the serialization process by:
 * 1. Parsing the main object structure from the "$data" key
 * 2. Replacing file reference keys ("$ref:\_uuid\_") with their corresponding Blob objects
 * 3. Replacing extension reference keys ("$ext:\_extension-name\_:\_uuid\_") with their deserialized custom types
 * 4. Recursively reconstructing the original object structure
 *
 * @typeParam T - Array type of serialization extensions
 * @param formData - The FormData object to deserialize. Must contain:
 *   - "$data": JSON string of the main object structure with references
 *   - "$ref:\_uuid\_": Blob entries for file references
 *   - "$ext:\_extension-name\_:\_uuid\_": Extension data (either JSON strings or Blobs)
 * @param extensions - Array of serialization extensions that match those used during serialization.
 *   Must include all extensions that were used to serialize extension references in the data.
 *   Defaults to an empty array.
 * @returns The reconstructed JavaScript object with all references
 *   resolved back to their original types (Blobs, custom extension types, etc.)
 *
 * @throws {@link Error} Throws an error if:
 *   - No "$data" key is found in the FormData
 *   - The "$data" value cannot be parsed as JSON
 *   - A reference key points to missing data in the FormData
 *   - Extension data cannot be parsed or deserialized
 *   - A required extension is not provided in the extensions array
 *   - FormData contains invalid data types for reference keys
 *
 * @example Basic deserialization without extensions
 * ```typescript
 * // Given FormData from serialize() containing:
 * // - "$data": '{"name":"John","age":30,"profile":{"avatar":"$ref:01234567-89ab-cdef-0123-456789abcdef"}}'
 * // - "$ref:01234567-89ab-cdef-0123-456789abcdef": [Blob object with image data]
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
 * @example With extensions for custom types (Date extension)
 * ```typescript
 * const dateExtension = {
 *   name: "date",
 *   canHandle: (value) => value instanceof Date,
 *   serialize: (date) => date.toISOString(),
 *   deserialize: (str) => new Date(str)
 * };
 *
 * // Given FormData from serialize() with date extension containing:
 * // - "$data": '{"user":"Alice","timestamps":{"created":"$ext:date:abc123...","updated":"$ext:date:def456..."},"events":[{"name":"signup","date":"$ext:date:jkl012..."}]}'
 * // - "$ext:date:abc123...": "2023-01-01T10:30:00.000Z"
 * // - "$ext:date:def456...": "2023-12-31T15:45:30.000Z"
 * // - "$ext:date:jkl012...": "2023-01-01T10:30:00.000Z"
 *
 * const originalData = deserialize(formData, [dateExtension]);
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
 */
// biome-ignore lint/suspicious/noExplicitAny: unavoidable due to dynamic nature of extensions
export function deserialize<T extends readonly SerializationExtension<any>[]>(
	formData: FormData,
	extensions: T = [] as unknown as T,
): Serializable<ExtractExtensionTypes<T>> {
	_validateExtensions(extensions);

	const dataString = formData.get(DATA_KEY) as string;
	if (!dataString) {
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

	// Create a map of file holes and extension data for quick lookup
	const fileHoles: Record<string, Blob> = {};
	const extensionData: Record<string, unknown> = {};

	// Regexes for parsing keys - these match the patterns used by FILE_HOLE_KEY and EXTENSION_KEY

	// Populate file holes and extension data from FormData
	for (const [key, value] of formData.entries()) {
		if (key === DATA_KEY) continue; // Skip the main data key
		const refMatch = key.match(REF_KEY_REGEX);
		const extMatch = key.match(EXT_KEY_REGEX);
		if (refMatch) {
			// Ensure value is a Blob (has property 'size')
			if (typeof value !== "object" || value === null || !("size" in value)) {
				throw new Error(`Expected Blob for file hole key '${key}', but got ${typeof value}`);
			}
			fileHoles[key] = value as Blob;
		} else if (extMatch) {
			// Extension data is always a string (JSON) since extensions only return strings
			if (typeof value === "string") {
				try {
					extensionData[key] = JSON.parse(value);
				} catch (error) {
					throw new Error(
						`Failed to parse extension data for key '${key}': ${error instanceof Error ? error.message : "Unknown error"}`,
					);
				}
			} else {
				throw new Error(`Expected string for extension key '${key}', but got ${typeof value}`);
			}
		}
	}
	// Recursive function to replace file holes and handle extensions
	function recursiveReplaceFile(data: unknown): unknown {
		// Handle file hole references
		if (typeof data === "string" && data.match(REF_KEY_REGEX)) {
			const refMatch = data.match(REF_KEY_REGEX);
			if (!refMatch) {
				throw new Error(`Malformed file hole key: ${data}`);
			}

			const [, id] = refMatch;
			const key = FILE_HOLE_KEY(id ?? "");

			if (!(key in fileHoles)) {
				throw new Error(`File hole not found for key: ${key}`);
			}

			const blob = fileHoles[key];
			// Ensure the blob exists :)
			if (!blob) {
				throw new Error(`File hole contains invalid data for key: ${key}`);
			}

			return blob;
		}

		// Handle extension references
		if (typeof data === "string" && data.match(EXT_KEY_REGEX)) {
			const extMatch = data.match(EXT_KEY_REGEX);
			if (!extMatch) {
				throw new Error(`Malformed extension key: ${data}`);
			}

			const [, name, id] = extMatch;
			const key = EXTENSION_KEY(name ?? "", id ?? "");

			if (!(key in extensionData)) {
				throw new Error(`Extension data not found for key: ${key}`);
			}

			// Find the extension by name
			const extension = extensions.find((ext) => ext.name === name);
			if (!extension) {
				throw new Error(`Extension '${name}' not found in provided extensions`);
			}

			const extData = extensionData[key];
			if (typeof extData !== "string") {
				throw new Error(`Extension data is not string for key: ${key}`);
			}

			return extension.deserialize(extData);
		}

		// Handle arrays recursively
		if (Array.isArray(data)) {
			return data.map((item) => recursiveReplaceFile(item));
		}

		// Handle objects and null
		if (data === null) return null;
		if (typeof data === "object") {
			const result: { [key: string]: unknown } = {};
			for (const key in data) {
				result[key] = recursiveReplaceFile((data as Record<string, unknown>)[key]);
			}
			return result;
		}

		// Handle primitive types (string, number, boolean)
		return data;
	}
	const result = recursiveReplaceFile(parsedData);
	return result as Serializable<ExtractExtensionTypes<T>>; // hopefully...
}
