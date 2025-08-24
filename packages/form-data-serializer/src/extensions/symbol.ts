import type { SerializationExtension } from "@/serialize";

/**
 * Extension for serializing and deserializing JavaScript Symbol values.
 *
 * This extension handles Symbol primitives by converting them to their string representation
 * using `Symbol.prototype.toString()` during serialization, and creating new symbols with
 * the same description during deserialization.
 *
 * **Important Note**: Symbols are unique by nature, so deserialized symbols will be new symbols
 * with the same description but different identity. This means `===` comparisons will fail
 * between original and deserialized symbols, but they will have the same string representation.
 *
 * Use cases for serializing symbols include:
 * - Preserving symbolic descriptions in data structures
 * - Maintaining object property keys that use symbols
 * - Debugging and logging symbol-based code
 *
 * @example Basic usage
 * ```typescript
 * import { serialize, deserialize } from 'form-data-serializer';
 * import { SymbolExtension } from 'form-data-serializer/extensions';
 *
 * const originalSymbol = Symbol('unique-identifier');
 * const data = { key: originalSymbol };
 *
 * const formData = serialize(data, [SymbolExtension]);
 * const restored = deserialize(formData, [SymbolExtension]);
 *
 * console.log(typeof restored.key === 'symbol'); // true
 * console.log(restored.key.toString()); // "Symbol(unique-identifier)"
 * console.log(restored.key === originalSymbol); // false (different identity)
 * console.log(restored.key.description); // "unique-identifier"
 * ```
 *
 * @example Working with symbol descriptions
 * ```typescript
 * const symbols = {
 *   withDescription: Symbol('my-symbol'),
 *   withoutDescription: Symbol(),
 *   emptyDescription: Symbol(''),
 *   longDescription: Symbol('a-very-long-symbol-description-with-details')
 * };
 *
 * const formData = serialize(symbols, [SymbolExtension]);
 * const restored = deserialize(formData, [SymbolExtension]);
 *
 * console.log(restored.withDescription.description); // "my-symbol"
 * console.log(restored.withoutDescription.description); // undefined
 * console.log(restored.emptyDescription.description); // ""
 * console.log(restored.longDescription.toString()); // "Symbol(a-very-long-symbol-description-with-details)"
 * ```
 *
 * @example Symbols in object structures
 * ```typescript
 * const metadata = {
 *   type: Symbol('user-type'),
 *   permissions: [Symbol('read'), Symbol('write'), Symbol('admin')],
 *   config: {
 *     primaryKey: Symbol('primary'),
 *     foreignKey: Symbol('foreign')
 *   }
 * };
 *
 * const formData = serialize(metadata, [SymbolExtension]);
 * const restored = deserialize(formData, [SymbolExtension]);
 *
 * // All symbols are recreated with their descriptions
 * console.log(restored.permissions.map(s => s.description)); // ["read", "write", "admin"]
 * console.log(restored.config.primaryKey.toString()); // "Symbol(primary)"
 * ```
 *
 * @example Debugging and logging use case
 * ```typescript
 * const debugInfo = {
 *   operation: Symbol('database-query'),
 *   traceId: Symbol(`trace-${Date.now()}`),
 *   context: Symbol('user-authentication'),
 *   metadata: {
 *     level: Symbol('info'),
 *     component: Symbol('auth-service')
 *   }
 * };
 *
 * const formData = serialize(debugInfo, [SymbolExtension]);
 * const restored = deserialize(formData, [SymbolExtension]);
 *
 * // Useful for logging systems that need to preserve symbolic information
 * console.log(`Operation: ${restored.operation.toString()}`);
 * console.log(`Trace ID: ${restored.traceId.description}`);
 * ```
 *
 * @example Limitations and considerations
 * ```typescript
 * const original = Symbol('test');
 * const data = { sym: original };
 *
 * const formData = serialize(data, [SymbolExtension]);
 * const restored = deserialize(formData, [SymbolExtension]);
 *
 * // Identity is not preserved
 * console.log(restored.sym === original); // false
 *
 * // But description and string representation are preserved
 * console.log(restored.sym.description === original.description); // true
 * console.log(restored.sym.toString() === original.toString()); // true
 *
 * // Well-known symbols are NOT preserved as the same symbol
 * const iteratorData = { iter: Symbol.iterator };
 * const iteratorFormData = serialize(iteratorData, [SymbolExtension]);
 * const restoredIterator = deserialize(iteratorFormData, [SymbolExtension]);
 * console.log(restoredIterator.iter === Symbol.iterator); // false
 * ```
 */
export const SymbolExtension: SerializationExtension<symbol> = {
	name: "symbol",
	serialize: (value: symbol) => value.description?.toString() ?? "",
	deserialize: (value) => Symbol(value as string),
	canHandle: (value: unknown): value is symbol => typeof value === "symbol",
};
