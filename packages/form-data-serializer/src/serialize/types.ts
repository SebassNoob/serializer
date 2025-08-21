/**
 * Represents the primitive types that can be directly serialized to JSON.
 * These are the basic building blocks of serializable data.
 */
type JSONPrimitive = string | number | boolean | null;

/**
 * Base types that can be serialized, including JSON primitives, Blob objects, and custom extension types.
 *
 * @typeParam ExtensionType - The type of custom objects that can be handled by extensions
 */
type BaseSerializable<ExtensionType = never> = JSONPrimitive | Blob | ExtensionType;

/**
 * Recursive type representing all data structures that can be serialized.
 * This includes primitives, objects, arrays, and any combination thereof.
 *
 * The type supports:
 * - JSON primitives (string, number, boolean, null)
 * - Blob objects (files, binary data)
 * - Custom extension types
 * - Nested objects with string keys
 * - Arrays of serializable values
 *
 * @typeParam ExtensionType - The union type of all custom objects that can be handled by extensions.
 *   Defaults to `never` when no extensions are used.
 *
 * @example Basic usage without extensions
 * ```typescript
 * type MyData = Serializable; // string | number | boolean | null | Blob | { [key: string]: Serializable } | Serializable[]
 *
 * const data: MyData = {
 *   name: "John",
 *   age: 30,
 *   avatar: new Blob(["image data"]),
 *   tags: ["user", "admin"],
 *   nested: {
 *     value: true
 *   }
 * };
 * ```
 *
 * @example With custom extension types
 * ```typescript
 * type MyData = Serializable<Date | RegExp>;
 *
 * const data: MyData = {
 *   created: new Date(), // Date is handled by extension
 *   pattern: /test/, // RegExp is handled by extension
 *   name: "example"
 * };
 * ```
 *
 * @internal
 */
export type Serializable<ExtensionType = never> =
	| BaseSerializable<ExtensionType>
	| { [key: string]: Serializable<ExtensionType> }
	| Serializable<ExtensionType>[];

/**
 * Interface defining how custom types are serialized and deserialized.
 *
 * Extensions allow the serializer to handle custom JavaScript types (like Date, RegExp, etc.)
 * by converting them to/from strings or Blobs that can be stored in FormData.
 *
 * @typeParam T - The type of value this extension can handle
 *
 * @example Date extension
 * ```typescript
 * const dateExtension: SerializationExtension<Date> = {
 *   name: "date",
 *   canHandle: (value): value is Date => value instanceof Date,
 *   serialize: (date) => date.toISOString(),
 *   deserialize: (str) => new Date(str as string)
 * };
 * ```
 *
 * @example RegExp extension with Blob output
 * ```typescript
 * const regexpExtension: SerializationExtension<RegExp> = {
 *   name: "regexp",
 *   canHandle: (value): value is RegExp => value instanceof RegExp,
 *   serialize: (regexp) => new Blob([regexp.source, regexp.flags]),
 *   deserialize: (blob) => {
 *     const text = await (blob as Blob).text();
 *     const [source, flags] = text.split('\n');
 *     return new RegExp(source, flags);
 *   }
 * };
 * ```
 */
// biome-ignore lint/suspicious/noExplicitAny: unavoidable due to dynamic nature of extensions
export interface SerializationExtension<T = any> {
	/**
	 * Unique identifier for this extension.
	 * Used in the FormData keys to identify which extension serialized a value.
	 *
	 */
	name: string;

	/**
	 * Converts a value of type T into a string or Blob for storage in FormData.
	 *
	 * @param value - The value to serialize
	 * @returns A string (stored as JSON in FormData) or Blob (stored directly in FormData)
	 *
	 */
	serialize: (value: T) => string | Blob;

	/**
	 * Reconstructs a value of type T from its serialized form.
	 *
	 * @param value - The serialized data (string or Blob) from FormData
	 * @returns The reconstructed original value
	 *
	 */
	deserialize: (value: string | Blob) => T;

	/**
	 * Type guard function that determines if a value can be handled by this extension.
	 *
	 * @param value - The value to check
	 * @returns True if this extension can handle the value, false otherwise
	 *
	 */
	canHandle: (value: unknown) => value is T;
}

/**
 * Utility type that extracts all the types that can be handled by an array of extensions.
 *
 * This type is used internally to determine what custom types are supported
 * when a specific set of extensions is provided to the serialize/deserialize functions.
 *
 * @typeParam T - Array of SerializationExtension objects
 *
 * @example
 * ```typescript
 * const extensions = [dateExtension, regexpExtension] as const;
 * type HandledTypes = ExtractExtensionTypes<typeof extensions>; // Date | RegExp
 *
 * // This means Serializable<HandledTypes> can contain Date and RegExp objects
 * type MySerializableData = Serializable<HandledTypes>;
 * ```
 *
 * @example Usage in function signatures
 * ```typescript
 * function mySerialize<T extends readonly SerializationExtension<any>[]>(
 *   data: Serializable<ExtractExtensionTypes<T>>,
 *   extensions: T
 * ) {
 *   // TypeScript knows that 'data' can contain types handled by the extensions
 * }
 * ```
 *
 * @internal
 */
// biome-ignore lint/suspicious/noExplicitAny: unavoidable due to dynamic nature of extensions
export type ExtractExtensionTypes<T extends readonly SerializationExtension<any>[]> =
	T extends readonly (infer U)[] ? (U extends SerializationExtension<infer V> ? V : never) : never;
