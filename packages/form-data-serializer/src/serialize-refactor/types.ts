/**
 * Represents the primitive types that can be directly serialized to JSON.
 * These are the basic building blocks of serializable data.
 *
 * @internal
 */
type JSONPrimitive = string | number | boolean | null;

/**
 * Recursive type representing all data structures that can be serialized.
 *
 * Supports:
 * - JSON primitives: `string`, `number`, `boolean`, `null`
 * - Binary data: `Blob`, `File`
 * - Custom types via extensions: `Date`, `RegExp`, Map, Set, etc.
 * - Nested objects with string keys
 * - Arrays of any serializable values
 *
 * @example Basic usage
 * ```typescript
 * const data: Serializable = {
 *   name: "John",
 *   age: 30,
 *   avatar: new Blob(["image data"]),
 *   tags: ["user", "admin"],
 *   nested: { value: true }
 * };
 * ```
 *
 * @example With custom extension types
 * ```typescript
 * // When using extensions, the type accepts those custom types
 * const data: Serializable = {
 *   created: new Date(),      // ✓ Date handled by extension
 *   pattern: /test/,          // ✓ RegExp handled by extension
 *   name: "example"           // ✓ Primitive
 * };
 * ```
 */
export type Serializable = JSONPrimitive | Blob | { [key: string]: Serializable } | Serializable[];

/**
 * Defines how custom types are serialized to and deserialized from FormData.
 *
 * Extensions enable the serializer to handle any JavaScript type (Date, RegExp, Map, Set, etc.)
 * by converting them to/from strings or Blobs.
 *
 * @typeParam T - The custom type this extension handles
 * @typeParam SerializedType - The serialized representation (`string` or `Blob`)
 *
 * @example Date extension (serializes to ISO string)
 * ```typescript
 * const dateExtension: SerializationExtension<Date, string> = {
 *   name: "date",
 *   canHandle: (value): value is Date => value instanceof Date,
 *   serialize: (date) => date.toISOString(),
 *   deserialize: (str) => new Date(str)
 * };
 * ```
 *
 * @example RegExp extension (serializes to Blob)
 * ```typescript
 * const regexpExtension: SerializationExtension<RegExp, Blob> = {
 *   name: "regexp",
 *   canHandle: (value): value is RegExp => value instanceof RegExp,
 *   serialize: (regexp) => new Blob([regexp.source + '\n' + regexp.flags]),
 *   deserialize: async (blob) => {
 *     const text = await blob.text();
 *     const [source, flags] = text.split('\n');
 *     return new RegExp(source, flags);
 *   }
 * };
 * ```
 *
 * @example Map extension (serializes to JSON string)
 * ```typescript
 * const mapExtension: SerializationExtension<Map<string, any>, string> = {
 *   name: "map",
 *   canHandle: (value): value is Map<string, any> => value instanceof Map,
 *   serialize: (map) => JSON.stringify(Array.from(map.entries())),
 *   deserialize: (str) => new Map(JSON.parse(str))
 * };
 * ```
 */
// biome-ignore lint/suspicious/noExplicitAny: unavoidable due to dynamic nature of extensions
export interface SerializationExtension<T = any, SerializedType = string | Blob> {
	/**
	 * Unique identifier for this extension.
	 *
	 * Used in FormData keys (e.g., `$ext:date:uuid`) to identify which extension
	 * serialized a value. Must be unique across all extensions.
	 */
	name: string;

	/**
	 * Type guard that determines if this extension can handle a value.
	 *
	 * @param value - The value to check
	 * @returns `true` if this extension can handle the value
	 */
	canHandle: (value: unknown) => value is T;

	/**
	 * Converts a value into a storable format for FormData.
	 *
	 * @param value - The value to serialize
	 * @returns A `string` (stored as JSON) or `Blob` (stored directly)
	 */
	serialize: (value: T) => SerializedType;

	/**
	 * Reconstructs the original value from its serialized form.
	 *
	 * @param value - The serialized data from FormData
	 * @returns The reconstructed original value
	 */
	deserialize: (value: SerializedType) => T;
}

/**
 * Configuration options for serialize/deserialize operations.
 *
 * @example Basic configuration with extensions
 * ```typescript
 * const config: SerializeConfig = {
 *   extensions: [dateExtension, regexpExtension]
 * };
 *
 * serialize(data, config);
 * deserialize(formData, config);
 * ```
 *
 * @example Custom reference prefixes
 * ```typescript
 * const config: SerializeConfig = {
 *   referencePrefix: {
 *     data: "main",           // Use "main" instead of "$data"
 *     extension: "@ref"       // Use "@ref:" instead of "$ext:"
 *   }
 * };
 * ```
 *
 * @example Custom ID generation
 * ```typescript
 * let counter = 0;
 * const config: SerializeConfig = {
 *   generateDataId: () => `id-${counter++}`
 * };
 * ```
 */
export interface SerializeConfig {
	/**
	 * Array of extensions to handle custom types.
	 *
	 * Note: `BlobExtension` is automatically included and doesn't need to be added.
	 *
	 * @default []
	 */
	extensions?: readonly SerializationExtension<any>[];

	/**
	 * Custom prefixes for FormData keys.
	 *
	 * @default { data: "$data", extension: "$ext" }
	 */
	referencePrefix?: {
		/** Key for the main data structure (default: `"$data"`) */
		data?: string;
		/** Prefix for extension references (default: `"$ext"`) */
		extension?: string;
	};

	/**
	 * Custom function to generate unique IDs for extension data.
	 *
	 * @param item - The serialized value
	 * @returns A unique string identifier
	 * @default UUID v7 generation
	 */
	generateDataId?: (item: Serializable) => string;
}
