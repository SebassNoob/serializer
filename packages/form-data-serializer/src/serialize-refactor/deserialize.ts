import type { SerializeConfig } from "./types";
import { _validateExtensions } from "./utils";
import { BlobExtension } from "@/extensions-refactor/blob";
import { DEFAULT_REFERENCE_PREFIX } from "./constants";

/**
 * Deserializes a FormData object back into a JavaScript object containing JSON primitives, Blobs, and custom extension types.
 *
 * This function reverses the serialization process by:
 * 1. Parsing the main object structure from the data key
 * 2. Replacing extension reference keys ("$ref:name:uuid") with their corresponding deserialized values
 * 3. Recursively reconstructing the original object structure
 *
 * @param formData - The FormData object to deserialize.
 * @param config - Configuration object containing extensions and reference prefixes.
 * @returns The reconstructed JavaScript object.
 *
 * @throws {@link Error} Throws an error if data is missing or invalid.
 *
 * @example Basic deserialization
 * ```typescript
 * const originalData = deserialize(formData);
 * ```
 */
export function deserialize(formData: FormData, config?: SerializeConfig): any {
	if (config?.extensions) _validateExtensions(config.extensions);

	const extensions = [BlobExtension, ...(config?.extensions ?? [])];
	const extensionsMap = new Map(extensions.map(ext => [ext.name, ext]));
	const dataKey = config?.referencePrefix?.data ?? DEFAULT_REFERENCE_PREFIX.data;
	const extPrefix = config?.referencePrefix?.extension ?? DEFAULT_REFERENCE_PREFIX.extension;
	const escapedExtPrefix = extPrefix.replace(/\$/g, '\\$');
	const extRegex = new RegExp(`^${escapedExtPrefix}:([^:]+):(.+)$`);

	const dataString = formData.get(dataKey) as string;
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

	// Create a map of stored values
	const storedValues = new Map<string, unknown>();

	for (const [key, value] of formData.entries()) {
		if (key === dataKey) continue;
		const extMatch = key.match(extRegex);
		if (extMatch) {
			const [, name] = extMatch;
			if (name === "blob") {
				// File extends Blob, so this handles both File and Blob
				if (typeof value !== "string") {
					storedValues.set(key, value);
				} else {
					throw new Error(`Expected Blob for file hole key '${key}', but got ${typeof value}`);
				}
			} else {
				if (typeof value === "string") {
					try {
						storedValues.set(key, JSON.parse(value));
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
	}	// Recursive function to replace references
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

	return recursivelyHandle(parsedData);
}
