import type { SerializationExtension } from "@/serialize";

export const BigIntExtension: SerializationExtension<bigint> = {
	name: "bigint",
	serialize: (value: bigint) => value.toString(),
	deserialize: (value) => BigInt(value as string),
	canHandle: (value: unknown): value is bigint => typeof value === "bigint",
};
