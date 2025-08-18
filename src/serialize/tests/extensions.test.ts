import { beforeEach, describe, expect, test } from "bun:test";
import { faker } from "@faker-js/faker";
import { deserialize } from "../deserialize";
import { serialize } from "../serialize";
import type { MockComplexType } from "./mocks";
import {
	MockPerson,
	mockArrayBufferExtension,
	mockBigIntExtension,
	mockBinaryDataExtension,
	mockComplexExtension,
	mockDateExtension,
	mockDuplicateExtensions,
	mockEmptyExtension,
	mockErrorExtension,
	mockErrorProneExtension,
	mockFirstDateExtension,
	mockImageDataExtension,
	mockInvalidExtensions,
	mockMapExtension,
	mockNullableExtension,
	mockPersonExtension,
	mockRegExpExtension,
	mockSecondDateExtension,
	mockSetExtension,
	mockSymbolExtension,
	mockUrlExtension,
} from "./mocks";

describe("Extensions System", () => {
	beforeEach(() => {
		faker.seed(123);
	});

	describe("String-returning extensions", () => {
		test("should handle Date extension (built-in)", () => {
			const date = faker.date.recent();

			const serialized = serialize(date, [mockDateExtension]);
			const deserialized = deserialize(serialized, [mockDateExtension]) as Date;

			expect(deserialized).toBeInstanceOf(Date);
			expect(deserialized.getTime()).toBe(date.getTime());
		});

		test("should handle BigInt extension (built-in)", () => {
			const bigInt = BigInt(faker.number.bigInt());

			const serialized = serialize(bigInt, [mockBigIntExtension]);
			const deserialized = deserialize(serialized, [mockBigIntExtension]);

			expect(typeof deserialized).toBe("bigint");
			expect(deserialized).toBe(bigInt);
		});

		test("should handle custom Set extension", () => {
			const originalSet = new Set([faker.lorem.word(), faker.lorem.word(), faker.lorem.word()]);

			const serialized = serialize(originalSet, [mockSetExtension]);
			const deserialized = deserialize(serialized, [mockSetExtension]) as Set<string>;

			expect(deserialized).toBeInstanceOf(Set);
			expect(deserialized.size).toBe(originalSet.size);
			expect([...deserialized]).toEqual(expect.arrayContaining([...originalSet]));
		});

		test("should handle custom Map extension", () => {
			const originalMap = new Map([
				[faker.lorem.word(), faker.number.int()],
				[faker.lorem.word(), faker.number.int()],
				[faker.lorem.word(), faker.number.int()],
			]);

			const serialized = serialize(originalMap, [mockMapExtension]);
			const deserialized = deserialize(serialized, [mockMapExtension]) as Map<string, number>;

			expect(deserialized).toBeInstanceOf(Map);
			expect(deserialized.size).toBe(originalMap.size);
			for (const [key, value] of originalMap) {
				expect(deserialized.get(key)).toBe(value);
			}
		});

		test("should handle RegExp extension", () => {
			const originalRegex = new RegExp(faker.lorem.word(), "gi");

			const serialized = serialize(originalRegex, [mockRegExpExtension]);
			const deserialized = deserialize(serialized, [mockRegExpExtension]) as RegExp;

			expect(deserialized).toBeInstanceOf(RegExp);
			expect(deserialized.source).toBe(originalRegex.source);
			expect(deserialized.flags).toBe(originalRegex.flags);
			expect(deserialized.toString()).toBe(originalRegex.toString());
		});

		test("should handle URL extension", () => {
			const originalUrl = new URL(faker.internet.url());

			const serialized = serialize(originalUrl, [mockUrlExtension]);
			const deserialized = deserialize(serialized, [mockUrlExtension]) as URL;

			expect(deserialized).toBeInstanceOf(URL);
			expect(deserialized.href).toBe(originalUrl.href);
		});
	});

	describe("Blob-returning extensions", () => {
		test("should handle ImageData-like extension that returns Blob", () => {
			interface MockImageData {
				width: number;
				height: number;
				data: Uint8Array;
			}

			const originalImageData: MockImageData = {
				width: faker.number.int({ min: 100, max: 500 }),
				height: faker.number.int({ min: 100, max: 500 }),
				data: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
			};

			// This test demonstrates the limitation - Blob-returning extensions
			// can't be deserialized synchronously with the current implementation
			const serialized = serialize(originalImageData, [mockImageDataExtension]);
			expect(() => deserialize(serialized, [mockImageDataExtension])).toThrow(
				"Cannot read Blob synchronously",
			);
		});

		test("should handle ArrayBuffer extension that returns Blob", () => {
			const originalBuffer = new ArrayBuffer(16);
			const view = new Uint8Array(originalBuffer);
			view.set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

			const serialized = serialize(originalBuffer, [mockArrayBufferExtension]);
			// This demonstrates the limitation with Blob-returning extensions
			expect(() => deserialize(serialized, [mockArrayBufferExtension])).toThrow(
				"Cannot read Blob synchronously",
			);
		});

		test("should handle binary data extension with Blob serialization", () => {
			interface BinaryData {
				type: "binary";
				content: Uint8Array;
				metadata: { name: string; size: number };
			}

			const originalData: BinaryData = {
				type: "binary",
				content: new Uint8Array([255, 128, 64, 32, 16, 8, 4, 2, 1]),
				metadata: {
					name: faker.system.fileName(),
					size: 9,
				},
			};

			const serialized = serialize(originalData, [mockBinaryDataExtension]);
			// This demonstrates the limitation with Blob-returning extensions
			expect(() => deserialize(serialized, [mockBinaryDataExtension])).toThrow(
				"Cannot read Blob synchronously",
			);
		});
	});

	describe("Extension priority and conflicts", () => {
		test("should handle extension priority (first extension wins)", () => {
			const date = faker.date.recent();

			// First extension should win
			const serialized = serialize(date, [mockFirstDateExtension, mockSecondDateExtension]);
			const formDataEntries = Array.from(serialized.entries());
			const extEntry = formDataEntries.find(([key]) => key.startsWith("$ext:"));

			expect(extEntry?.[0]).toMatch(/^\$ext:first-date:/);
			expect(JSON.parse(extEntry?.[1] as string)).toMatch(/^FIRST:/);

			const deserialized = deserialize(serialized, [
				mockFirstDateExtension,
				mockSecondDateExtension,
			]) as Date;
			expect(deserialized.getTime()).toBe(date.getTime());
		});

		test("should handle multiple different extension types in same object", () => {
			const complexObj = {
				timestamp: faker.date.recent(),
				id: BigInt(faker.number.bigInt()),
				type: Symbol.for("test-type"),
				metadata: {
					created: faker.date.past(),
					count: BigInt(123),
				},
			};

			const serialized = serialize(complexObj, [
				mockDateExtension,
				mockBigIntExtension,
				mockSymbolExtension,
			]);
			const deserialized = deserialize(serialized, [
				mockDateExtension,
				mockBigIntExtension,
				mockSymbolExtension,
			]) as typeof complexObj;

			expect(deserialized.timestamp).toBeInstanceOf(Date);
			expect(deserialized.timestamp.getTime()).toBe(complexObj.timestamp.getTime());
			expect(typeof deserialized.id).toBe("bigint");
			expect(deserialized.id).toBe(complexObj.id);
			expect(typeof deserialized.type).toBe("symbol");
			expect(deserialized.type.toString()).toBe(complexObj.type.toString());
			expect(deserialized.metadata.created).toBeInstanceOf(Date);
			expect(typeof deserialized.metadata.count).toBe("bigint");
		});
	});

	describe("Extension edge cases", () => {
		test("should handle extension with empty string serialization", () => {
			const obj = { isEmpty: true as const };

			const serialized = serialize(obj, [mockEmptyExtension]);
			const deserialized = deserialize(serialized, [mockEmptyExtension]);

			expect(deserialized).toEqual({ isEmpty: true });
		});

		test("should handle extension with null/undefined in object", () => {
			const objWithNull = { value: null as null | Date };
			const objWithDate = { value: faker.date.recent() };

			// Test null case
			const serializedNull = serialize(objWithNull, [mockNullableExtension]);
			const deserializedNull = deserialize(serializedNull, [mockNullableExtension]) as {
				value: null | Date;
			};
			expect(deserializedNull.value).toBeNull();

			// Test Date case
			const serializedDate = serialize(objWithDate, [mockNullableExtension]);
			const deserializedDate = deserialize(serializedDate, [mockNullableExtension]) as {
				value: null | Date;
			};
			expect(deserializedDate.value).toBeInstanceOf(Date);
			expect((deserializedDate.value as Date).getTime()).toBe(objWithDate.value.getTime());
		});

		test("should handle extension with complex nested types", () => {
			const complexObj: MockComplexType = {
				id: faker.string.uuid(),
				children: [{ id: faker.string.uuid(), children: [], parent: undefined }],
				parent: { id: faker.string.uuid(), children: [], parent: undefined },
			};

			const serialized = serialize(complexObj, [mockComplexExtension]);
			const deserialized = deserialize(serialized, [mockComplexExtension]) as MockComplexType;

			expect(deserialized.id).toBe(complexObj.id);
			expect(deserialized.children).toHaveLength(1);
			expect(deserialized.parent).toBeDefined();
			expect(deserialized.parent?.id).toBe(complexObj.parent?.id);
		});

		test("should handle extension serialization errors gracefully", () => {
			const obj = { shouldError: true as const };

			expect(() => serialize(obj, [mockErrorProneExtension])).toThrow("Serialization failed");
		});

		test("should validate extension names and throw appropriate errors", () => {
			mockInvalidExtensions.forEach((ext) => {
				expect(() => serialize({}, [ext as any])).toThrow();
			});
		});

		test("should handle duplicate extension names", () => {
			expect(() => serialize({}, mockDuplicateExtensions as any)).toThrow(
				"Duplicate extension name found: 'duplicate'",
			);
		});
	});

	describe("Real-world extension examples", () => {
		test("should handle Error extension for error serialization", () => {
			const originalError = new Error(faker.lorem.sentence());
			originalError.name = "CustomError";

			const serialized = serialize(originalError, [mockErrorExtension]);
			const deserialized = deserialize(serialized, [mockErrorExtension]) as Error;

			expect(deserialized).toBeInstanceOf(Error);
			expect(deserialized.message).toBe(originalError.message);
			expect(deserialized.name).toBe(originalError.name);
			if (originalError.stack) {
				expect(deserialized.stack).toBe(originalError.stack);
			}
		});

		test("should handle custom class instances", () => {
			const originalPerson = new MockPerson(
				faker.person.fullName(),
				faker.number.int({ min: 18, max: 80 }),
				faker.internet.email(),
			);

			const serialized = serialize(originalPerson, [mockPersonExtension]);
			const deserialized = deserialize(serialized, [mockPersonExtension]) as MockPerson;

			expect(deserialized).toBeInstanceOf(MockPerson);
			expect(deserialized.name).toBe(originalPerson.name);
			expect(deserialized.age).toBe(originalPerson.age);
			expect(deserialized.email).toBe(originalPerson.email);
			expect(deserialized.greet()).toBe(`Hello, I'm ${originalPerson.name}`);
		});
	});
});
