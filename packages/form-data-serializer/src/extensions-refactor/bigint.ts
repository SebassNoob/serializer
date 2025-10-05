import type { SerializationExtension } from "@/serialize-refactor";

/**
 * Extension for serializing and deserializing JavaScript BigInt values.
 *
 * This extension handles BigInt primitives by converting them to their string representation
 * during serialization and reconstructing them using the `BigInt()` constructor during deserialization.
 *
 * BigInt values can represent integers of arbitrary precision, making them useful for:
 * - Large integers that exceed `Number.MAX_SAFE_INTEGER`
 * - Financial calculations requiring exact precision
 * - Cryptographic operations
 * - Working with large IDs or timestamps
 *
 * @example Basic usage
 * ```typescript
 * import { serialize, deserialize } from 'form-data-serializer';
 * import { BigIntExtension } from 'form-data-serializer/extensions';
 *
 * const largeNumber = 123456789012345678901234567890n;
 * const data = {
 *   id: largeNumber,
 *   balance: 999999999999999999999n
 * };
 *
 * const formData = serialize(data, { extensions: [BigIntExtension] });
 * const restored = deserialize(formData, { extensions: [BigIntExtension] });
 *
 * console.log(typeof restored.id === 'bigint'); // true
 * console.log(restored.id === largeNumber); // true
 * console.log(restored.balance); // 999999999999999999999n
 * ```
 *
 * @example Working with large integers
 * ```typescript
 * const data = {
 *   maxSafeInteger: BigInt(Number.MAX_SAFE_INTEGER), // 9007199254740991n
 *   beyondMaxSafe: 9007199254740992n, // Unsafe as regular number
 *   veryLarge: 12345678901234567890123456789n,
 *   negative: -987654321098765432109876543210n
 * };
 *
 * const formData = serialize(data, { extensions: [BigIntExtension] });
 * const restored = deserialize(formData, { extensions: [BigIntExtension] });
 *
 * // All BigInt values are preserved exactly
 * console.log(restored.beyondMaxSafe > BigInt(Number.MAX_SAFE_INTEGER)); // true
 * console.log(restored.negative < 0n); // true
 * ```
 *
 * @example Financial calculations
 * ```typescript
 * // Working with precise monetary values (in cents)
 * const transaction = {
 *   amount: 123456789012345n, // $1,234,567,890,123.45
 *   fee: 250n, // $2.50
 *   timestamp: BigInt(Date.now()),
 *   accountId: 1234567890123456789n
 * };
 *
 * const formData = serialize(transaction, [BigIntExtension]);
 * const restored = deserialize(formData, [BigIntExtension]);
 *
 * // Perform exact arithmetic
 * const total = restored.amount + restored.fee;
 * console.log(total); // 123456789012595n (exact result)
 * ```
 *
 * @example Mixed with other numeric types
 * ```typescript
 * const mixedData = {
 *   regularNumber: 42,
 *   bigInteger: 42n,
 *   floatingPoint: 42.5,
 *   scientific: 1.23e-4
 * };
 *
 * const formData = serialize(mixedData, [BigIntExtension]);
 * const restored = deserialize(formData, [BigIntExtension]);
 *
 * console.log(typeof restored.regularNumber); // "number"
 * console.log(typeof restored.bigInteger); // "bigint"
 * console.log(restored.regularNumber === restored.bigInteger); // false (different types)
 * ```
 */
export const BigIntExtension: SerializationExtension<bigint> = {
	name: "bigint",
	serialize: (value: bigint) => value.toString(),
	deserialize: (value) => BigInt(value as string),
	canHandle: (value: unknown): value is bigint => typeof value === "bigint",
};
