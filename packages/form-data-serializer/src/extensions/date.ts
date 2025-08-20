import type { SerializationExtension } from "@/serialize";

export const DateExtension: SerializationExtension<Date> = {
	name: "date",
	serialize: (value: Date) => value.toISOString(),
	deserialize: (value) => new Date(value as string),
	canHandle: (value: unknown): value is Date => value instanceof Date,
};
