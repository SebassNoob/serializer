/**
 * @fileOverview Pre-built extensions for the form-data serializer.
 *
 * This module provides ready-to-use extensions for common JavaScript types that are not
 * natively supported by JSON serialization. Each extension handles a specific data type
 * and provides seamless serialization/deserialization capabilities.
 *
 * @example Using individual extensions
 * ```typescript
 * import { serialize, deserialize } from 'form-data-serializer';
 * import { DateExtension, BigIntExtension } from 'form-data-serializer/extensions';
 *
 * const data = {
 *   timestamp: new Date(),
 *   largeNumber: 123456789012345678901234567890n
 * };
 *
 * const formData = serialize(data, [DateExtension, BigIntExtension]);
 * const restored = deserialize(formData, [DateExtension, BigIntExtension]);
 * ```
 *
 * @example Using all extensions
 * ```typescript
 * import { serialize, deserialize } from 'form-data-serializer';
 * import * as extensions from 'form-data-serializer/extensions';
 *
 * const allExtensions = Object.values(extensions);
 *
 * const complexData = {
 *   date: new Date(),
 *   error: new Error('Something went wrong'),
 *   bigNumber: 999999999999999999999n,
 *   symbol: Symbol('unique-key')
 * };
 *
 * const formData = serialize(complexData, allExtensions);
 * const restored = deserialize(formData, allExtensions);
 * ```
 */

/**
 * Extension for handling BigInt values.
 * Converts BigInt primitives to/from their string representation.
 *
 * @see {@link BigIntExtension} for detailed documentation and examples.
 */
export * from "./bigint";

/**
 * Extension for handling Date objects.
 * Converts Date objects to/from ISO 8601 strings.
 *
 * @see {@link DateExtension} for detailed documentation and examples.
 */
export * from "./date";

/**
 * Extension for handling Error objects.
 * Preserves error name, message, and stack trace.
 *
 * @see {@link ErrorExtension} for detailed documentation and examples.
 */
export * from "./error";

/**
 * Extension for handling Symbol values.
 * Converts Symbols to/from their string representation (note: identity is not preserved).
 *
 * @see {@link SymbolExtension} for detailed documentation and examples.
 */
export * from "./symbol";
