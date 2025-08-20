import type { SerializationExtension } from "@/serialize";

export const ErrorExtension: SerializationExtension<Error> = {
	name: "error",
	serialize: (value: Error) =>
		JSON.stringify({
			name: value.name,
			message: value.message,
			stack: value.stack,
		}),
	deserialize: (value: string | Blob) => {
		const parsed = JSON.parse(value as string);
		const error = new Error(parsed.message);
		error.name = parsed.name;
		error.stack = parsed.stack;
		return error;
	},
	canHandle: (value: unknown): value is Error => value instanceof Error,
};
