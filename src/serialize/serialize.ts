import { randomUUIDv7 } from "bun";
import { DATA_KEY, EXTENSION_KEY, FILE_HOLE_KEY } from "./constants";
import type { ExtractExtensionTypes, Serializable, SerializationExtension } from "./types";
import { _validateExtensions } from "./utils";

export function serialize<T extends readonly SerializationExtension<any>[]>(
	obj: Serializable<ExtractExtensionTypes<T>>,
	extensions: T = [] as any,
): FormData {
	// Handle edge case: undefined object
	if (obj === undefined) {
		throw new Error("Cannot serialize undefined value");
	}

	_validateExtensions(extensions);
	const formData = new FormData();

	const holes: Record<string, Blob> = {};
	const extensionData: Record<string, any> = {};

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
