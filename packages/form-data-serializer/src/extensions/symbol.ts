import type { SerializationExtension } from "@/serialize";

export const SymbolExtension: SerializationExtension<symbol> = {
	name: "symbol",
	serialize: (value: symbol) => value.toString(),
	deserialize: (value) => Symbol(value as string),
	canHandle: (value: unknown): value is symbol => typeof value === "symbol",
};
