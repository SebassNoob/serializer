/**
 * @fileOverview 
 * This module provides ready-to-use extensions for common JavaScript types that are not
 * natively supported by JSON serialization. Each extension handles a specific data type
 * and provides seamless serialization/deserialization capabilities.
 * 
 * @module form-data-serializer/extensions
 *
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
