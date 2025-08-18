import type { SerializationExtension } from "..";

export const dateExtension: SerializationExtension<Date> = {
	name: "date",
	serialize: (value: Date) => value.toISOString(),
	deserialize: (value) => new Date(value as string),
	canHandle: (value: unknown): value is Date => value instanceof Date,
};

export const bigIntExtension: SerializationExtension<BigInt> = {
	name: "bigint",
	serialize: (value: BigInt) => value.toString(),
	deserialize: (value) => BigInt(value as string),
	canHandle: (value: unknown): value is BigInt => typeof value === "bigint",
};
