import { beforeEach, describe, expect, test } from "bun:test";
import { faker } from "@faker-js/faker";
import { bigIntExtension, dateExtension } from "../../extensions/extensions";
import { DATA_KEY } from "../constants";
import { serialize } from "../serialize";
import type { SerializationExtension } from "../types";

describe("serialize", () => {
	beforeEach(() => {
		// Reset faker seed for consistent tests
		faker.seed(123);
	});

	describe("primitive values", () => {
		test("should serialize string", () => {
			const str = faker.lorem.sentence();
			const result = serialize(str);

			expect(result).toBeInstanceOf(FormData);
			expect(result.get(DATA_KEY)).toBe(JSON.stringify(str));
			expect(result.getAll(DATA_KEY)).toHaveLength(1);
		});

		test("should serialize number", () => {
			const num = faker.number.float();
			const result = serialize(num);

			expect(result.get(DATA_KEY)).toBe(JSON.stringify(num));
		});

		test("should serialize integer", () => {
			const int = faker.number.int();
			const result = serialize(int);

			expect(result.get(DATA_KEY)).toBe(JSON.stringify(int));
		});

		test("should serialize boolean true", () => {
			const result = serialize(true);
			expect(result.get(DATA_KEY)).toBe(JSON.stringify(true));
		});

		test("should serialize boolean false", () => {
			const result = serialize(false);
			expect(result.get(DATA_KEY)).toBe(JSON.stringify(false));
		});

		test("should serialize null", () => {
			const result = serialize(null);
			expect(result.get(DATA_KEY)).toBe(JSON.stringify(null));
		});

		test("should throw error for undefined", () => {
			expect(() => serialize(undefined as any)).toThrow(
				"Cannot serialize undefined value",
			);
		});
	});

	describe("objects", () => {
		test("should serialize simple object", () => {
			const obj = {
				name: faker.person.fullName(),
				age: faker.number.int({ min: 18, max: 80 }),
				active: faker.datatype.boolean(),
			};

			const result = serialize(obj);
			expect(result.get(DATA_KEY)).toBe(JSON.stringify(obj));
		});

		test("should serialize nested object", () => {
			const obj = {
				user: {
					profile: {
						name: faker.person.fullName(),
						email: faker.internet.email(),
					},
					settings: {
						theme: faker.color.human(),
						notifications: faker.datatype.boolean(),
					},
				},
				timestamp: faker.number.int(),
			};

			const result = serialize(obj);
			expect(result.get(DATA_KEY)).toBe(JSON.stringify(obj));
		});

		test("should handle object with undefined values (should be omitted)", () => {
			const obj = {
				name: faker.person.fullName(),
				age: undefined,
				email: faker.internet.email(),
			};

			const expected = {
				name: obj.name,
				email: obj.email,
			};

			const result = serialize(obj as any);
			expect(result.get(DATA_KEY)).toBe(JSON.stringify(expected));
		});

		test("should serialize empty object", () => {
			const result = serialize({});
			expect(result.get(DATA_KEY)).toBe(JSON.stringify({}));
		});
	});

	describe("arrays", () => {
		test("should serialize array of primitives", () => {
			const arr = [
				faker.lorem.word(),
				faker.number.int(),
				faker.datatype.boolean(),
				null,
			];

			const result = serialize(arr);
			expect(result.get(DATA_KEY)).toBe(JSON.stringify(arr));
		});

		test("should serialize array of objects", () => {
			const arr = Array.from({ length: 3 }, () => ({
				id: faker.string.uuid(),
				name: faker.person.fullName(),
				score: faker.number.float({ min: 0, max: 100 }),
			}));

			const result = serialize(arr);
			expect(result.get(DATA_KEY)).toBe(JSON.stringify(arr));
		});

		test("should serialize nested arrays", () => {
			const arr = [
				[faker.lorem.word(), faker.lorem.word()],
				[faker.number.int(), faker.number.int()],
				[faker.datatype.boolean()],
			];

			const result = serialize(arr);
			expect(result.get(DATA_KEY)).toBe(JSON.stringify(arr));
		});

		test("should serialize empty array", () => {
			const result = serialize([]);
			expect(result.get(DATA_KEY)).toBe(JSON.stringify([]));
		});
	});

	describe("Blob handling", () => {
		test("should serialize single Blob", () => {
			const content = faker.lorem.paragraph();
			const blob = new Blob([content], { type: "text/plain" });

			const result = serialize(blob);

			// Should have a data field with file hole reference
			const dataValue = JSON.parse(result.get(DATA_KEY) as string);
			expect(dataValue).toMatch(/^\$ref:/);

			// Should have the blob in form data
			const entries = Array.from(result.entries());
			const blobEntry = entries.find(([key]) => key.startsWith("$ref:"));
			expect(blobEntry).toBeDefined();
			expect(blobEntry?.[1]).toBeInstanceOf(Blob);
		});

		test("should serialize object containing Blob", () => {
			const content = faker.lorem.paragraph();
			const blob = new Blob([content], { type: "text/plain" });
			const obj = {
				name: faker.person.fullName(),
				avatar: blob,
				active: true,
			};

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DATA_KEY) as string);
			expect(dataValue.name).toBe(obj.name);
			expect(dataValue.active).toBe(true);
			expect(dataValue.avatar).toMatch(/^\$ref:/);

			// Should have the blob in form data
			const entries = Array.from(result.entries());
			const blobEntry = entries.find(([key]) => key.startsWith("$ref:"));
			expect(blobEntry?.[1]).toBeInstanceOf(Blob);
		});

		test("should serialize array containing Blobs", () => {
			const blobs = Array.from(
				{ length: 3 },
				() => new Blob([faker.lorem.paragraph()], { type: "text/plain" }),
			);

			const result = serialize(blobs);

			const dataValue = JSON.parse(result.get(DATA_KEY) as string);
			expect(Array.isArray(dataValue)).toBe(true);
			expect(dataValue).toHaveLength(3);
			dataValue.forEach((item: string) => {
				expect(item).toMatch(/^\$ref:/);
			});

			// Should have all blobs in form data
			const entries = Array.from(result.entries());
			const blobEntries = entries.filter(([key]) => key.startsWith("$ref:"));
			expect(blobEntries).toHaveLength(3);
		});

		test("should handle File objects (subclass of Blob)", () => {
			const content = faker.lorem.paragraph();
			const file = new File([content], faker.system.fileName(), {
				type: "text/plain",
			});

			const result = serialize(file);

			const dataValue = JSON.parse(result.get(DATA_KEY) as string);
			expect(dataValue).toMatch(/^\$ref:/);

			const entries = Array.from(result.entries());
			const fileEntry = entries.find(([key]) => key.startsWith("$ref:"));
			expect(fileEntry?.[1]).toBeInstanceOf(File);
		});
	});

	describe("extension handling", () => {
		test("should serialize Date with dateExtension", () => {
			const date = faker.date.recent();
			const result = serialize(date, [dateExtension]);

			const dataValue = JSON.parse(result.get(DATA_KEY) as string);
			expect(dataValue).toMatch(/^\$ext:date:/);

			// Should have extension data
			const entries = Array.from(result.entries());
			const extEntry = entries.find(([key]) => key.startsWith("$ext:date:"));
			expect(extEntry).toBeDefined();
			expect(JSON.parse(extEntry?.[1] as string)).toBe(date.toISOString());
		});

		test("should serialize BigInt with bigIntExtension", () => {
			const bigInt = BigInt(faker.number.bigInt());
			const result = serialize(bigInt, [bigIntExtension]);

			const dataValue = JSON.parse(result.get(DATA_KEY) as string);
			expect(dataValue).toMatch(/^\$ext:bigint:/);

			const entries = Array.from(result.entries());
			const extEntry = entries.find(([key]) => key.startsWith("$ext:bigint:"));
			expect(extEntry).toBeDefined();
			expect(JSON.parse(extEntry?.[1] as string)).toBe(bigInt.toString());
		});

		test("should serialize object with extension types", () => {
			const date = faker.date.recent();
			const bigInt = BigInt(faker.number.bigInt());
			const obj = {
				name: faker.person.fullName(),
				createdAt: date,
				id: bigInt,
				count: faker.number.int(),
			};

			const result = serialize(obj, [dateExtension, bigIntExtension]);

			const dataValue = JSON.parse(result.get(DATA_KEY) as string);
			expect(dataValue.name).toBe(obj.name);
			expect(dataValue.count).toBe(obj.count);
			expect(dataValue.createdAt).toMatch(/^\$ext:date:/);
			expect(dataValue.id).toMatch(/^\$ext:bigint:/);
		});

		test("should handle extension that returns Blob", () => {
			const customData = { special: faker.lorem.sentence() };
			const blobExtension: SerializationExtension<typeof customData> = {
				name: "custom-blob",
				serialize: (value) =>
					new Blob([JSON.stringify(value)], { type: "application/json" }),
				deserialize: (value) => JSON.parse(value as string),
				canHandle: (value): value is typeof customData =>
					typeof value === "object" && value !== null && "special" in value,
			};

			const result = serialize(customData, [blobExtension]);

			const dataValue = JSON.parse(result.get(DATA_KEY) as string);
			expect(dataValue).toMatch(/^\$ext:custom-blob:/);

			// Should have the blob in form data (not as JSON string)
			const entries = Array.from(result.entries());
			const extEntry = entries.find(([key]) =>
				key.startsWith("$ext:custom-blob:"),
			);
			expect(extEntry?.[1]).toBeInstanceOf(Blob);
		});

		test("should handle multiple extensions with priority order", () => {
			const date = faker.date.recent();

			// Create a competing extension that also handles Date
			const altDateExtension: SerializationExtension<Date> = {
				name: "alt-date",
				serialize: (value) => value.getTime().toString(),
				deserialize: (value) => new Date(Number.parseInt(value as string, 10)),
				canHandle: (value): value is Date => value instanceof Date,
			};

			// First extension should win
			const result = serialize(date, [dateExtension, altDateExtension]);

			const dataValue = JSON.parse(result.get(DATA_KEY) as string);
			expect(dataValue).toMatch(/^\$ext:date:/);
			expect(dataValue).not.toMatch(/^\$ext:alt-date:/);
		});
	});

	describe("complex nested structures", () => {
		test("should serialize complex mixed data", () => {
			const content = faker.lorem.paragraph();
			const blob = new Blob([content], { type: "text/plain" });
			const date = faker.date.recent();
			const bigInt = BigInt(faker.number.bigInt());

			const complexObj = {
				metadata: {
					created: date,
					id: bigInt,
					files: [blob, new Blob([faker.lorem.paragraph()])],
					tags: [faker.lorem.word(), faker.lorem.word()],
				},
				users: [
					{
						name: faker.person.fullName(),
						avatar: new Blob([faker.image.avatar()]),
						joinDate: faker.date.past(),
					},
					{
						name: faker.person.fullName(),
						avatar: new Blob([faker.image.avatar()]),
						joinDate: faker.date.past(),
					},
				],
				settings: {
					theme: faker.color.human(),
					notifications: faker.datatype.boolean(),
				},
			};

			const result = serialize(complexObj, [dateExtension, bigIntExtension]);

			// Verify structure
			const dataValue = JSON.parse(result.get(DATA_KEY) as string);

			// Check extensions were handled
			expect(dataValue.metadata.created).toMatch(/^\$ext:date:/);
			expect(dataValue.metadata.id).toMatch(/^\$ext:bigint:/);
			expect(dataValue.users[0].joinDate).toMatch(/^\$ext:date:/);
			expect(dataValue.users[1].joinDate).toMatch(/^\$ext:date:/);

			// Check blobs were replaced with references
			expect(dataValue.metadata.files[0]).toMatch(/^\$ref:/);
			expect(dataValue.metadata.files[1]).toMatch(/^\$ref:/);
			expect(dataValue.users[0].avatar).toMatch(/^\$ref:/);
			expect(dataValue.users[1].avatar).toMatch(/^\$ref:/);

			// Check primitive values preserved
			expect(dataValue.metadata.tags).toEqual(complexObj.metadata.tags);
			expect(dataValue.settings).toEqual(complexObj.settings);

			// Count form data entries
			const entries = Array.from(result.entries());
			const refEntries = entries.filter(([key]) => key.startsWith("$ref:"));
			const extEntries = entries.filter(([key]) => key.startsWith("$ext:"));

			expect(refEntries).toHaveLength(4); // 4 blobs
			expect(extEntries).toHaveLength(4); // 4 dates + 1 bigint
		});
	});

	describe("edge cases", () => {
		test("should handle empty extensions array", () => {
			const obj = { name: faker.person.fullName() };
			const result = serialize(obj, []);
			expect(result.get(DATA_KEY)).toBe(JSON.stringify(obj));
		});

		test("should handle no extensions parameter", () => {
			const obj = { name: faker.person.fullName() };
			const result = serialize(obj);
			expect(result.get(DATA_KEY)).toBe(JSON.stringify(obj));
		});

		test("should handle deeply nested structures", () => {
			const deepObj = {
				level1: {
					level2: {
						level3: {
							level4: {
								level5: {
									value: faker.lorem.word(),
									blob: new Blob([faker.lorem.sentence()]),
								},
							},
						},
					},
				},
			};

			const result = serialize(deepObj);
			const dataValue = JSON.parse(result.get(DATA_KEY) as string);
			expect(dataValue.level1.level2.level3.level4.level5.value).toBe(
				deepObj.level1.level2.level3.level4.level5.value,
			);
			expect(dataValue.level1.level2.level3.level4.level5.blob).toMatch(
				/^\$ref:/,
			);
		});

		test("should handle circular reference in extensions (should not infinitely recurse)", () => {
			const obj = { name: faker.person.fullName() };

			// This should not cause infinite recursion since extensions are checked first
			const result = serialize(obj, [dateExtension]);
			expect(result.get(DATA_KEY)).toBe(JSON.stringify(obj));
		});

		test("should handle very large arrays", () => {
			const largeArray = Array.from({ length: 1000 }, () => faker.lorem.word());
			const result = serialize(largeArray);
			expect(result.get(DATA_KEY)).toBe(JSON.stringify(largeArray));
		});
	});
});
