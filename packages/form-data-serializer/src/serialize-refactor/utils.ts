import type { SerializationExtension } from "./types";

// biome-ignore lint/suspicious/noExplicitAny: unavoidable due to dynamic nature of extensions
export function _validateExtensions<T extends readonly SerializationExtension<T>[]>(
	extensions: T,
): void {
	const seenNames = new Set<string>();

	for (const extension of extensions) {
		// Check for colon in extension name
		if (extension.name.includes(":")) {
			throw new Error(`Extension name '${extension.name}' cannot contain colon (:) character`);
		}

		// Check for empty or whitespace-only names
		if (!extension.name.trim()) {
			throw new Error("Extension name cannot be empty or whitespace-only");
		}

		// Check for reserved prefixes that could conflict with internal keys
		if (/^(\$|ref|ext)/.test(extension.name)) {
			throw new Error(
				`Extension name '${extension.name}' cannot start with reserved prefixes: $, ref, or ext`,
			);
		}
		// Check for duplicate extension names
		if (seenNames.has(extension.name)) {
			throw new Error(`Duplicate extension name found: '${extension.name}'`);
		}

		seenNames.add(extension.name);
	}
}
