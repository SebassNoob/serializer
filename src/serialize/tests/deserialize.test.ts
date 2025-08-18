import { beforeEach, describe, expect, test } from "bun:test";
import { faker } from "@faker-js/faker";
import { bigIntExtension, dateExtension } from "../../extensions/extensions";
import { DATA_KEY, EXTENSION_KEY, FILE_HOLE_KEY } from "../constants";
import { deserialize } from "../deserialize";
import { serialize } from "../serialize";
import type { SerializationExtension } from "../types";

describe("deserialize", () => {
	beforeEach(() => {
		// Reset faker seed for consistent tests
		faker.seed(123);
	});

	describe("primitive values", () => {
		test("should deserialize string", () => {
			const str = faker.lorem.sentence();
			const serialized = serialize(str);
			const result = deserialize(serialized);

			expect(result).toBe(str);
		});

		test("should deserialize number", () => {
			const num = faker.number.float();
			const serialized = serialize(num);
			const result = deserialize(serialized);

			expect(result).toBe(num);
		});

		test("should deserialize integer", () => {
			const int = faker.number.int();
			const serialized = serialize(int);
			const result = deserialize(serialized);

			expect(result).toBe(int);
		});

		test("should deserialize boolean true", () => {
			const serialized = serialize(true);
			const result = deserialize(serialized);

			expect(result).toBe(true);
		});

		test("should deserialize boolean false", () => {
			const serialized = serialize(false);
			const result = deserialize(serialized);

			expect(result).toBe(false);
		});

		test("should deserialize null", () => {
			const serialized = serialize(null);
			const result = deserialize(serialized);

			expect(result).toBe(null);
		});
	});

	describe("objects", () => {
		test("should deserialize simple object", () => {
			const obj = {
				name: faker.person.fullName(),
				age: faker.number.int({ min: 18, max: 80 }),
				active: faker.datatype.boolean(),
			};

			const serialized = serialize(obj);
			const result = deserialize(serialized);

			expect(result).toEqual(obj);
		});

		test("should deserialize nested object", () => {
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

			const serialized = serialize(obj);
			const result = deserialize(serialized);

			expect(result).toEqual(obj);
		});

		test("should deserialize empty object", () => {
			const obj = {};
			const serialized = serialize(obj);
			const result = deserialize(serialized);

			expect(result).toEqual(obj);
		});

		test("should handle objects that had undefined values omitted during serialization", () => {
			const obj = {
				name: faker.person.fullName(),
				age: undefined,
				email: faker.internet.email(),
			};

			const expected = {
				name: obj.name,
				email: obj.email,
			};

			const serialized = serialize(obj as any);
			const result = deserialize(serialized);

			expect(result).toEqual(expected);
			expect(result).not.toHaveProperty("age");
		});
	});

	describe("arrays", () => {
		test("should deserialize array of primitives", () => {
			const arr = [faker.lorem.word(), faker.number.int(), faker.datatype.boolean(), null];

			const serialized = serialize(arr);
			const result = deserialize(serialized);

			expect(result).toEqual(arr);
		});

		test("should deserialize array of objects", () => {
			const arr = Array.from({ length: 3 }, () => ({
				id: faker.string.uuid(),
				name: faker.person.fullName(),
				score: faker.number.float({ min: 0, max: 100 }),
			}));

			const serialized = serialize(arr);
			const result = deserialize(serialized);

			expect(result).toEqual(arr);
		});

		test("should deserialize nested arrays", () => {
			const arr = [
				[faker.lorem.word(), faker.lorem.word()],
				[faker.number.int(), faker.number.int()],
				[faker.datatype.boolean()],
			];

			const serialized = serialize(arr);
			const result = deserialize(serialized);

			expect(result).toEqual(arr);
		});

		test("should deserialize empty array", () => {
			const arr: any[] = [];
			const serialized = serialize(arr);
			const result = deserialize(serialized);

			expect(result).toEqual(arr);
		});
	});

	describe("Blob handling", () => {
		test("should deserialize single Blob", async () => {
			const content = faker.lorem.paragraph();
			const blob = new Blob([content], { type: "text/plain" });

			const serialized = serialize(blob);
			const result = deserialize(serialized) as Blob;

			expect(result).toBeInstanceOf(Blob);
			expect(result.type).toBe(blob.type);
			expect(result.size).toBe(blob.size);

			// Verify content
			const resultText = await result.text();
			expect(resultText).toBe(content);
		});

		test("should deserialize object containing Blob", async () => {
			const content = faker.lorem.paragraph();
			const blob = new Blob([content], { type: "text/plain" });
			const obj = {
				name: faker.person.fullName(),
				avatar: blob,
				active: true,
			};

			const serialized = serialize(obj);
			const result = deserialize(serialized) as typeof obj;

			expect(result.name).toBe(obj.name);
			expect(result.active).toBe(obj.active);
			expect(result.avatar).toBeInstanceOf(Blob);
			expect(result.avatar.type).toBe(blob.type);

			const avatarText = await result.avatar.text();
			expect(avatarText).toBe(content);
		});

		test("should deserialize array containing Blobs", async () => {
			const contents = [faker.lorem.paragraph(), faker.lorem.paragraph(), faker.lorem.paragraph()];
			const blobs = contents.map((content) => new Blob([content], { type: "text/plain" }));

			const serialized = serialize(blobs);
			const result = deserialize(serialized) as Blob[];

			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(3);

			for (let i = 0; i < result.length; i++) {
				expect(result[i]).toBeInstanceOf(Blob);
				const text = await result[i]!.text();
				expect(text).toBe(contents[i]!);
			}
		});

		test("should deserialize File objects", async () => {
			const content = faker.lorem.paragraph();
			const fileName = faker.system.fileName();
			const file = new File([content], fileName, { type: "text/plain" });

			const serialized = serialize(file);
			const result = deserialize(serialized) as File;

			expect(result).toBeInstanceOf(File);
			expect(result.name).toBe(fileName);
			expect(result.type).toBe(file.type);

			const resultText = await result.text();
			expect(resultText).toBe(content);
		});
	});

	describe("extension handling", () => {
		test("should deserialize Date with dateExtension", () => {
			const date = faker.date.recent();
			const serialized = serialize(date, [dateExtension]);
			const result = deserialize(serialized, [dateExtension]) as Date;

			expect(result).toBeInstanceOf(Date);
			expect(result.getTime()).toBe(date.getTime());
		});

		test("should deserialize BigInt with bigIntExtension", () => {
			const bigInt = BigInt(faker.number.bigInt());
			const serialized = serialize(bigInt, [bigIntExtension]);
			const result = deserialize(serialized, [bigIntExtension]);

			expect(typeof result).toBe("bigint");
			expect(result).toBe(bigInt);
		});

		test("should deserialize object with extension types", () => {
			const date = faker.date.recent();
			const bigInt = BigInt(faker.number.bigInt());
			const obj = {
				name: faker.person.fullName(),
				createdAt: date,
				id: bigInt,
				count: faker.number.int(),
			};

			const serialized = serialize(obj, [dateExtension, bigIntExtension]);
			const result = deserialize(serialized, [dateExtension, bigIntExtension]) as typeof obj;

			expect(result.name).toBe(obj.name);
			expect(result.count).toBe(obj.count);
			expect(result.createdAt).toBeInstanceOf(Date);
			expect(result.createdAt.getTime()).toBe(date.getTime());
			expect(typeof result.id).toBe("bigint");
			expect(result.id).toBe(bigInt);
		});

		test("should deserialize extension that returned Blob", async () => {
			const customData = { special: faker.lorem.sentence() };
			const blobExtension: SerializationExtension<typeof customData> = {
				name: "custom-blob",
				serialize: (value) => JSON.stringify(value), // Return string instead of Blob for this test
				deserialize: (value) => JSON.parse(value as string) as typeof customData,
				canHandle: (value): value is typeof customData =>
					typeof value === "object" && value !== null && "special" in value,
			};

			const serialized = serialize(customData, [blobExtension]);
			const result = deserialize(serialized, [blobExtension]);

			expect(result).toEqual(customData);
		});

		test("should fail when extension is missing during deserialization", () => {
			const date = faker.date.recent();
			const serialized = serialize(date, [dateExtension]);

			// Try to deserialize without the extension
			expect(() => deserialize(serialized, [])).toThrow(
				"Extension 'date' not found in provided extensions",
			);
		});

		test("should handle extension deserialization errors gracefully", () => {
			const date = faker.date.recent();
			const brokenExtension: SerializationExtension<Date> = {
				name: "broken-date",
				serialize: (value: Date) => value.toISOString(),
				deserialize: () => {
					throw new Error("Deserialization failed");
				},
				canHandle: (value: unknown): value is Date => value instanceof Date,
			};

			const serialized = serialize(date, [brokenExtension]);

			expect(() => deserialize(serialized, [brokenExtension])).toThrow("Deserialization failed");
		});
	});

	describe("round-trip consistency", () => {
		test("should maintain data integrity through serialize/deserialize cycle", async () => {
			const content1 = faker.lorem.paragraph();
			const content2 = faker.lorem.paragraph();
			const date = faker.date.recent();
			const bigInt = BigInt(faker.number.bigInt());

			const originalData = {
				metadata: {
					created: date,
					id: bigInt,
					files: [
						new Blob([content1], { type: "text/plain" }),
						new Blob([content2], { type: "application/json" }),
					],
					tags: [faker.lorem.word(), faker.lorem.word()],
				},
				users: [
					{
						name: faker.person.fullName(),
						avatar: new File([faker.image.avatar()], "avatar1.jpg", { type: "image/jpeg" }),
						joinDate: faker.date.past(),
					},
					{
						name: faker.person.fullName(),
						avatar: new File([faker.image.avatar()], "avatar2.png", { type: "image/png" }),
						joinDate: faker.date.past(),
					},
				],
				settings: {
					theme: faker.color.human(),
					notifications: faker.datatype.boolean(),
				},
			};

			const serialized = serialize(originalData, [dateExtension, bigIntExtension]);
			const deserialized = deserialize(serialized, [
				dateExtension,
				bigIntExtension,
			]) as typeof originalData;

			// Check primitive values
			expect(deserialized.metadata.tags).toEqual(originalData.metadata.tags);
			expect(deserialized.settings).toEqual(originalData.settings);
			expect(deserialized.users[0]!.name).toBe(originalData.users[0]!.name);
			expect(deserialized.users[1]!.name).toBe(originalData.users[1]!.name);

			// Check extensions
			expect(deserialized.metadata.created).toBeInstanceOf(Date);
			expect(deserialized.metadata.created.getTime()).toBe(originalData.metadata.created.getTime());
			expect(typeof deserialized.metadata.id).toBe("bigint");
			expect(deserialized.metadata.id).toBe(originalData.metadata.id);
			expect(deserialized.users[0]!.joinDate).toBeInstanceOf(Date);
			expect(deserialized.users[1]!.joinDate).toBeInstanceOf(Date);

			// Check blobs
			expect(deserialized.metadata.files).toHaveLength(2);
			expect(deserialized.metadata.files[0]).toBeInstanceOf(Blob);
			expect(deserialized.metadata.files[1]).toBeInstanceOf(Blob);

			const file1Text = await deserialized.metadata.files[0]!.text();
			const file2Text = await deserialized.metadata.files[1]!.text();
			expect(file1Text).toBe(content1);
			expect(file2Text).toBe(content2);

			// Check File objects
			expect(deserialized.users[0]!.avatar).toBeInstanceOf(File);
			expect(deserialized.users[1]!.avatar).toBeInstanceOf(File);
			expect((deserialized.users[0]!.avatar as File).name).toBe("avatar1.jpg");
			expect((deserialized.users[1]!.avatar as File).name).toBe("avatar2.png");
		});
	});

	describe("error handling", () => {
		test("should throw error when FormData has no data key", () => {
			const formData = new FormData();
			formData.append("other", "value");

			expect(() => deserialize(formData)).toThrow("No data found in FormData");
		});

		test("should throw error when data key contains invalid JSON", () => {
			const formData = new FormData();
			formData.append(DATA_KEY, "invalid json{");

			expect(() => deserialize(formData)).toThrow("Failed to parse data from FormData");
		});

		test("should throw error when file hole is missing", () => {
			const formData = new FormData();
			formData.append(DATA_KEY, JSON.stringify("$ref:missing-id"));

			expect(() => deserialize(formData)).toThrow("File hole not found for key: $ref:missing-id");
		});

		test("should throw error when extension data is missing", () => {
			const formData = new FormData();
			formData.append(DATA_KEY, JSON.stringify("$ext:missing:id"));

			expect(() => deserialize(formData)).toThrow(
				"Extension data not found for key: $ext:missing:id",
			);
		});

		test("should throw error when file hole contains non-Blob", () => {
			const formData = new FormData();
			formData.append(DATA_KEY, JSON.stringify("$ref:test-id"));
			formData.append("$ref:test-id", "not a blob");

			expect(() => deserialize(formData)).toThrow(
				"Expected Blob for file hole key '$ref:test-id', but got string",
			);
		});

		test("should throw error when extension data has invalid JSON", () => {
			const formData = new FormData();
			formData.append(DATA_KEY, JSON.stringify("$ext:test:id"));
			formData.append("$ext:test:id", "invalid json{");

			expect(() => deserialize(formData)).toThrow(
				"Failed to parse extension data for key '$ext:test:id'",
			);
		});

		test("should handle malformed file hole key by returning as string", () => {
			const formData = new FormData();
			formData.append(DATA_KEY, JSON.stringify("$ref:"));

			const result = deserialize(formData);
			expect(result).toBe("$ref:"); // Should return as-is since regex doesn't match
		});
		test("should handle malformed extension key by returning as string", () => {
			const formData = new FormData();
			formData.append(DATA_KEY, JSON.stringify("$ext:"));

			const result = deserialize(formData);
			expect(result).toBe("$ext:"); // Should return as-is since regex doesn't match
		});

		test("should validate extensions and throw appropriate errors", () => {
			const invalidExtension = {
				name: "test:invalid",
				serialize: () => "",
				deserialize: () => null,
				canHandle: () => false,
			};

			expect(() => deserialize(new FormData(), [invalidExtension as any])).toThrow(
				"Extension name 'test:invalid' cannot contain colon (:) character",
			);
		});

		test("should handle file hole with null/undefined blob data", () => {
			const formData = new FormData();
			formData.append(DATA_KEY, JSON.stringify("$ref:test-id"));

			// Create a scenario where the file hole exists but contains invalid data
			const originalGet = formData.get.bind(formData);
			formData.get = (key: string) => {
				if (key === "$ref:test-id") return null;
				return originalGet(key);
			};

			const originalEntries = formData.entries.bind(formData);
			formData.entries = function* () {
				yield [DATA_KEY, JSON.stringify("$ref:test-id")];
				yield ["$ref:test-id", null as any];
			};

			expect(() => deserialize(formData)).toThrow(
				"Expected Blob for file hole key '$ref:test-id', but got object",
			);
		});
	});

	describe("edge cases", () => {
		test("should handle empty extensions array", () => {
			const obj = { name: faker.person.fullName() };
			const serialized = serialize(obj, []);
			const result = deserialize(serialized, []);

			expect(result).toEqual(obj);
		});

		test("should handle no extensions parameter", () => {
			const obj = { name: faker.person.fullName() };
			const serialized = serialize(obj);
			const result = deserialize(serialized);

			expect(result).toEqual(obj);
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

			const serialized = serialize(deepObj);
			const result = deserialize(serialized) as typeof deepObj;

			expect(result.level1.level2.level3.level4.level5.value).toBe(
				deepObj.level1.level2.level3.level4.level5.value,
			);
			expect(result.level1.level2.level3.level4.level5.blob).toBeInstanceOf(Blob);
		});

		test("should handle very large arrays", () => {
			const largeArray = Array.from({ length: 1000 }, () => faker.lorem.word());
			const serialized = serialize(largeArray);
			const result = deserialize(serialized);

			expect(result).toEqual(largeArray);
		});

		test("should handle extension with empty string data", () => {
			const emptyExtension: SerializationExtension<string> = {
				name: "empty-string",
				serialize: () => "",
				deserialize: (value) => value as string,
				canHandle: (value): value is string => value === "EMPTY_MARKER",
			};

			const serialized = serialize("EMPTY_MARKER", [emptyExtension]);
			const result = deserialize(serialized, [emptyExtension]);

			expect(result).toBe("");
		});
	});
});
