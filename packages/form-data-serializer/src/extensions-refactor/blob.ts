import type { SerializationExtension } from "@/serialize-refactor";

export const BlobExtension: SerializationExtension<Blob, Blob> = {
	name: "blob",
	serialize: (value: Blob) => value,
	deserialize: (value) => value as Blob,
	canHandle: (value: unknown): value is Blob => value instanceof Blob,
};
