import type { SerializationExtension } from "@/serialize";

/**
 * Extension for serializing and deserializing JavaScript Error objects.
 * 
 * This extension handles all Error types including native Error, TypeError, ReferenceError,
 * and custom error classes. It preserves the error's name, message, and stack trace
 * during serialization.
 * 
 * The Error is serialized as a JSON string containing:
 * - `name`: The error's constructor name (e.g., "Error", "TypeError")
 * - `message`: The error message
 * - `stack`: The full stack trace (if available)
 * 
 * @example Basic usage
 * ```typescript
 * import { serialize, deserialize } from 'form-data-serializer';
 * import { ErrorExtension } from 'form-data-serializer/extensions';
 * 
 * const error = new Error("Something went wrong");
 * error.stack = "Error: Something went wrong\n    at example.js:1:1";
 * 
 * const data = { error };
 * const formData = serialize(data, [ErrorExtension]);
 * const restored = deserialize(formData, [ErrorExtension]);
 * 
 * console.log(restored.error instanceof Error); // true
 * console.log(restored.error.message); // "Something went wrong"
 * console.log(restored.error.stack); // Full stack trace preserved
 * ```
 * 
 * @example With custom error types
 * ```typescript
 * class ValidationError extends Error {
 *   constructor(message: string) {
 *     super(message);
 *     this.name = "ValidationError";
 *   }
 * }
 * 
 * const customError = new ValidationError("Invalid input");
 * const data = { error: customError };
 * 
 * const formData = serialize(data, [ErrorExtension]);
 * const restored = deserialize(formData, [ErrorExtension]);
 * 
 * console.log(restored.error.name); // "ValidationError"
 * console.log(restored.error.message); // "Invalid input"
 * ```
 * 
 * @example Handling different error types
 * ```typescript
 * const errors = {
 *   generic: new Error("Generic error"),
 *   type: new TypeError("Type error"),
 *   reference: new ReferenceError("Reference error"),
 *   syntax: new SyntaxError("Syntax error")
 * };
 * 
 * const formData = serialize(errors, [ErrorExtension]);
 * const restored = deserialize(formData, [ErrorExtension]);
 * 
 * // All error types are preserved with their correct names
 * console.log(restored.type instanceof Error); // true
 * console.log(restored.type.name); // "TypeError"
 * ```
 */
export const ErrorExtension: SerializationExtension<Error> = {
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
