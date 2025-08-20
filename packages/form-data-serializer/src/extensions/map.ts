import type { SerializationExtension } from "@/serialize";

export const MapExtension: SerializationExtension<Map<string, number>> = {
  name: "map",
  serialize: (value: Map<string, number>) =>
    JSON.stringify([...value.entries()]),
  deserialize: (value: string | Blob) => new Map(JSON.parse(value as string)),
  canHandle: (value: unknown): value is Map<string, number> =>
    value instanceof Map,
};