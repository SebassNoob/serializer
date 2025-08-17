import type {
	PrimitiveSerializable,
	Serializable,
	SerializableLiteral,
	TypeHandler,
} from "./types";

const StringTypeHandler: TypeHandler<string> = {
	detect: (value): value is string => typeof value === "string",
	getName: () => "string",
	serialize: (key, value, formData) => {
		formData.append(`${key}:string`, value);
	},
};

const NumberTypeHandler: TypeHandler<number> = {
	detect: (value): value is number => typeof value === "number",
	getName: () => "number",
	serialize: (key, value, formData) => {
		formData.append(`${key}:number`, value.toString());
	},
};

const BooleanTypeHandler: TypeHandler<boolean> = {
	detect: (value): value is boolean => typeof value === "boolean",
	getName: () => "boolean",
	serialize: (key, value, formData) => {
		formData.append(`${key}:boolean`, value.toString());
	},
};

const NullTypeHandler: TypeHandler<null> = {
	detect: (value): value is null => value === null,
	getName: () => "null",
	serialize: (key, _, formData) => {
		formData.append(`${key}:null`, "null");
	},
};

const BlobTypeHandler: TypeHandler<Blob> = {
	detect: (value): value is Blob => value instanceof Blob,
	getName: () => "Blob",
	serialize: (key, blob, formData) => {
		formData.append(`${key}:Blob`, blob, "name" in blob ? (blob.name as string) : "blob");
	},
};

const DateTypeHandler: TypeHandler<Date> = {
	detect: (value): value is Date => value instanceof Date,
	getName: () => "Date",
	serialize: (key, date, formData) => {
		formData.append(`${key}:Date`, date.toISOString());
	},
};

const URLTypeHandler: TypeHandler<URL> = {
	detect: (value): value is URL => value instanceof URL,
	getName: () => "URL",
	serialize: (key, url, formData) => {
		formData.append(`${key}:URL`, url.toString());
	},
};

const PrimitiveTypeHandlers: Record<
	SerializableLiteral<PrimitiveSerializable>,
	TypeHandler<any>
> = {
	string: StringTypeHandler,
	number: NumberTypeHandler,
	boolean: BooleanTypeHandler,
	null: NullTypeHandler,
	Blob: BlobTypeHandler,
	Date: DateTypeHandler,
	URL: URLTypeHandler,
};

const ArrayTypeHandler: TypeHandler<Serializable[]> = {
	detect: (value): value is Serializable[] => Array.isArray(value),
	getName: (type: Serializable[]) => {
		// Handle empty arrays
		if (type.length === 0) {
			return "array";
		}

		// Helper function to get the type name of a value, handling nested arrays
		const getTypeName = (value: any): string => {
			if (value === null) return "null";

			// Handle nested arrays recursively
			if (Array.isArray(value)) {
				if (value.length === 0) return "array";

				// Get types of all elements in the nested array
				const nestedTypes = value.reduce<Set<string>>((set, item) => {
					set.add(getTypeName(item));
					return set;
				}, new Set());

				// If all elements have the same type, append []
				if (nestedTypes.size === 1) {
					const nestedType = Array.from(nestedTypes)[0];
					if (nestedType && nestedType !== "array") {
						return `${nestedType}[]`;
					}
				}

				return "array";
			}

			// Check primitive types
			for (const [typeName, handler] of Object.entries(PrimitiveTypeHandlers)) {
				if (handler.detect(value)) {
					return typeName;
				}
			}

			return "array";
		};

		// Collect all unique type names in the array
		const typeNames = type.reduce<Set<string>>((set, item) => {
			set.add(getTypeName(item));
			return set;
		}, new Set());

		// If more than one unique type, return 'array'
		if (typeNames.size !== 1) {
			return "array";
		}

		// Get the single type name
		const firstElementType = Array.from(typeNames)[0];

		if (!firstElementType) {
			return "array";
		}

		// For primitive types, add [] suffix
		const allowedTypes = [
			"null",
			"string",
			"number",
			"boolean",
			"Blob",
			"Date",
			"URL",
		] as const;

		if (
			allowedTypes.includes(firstElementType as (typeof allowedTypes)[number])
		) {
			return `${firstElementType}[]` as const;
		}

		// For already nested array types (like string[]), add another [] suffix
		if (firstElementType.endsWith("[]")) {
			return `${firstElementType}[]` as any; // Type assertion needed for complex nested types
		}

		return "array";
	},
	serialize: (key, value, formData) => {
		// Add the array type info
		const arrayType = ArrayTypeHandler.getName(value);
		formData.append(`${key}:${arrayType}`, `[${value.length}]`);
		
		// Serialize individual elements recursively
		value.forEach((item, index) => {
			const itemKey = `${key}[${index}]`;
			
			// Check for primitive types first
			let handled = false;
			for (const typeHandler of Object.values(PrimitiveTypeHandlers)) {
				if (typeHandler.detect(item)) {
					typeHandler.serialize(itemKey, item, formData);
					handled = true;
					break;
				}
			}
			
			// Handle nested arrays recursively
			if (!handled && Array.isArray(item)) {
				ArrayTypeHandler.serialize(itemKey, item, formData);
				handled = true;
			}
			
			// Handle nested objects recursively
			if (!handled && typeof item === "object" && item !== null) {
				ObjectTypeHandler.serialize(itemKey, item as { [key: string]: Serializable }, formData);
				handled = true;
			}
			
			if (!handled) {
				throw new Error(`Unsupported type for array element at key "${itemKey}": ${typeof item}`);
			}
		});
	},
};

