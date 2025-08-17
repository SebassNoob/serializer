export type PrimitiveSerializable =
	| string
	| Blob
	| number
	| boolean
	| null
	| Date
	| URL;

// Base types that can be serialized
type PrimitiveSerializableLiteral<T extends PrimitiveSerializable> =
	T extends string
		? "string"
		: T extends Blob
			? "Blob"
			: T extends number
				? "number"
				: T extends boolean
					? "boolean"
					: T extends null
						? "null"
						: T extends Date
							? "Date"
							: T extends URL
								? "URL"
								: never;

export type Serializable =
	| PrimitiveSerializable
	| Serializable[]
	| { [key: string]: Serializable };

type _RecursiveDepth = 10; // Limit recursion to 10 levels

// Type for array serializable literals with recursion depth limit
type ArraySerializableLiteralRecursive<
	T extends Serializable[],
	Depth extends readonly unknown[] = [],
> = Depth["length"] extends _RecursiveDepth
	? "array"
	: T extends (infer U extends Serializable)[]
		? U extends PrimitiveSerializable
			? `${SerializableLiteral<U, [...Depth, unknown]>}[]`
			: U extends Serializable[]
				? `${ArraySerializableLiteralRecursive<U, [...Depth, unknown]>}[]`
				: "array"
		: "array";

// Combined type that handles non-arrays, arrays, and objects
export type SerializableLiteral<
	T extends Serializable,
	Depth extends readonly unknown[] = [],
> = T extends PrimitiveSerializable
	? PrimitiveSerializableLiteral<T>
	: T extends Serializable[]
		? ArraySerializableLiteralRecursive<T, Depth>
		: T extends { [key: string]: Serializable }
			? "object"
			: never;

export type TypeKey<T extends Serializable> = `${string}:${SerializableLiteral<T>}`;

// Export TypeHandler interface for extensibility
export interface TypeHandler<T extends Serializable> {
	detect: (value: unknown) => boolean;
	getName: (type: T) => SerializableLiteral<T>;
	serialize: (key: string, value: T, formData: FormData) => void;
}
