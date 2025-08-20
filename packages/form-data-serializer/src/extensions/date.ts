import type { SerializationExtension } from "@/serialize";

/**
 * Extension for serializing and deserializing JavaScript Date objects.
 *
 * This extension converts Date objects to ISO 8601 strings for serialization,
 * preserving the exact timestamp including timezone information. During deserialization,
 * the ISO string is converted back to a Date object.
 *
 * The serialization uses `Date.prototype.toISOString()` which produces strings in the
 * format: `YYYY-MM-DDTHH:mm:ss.sssZ` (always in UTC).
 *
 * @example Basic usage
 * ```typescript
 * import { serialize, deserialize } from 'form-data-serializer';
 * import { DateExtension } from 'form-data-serializer/extensions';
 *
 * const originalDate = new Date('2023-12-25T15:30:00.000Z');
 * const data = {
 *   created: originalDate,
 *   updated: new Date()
 * };
 *
 * const formData = serialize(data, [DateExtension]);
 * const restored = deserialize(formData, [DateExtension]);
 *
 * console.log(restored.created instanceof Date); // true
 * console.log(restored.created.getTime() === originalDate.getTime()); // true
 * ```
 *
 * @example With complex nested structures
 * ```typescript
 * const eventData = {
 *   event: "user_login",
 *   timestamps: {
 *     created: new Date('2023-01-01T00:00:00.000Z'),
 *     lastModified: new Date('2023-06-15T14:30:00.000Z'),
 *     expires: new Date('2024-01-01T00:00:00.000Z')
 *   },
 *   history: [
 *     { action: "signup", date: new Date('2023-01-01T10:00:00.000Z') },
 *     { action: "login", date: new Date('2023-06-15T14:25:00.000Z') }
 *   ]
 * };
 *
 * const formData = serialize(eventData, [DateExtension]);
 * const restored = deserialize(formData, [DateExtension]);
 *
 * // All Date objects are preserved throughout the nested structure
 * console.log(restored.timestamps.created instanceof Date); // true
 * console.log(restored.history[0].date instanceof Date); // true
 * ```
 *
 * @example Timezone preservation
 * ```typescript
 * // Create dates with different timezone contexts
 * const utcDate = new Date('2023-12-25T15:30:00.000Z');
 * const localDate = new Date('2023-12-25T15:30:00'); // Local timezone
 *
 * const data = { utc: utcDate, local: localDate };
 * const formData = serialize(data, [DateExtension]);
 * const restored = deserialize(formData, [DateExtension]);
 *
 * // The exact timestamps are preserved
 * console.log(restored.utc.toISOString()); // "2023-12-25T15:30:00.000Z"
 * console.log(restored.local.getTime() === localDate.getTime()); // true
 * ```
 */
export const DateExtension: SerializationExtension<Date> = {
	name: "date",
	serialize: (value: Date) => value.toISOString(),
	deserialize: (value) => new Date(value as string),
	canHandle: (value: unknown): value is Date => value instanceof Date,
};
