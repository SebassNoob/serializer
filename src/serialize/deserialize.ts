import { DATA_KEY, EXT_KEY_REGEX, EXTENSION_KEY, FILE_HOLE_KEY, REF_KEY_REGEX } from "./constants";
import type { ExtractExtensionTypes, Serializable, SerializationExtension } from "./types";
import { _validateExtensions } from "./utils";

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
			// Extension data can be either a string (JSON) or a Blob
			if (typeof value === "string") {
				try {
					extensionData[key] = JSON.parse(value);
				} catch (error) {
					throw new Error(
						`Failed to parse extension data for key '${key}': ${error instanceof Error ? error.message : "Unknown error"}`,
					);
				}
			} else if (typeof value === "object" && value !== null && "size" in value) {
				// Extension returned a Blob
				extensionData[key] = value as Blob;
			} else {
				throw new Error(
					`Expected string or Blob for extension key '${key}', but got ${typeof value}`,
				);
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
			if (!(typeof extData === "string" || extData instanceof Blob)) {
				throw new Error(`Extension data is not string or Blob for key: ${key}`);
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