const ObjectTypeHandler: TypeHandler<{ [key: string]: Serializable }> = {
	detect: (value): value is { [key: string]: Serializable } => {
		return typeof value === "object" && value !== null && !Array.isArray(value);
	},
	getName: () => "object",
	serialize: (key, value: { [key: string]: Serializable }, formData) => {
		// Add the object type info
		formData.append(`${key}:object`, `{${Object.keys(value).length}}`);
		
		// Serialize individual properties recursively
		for (const [subKey, subValue] of Object.entries(value)) {
			const itemKey = `${key}[${subKey}]`;
			
			// Check for primitive types first
			let handled = false;
			for (const typeHandler of Object.values(PrimitiveTypeHandlers)) {
				if (typeHandler.detect(subValue)) {
					typeHandler.serialize(itemKey, subValue, formData);
					handled = true;
					break;
				}
			}
			
			// Handle nested arrays recursively
			if (!handled && Array.isArray(subValue)) {
				ArrayTypeHandler.serialize(itemKey, subValue, formData);
				handled = true;
			}
			
			// Handle nested objects recursively
			if (!handled && typeof subValue === "object" && subValue !== null) {
				ObjectTypeHandler.serialize(itemKey, subValue as { [key: string]: Serializable }, formData);
				handled = true;
			}
			
			if (!handled) {
				throw new Error(`Unsupported type for object property at key "${itemKey}": ${typeof subValue}`);
			}
		}
	},
};

export function serialize(data: Record<string, Serializable>): FormData {
	const formData = new FormData();
	for (const [key, value] of Object.entries(data)) {
		let handled = false;
		
		// Check primitive types first
		for (const typeHandler of Object.values(PrimitiveTypeHandlers)) {
			if (typeHandler.detect(value)) {
				typeHandler.serialize(key, value, formData);
				handled = true;
				break;
			}
		}
		
		// Check for arrays
		if (!handled && Array.isArray(value)) {
			ArrayTypeHandler.serialize(key, value, formData);
			handled = true;
		}
		
		// Check for objects
		if (!handled && typeof value === "object" && value !== null && !Array.isArray(value)) {
			ObjectTypeHandler.serialize(key, value as { [key: string]: Serializable }, formData);
			handled = true;
		}

		if (!handled) {
			throw new Error(`Unsupported type for key "${key}": ${typeof value}`);
		}
	}
	return formData;
}
