import { beforeEach, describe, expect, test } from "bun:test";
import { faker } from "@faker-js/faker";
import { deserialize, type SerializationExtension, serialize } from "@/serialize-refactor";
import { BigIntExtension, DateExtension } from "@/extensions-refactor";
import { DEFAULT_REFERENCE_PREFIX } from "@/serialize-refactor/constants";

describe("deserialize", () => {
	beforeEach(() => {
		// Reset faker seed for consistent tests
		faker.seed(123);
	});

	describe("primitives", () => {
		test("should deserialize string without data loss", () => {
			const original = faker.lorem.paragraph();
			const result = deserialize(serialize(original));
			expect(result).toBe(original);
		});

		test("should deserialize number (float) without precision loss", () => {
			const original = 3.141592653589793;
			const result = deserialize(serialize(original));
			expect(result).toBe(original);
		});

		test("should deserialize number (integer) without data loss", () => {
			const original = faker.number.int({ min: -1000000, max: 1000000 });
			const result = deserialize(serialize(original));
			expect(result).toBe(original);
		});

		test("should deserialize boolean true without data loss", () => {
			const result = deserialize(serialize(true));
			expect(result).toBe(true);
		});

		test("should deserialize boolean false without data loss", () => {
			const result = deserialize(serialize(false));
			expect(result).toBe(false);
		});

		test("should deserialize null without data loss", () => {
			const result = deserialize(serialize(null));
			expect(result).toBe(null);
		});

		test("should deserialize zero without data loss", () => {
			const result = deserialize(serialize(0));
			expect(result).toBe(0);
		});

		test("should deserialize empty string without data loss", () => {
			const result = deserialize(serialize(""));
			expect(result).toBe("");
		});

		test("should deserialize negative numbers without data loss", () => {
			const original = -12345.6789;
			const result = deserialize(serialize(original));
			expect(result).toBe(original);
		});

		test("should deserialize very large safe integer without data loss", () => {
			const original = Number.MAX_SAFE_INTEGER;
			const result = deserialize(serialize(original));
			expect(result).toBe(original);
		});

		test("should deserialize very small number without data loss", () => {
			const original = Number.MIN_VALUE;
			const result = deserialize(serialize(original));
			expect(result).toBe(original);
		});
	});

	describe("objects", () => {
		test("should deserialize simple object without data loss", () => {
			const original = {
				name: faker.person.fullName(),
				age: faker.number.int({ min: 18, max: 100 }),
				active: faker.datatype.boolean(),
			};
			const result = deserialize(serialize(original));
			expect(result).toEqual(original);
		});

		test("should deserialize nested object without data loss", () => {
			const original = {
				user: {
					profile: {
						name: faker.person.fullName(),
						email: faker.internet.email(),
					},
					settings: {
						theme: faker.helpers.arrayElement(["light", "dark"]),
						notifications: faker.datatype.boolean(),
					},
				},
			};
			const result = deserialize(serialize(original));
			expect(result).toEqual(original);
		});

		test("should deserialize empty object without data loss", () => {
			const original = {};
			const result = deserialize(serialize(original));
			expect(result).toEqual(original);
		});

		test("should deserialize object with null values without data loss", () => {
			const original = {
				name: faker.person.fullName(),
				deletedAt: null,
				description: faker.lorem.sentence(),
			};
			const result = deserialize(serialize(original));
			expect(result).toEqual(original);
		});

		test("should deserialize object with mixed types without data loss", () => {
			const original = {
				string: faker.lorem.word(),
				number: faker.number.float(),
				boolean: faker.datatype.boolean(),
				nullValue: null,
				nested: {
					value: faker.lorem.word(),
				},
			};
			const result = deserialize(serialize(original));
			expect(result).toEqual(original);
		});

		test("should preserve object key order", () => {
			const original = { z: "last", a: "first", m: "middle" };
			const result = deserialize(serialize(original));
			expect(Object.keys(result)).toEqual(["z", "a", "m"]);
			expect(result).toEqual(original);
		});

		test("should deserialize object with numeric keys without data loss", () => {
			const original = {
				0: faker.lorem.word(),
				1: faker.lorem.word(),
				2: faker.lorem.word(),
			};
			const result = deserialize(serialize(original));
			expect(result).toEqual(original);
		});

		test("should deserialize object with special characters in keys without data loss", () => {
			const original = {
				"key-with-dash": faker.lorem.word(),
				"key.with.dots": faker.lorem.word(),
				"key with spaces": faker.lorem.word(),
			};
			const result = deserialize(serialize(original));
			expect(result).toEqual(original);
		});
	});

	describe("arrays", () => {
		test("should deserialize array of primitives without data loss", () => {
			const original = [
				faker.lorem.word(),
				faker.number.int(),
				faker.datatype.boolean(),
				null,
			];
			const result = deserialize(serialize(original));
			expect(result).toEqual(original);
		});

		test("should deserialize array of objects without data loss", () => {
			const original = Array.from({ length: 3 }, () => ({
				id: faker.string.uuid(),
				value: faker.lorem.word(),
			}));
			const result = deserialize(serialize(original));
			expect(result).toEqual(original);
		});

		test("should deserialize nested arrays without data loss", () => {
			const original = [
				[1, 2, 3],
				[4, 5, 6],
				[[7, 8], [9, 10]],
			];
			const result = deserialize(serialize(original));
			expect(result).toEqual(original);
		});

		test("should deserialize empty array without data loss", () => {
			const original: unknown[] = [];
			const result = deserialize(serialize(original));
			expect(result).toEqual(original);
		});

		test("should preserve array element order", () => {
			const original = ["first", "second", "third", "fourth"];
			const result = deserialize(serialize(original));
			expect(result).toEqual(original);
		});

		test("should deserialize array with null values without data loss", () => {
			const original = [
				faker.lorem.word(),
				null,
				faker.number.int(),
				null,
			];
			const result = deserialize(serialize(original));
			expect(result).toEqual(original);
		});
	});

	describe("Blob handling", () => {
		test("should deserialize single Blob without data loss", async () => {
			const content = faker.lorem.paragraph();
			const original = new Blob([content], { type: "text/plain" });
			const result = deserialize(serialize(original));

			expect(result).toBeInstanceOf(Blob);
			expect(result.type).toContain("text/plain");
			expect(await result.text()).toBe(content);
		});

		test("should deserialize object containing Blob without data loss", async () => {
			const content = faker.lorem.paragraph();
			const original = {
				name: faker.person.fullName(),
				avatar: new Blob([content], { type: "image/png" }),
				active: true,
			};
			const result = deserialize(serialize(original));

			expect(result.name).toBe(original.name);
			expect(result.active).toBe(true);
			expect(result.avatar).toBeInstanceOf(Blob);
			expect(result.avatar.type).toContain("image/png");
			expect(await result.avatar.text()).toBe(content);
		});

		test("should deserialize array containing Blobs without data loss", async () => {
			const contents = [
				faker.lorem.paragraph(),
				faker.lorem.paragraph(),
				faker.lorem.paragraph(),
			];
			const original = contents.map(c => new Blob([c], { type: "text/plain" }));
			const result = deserialize(serialize(original));

			expect(result).toHaveLength(3);
			for (let i = 0; i < 3; i++) {
				expect(result[i]).toBeInstanceOf(Blob);
				expect(await result[i].text()).toBe(contents[i]);
			}
		});

		test("should deserialize File objects without data loss", async () => {
			const content = faker.lorem.paragraph();
			const fileName = faker.system.fileName();
			const original = new File([content], fileName, { type: "text/plain" });
			const result = deserialize(serialize(original));

			expect(result).toBeInstanceOf(File);
			expect(result.name).toBe(fileName);
			expect(result.type).toContain("text/plain");
			expect(await result.text()).toBe(content);
		});

		test("should preserve File name attribute", async () => {
			const fileName = "important-document.pdf";
			const content = faker.lorem.paragraph();
			const original = new File([content], fileName, { type: "application/pdf" });
			const result = deserialize(serialize(original));

			expect(result).toBeInstanceOf(File);
			expect(result.name).toBe(fileName);
		});

		test("should preserve File type attribute", async () => {
			const fileType = "application/json";
			const content = JSON.stringify({ data: faker.lorem.word() });
			const original = new File([content], "data.json", { type: fileType });
			const result = deserialize(serialize(original));

			expect(result).toBeInstanceOf(File);
			expect(result.type).toContain(fileType);
		});

		test("should preserve File lastModified attribute", async () => {
			const lastModified = Date.now() - 86400000;
			const content = faker.lorem.paragraph();
			const original = new File([content], "file.txt", { 
				type: "text/plain", 
				lastModified 
			});
			const result = deserialize(serialize(original));

			expect(result).toBeInstanceOf(File);
			expect(result.lastModified).toBe(lastModified);
		});

		test("should preserve all File attributes simultaneously", async () => {
			const fileName = "report-2025.docx";
			const fileType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
			const lastModified = Date.now() - 86400000;
			const content = faker.lorem.paragraphs(5);
			const original = new File([content], fileName, { type: fileType, lastModified });
			const result = deserialize(serialize({ attachment: original }));

			expect(result.attachment).toBeInstanceOf(File);
			expect(result.attachment.name).toBe(fileName);
			expect(result.attachment.type).toContain(fileType);
			expect(result.attachment.lastModified).toBe(lastModified);
			expect(await result.attachment.text()).toBe(content);
		});

		test("should deserialize empty Blob without data loss", async () => {
			const original = new Blob([], { type: "text/plain" });
			const result = deserialize(serialize(original));

			expect(result).toBeInstanceOf(Blob);
			expect(result.size).toBe(0);
			expect(await result.text()).toBe("");
		});

		test("should deserialize Blob from multiple parts without data loss", async () => {
			const parts = [
				faker.lorem.paragraph(),
				new Uint8Array([1, 2, 3, 4, 5]),
				faker.lorem.paragraph(),
			];
			const original = new Blob(parts, { type: "application/octet-stream" });
			const result = deserialize(serialize(original));

			expect(result).toBeInstanceOf(Blob);
			expect(result.size).toBe(original.size);
			expect(result.type).toContain("application/octet-stream");
		});

		test("should deserialize multiple Blobs with same content independently", async () => {
			const content = faker.lorem.paragraph();
			const original = {
				blob1: new Blob([content], { type: "text/plain" }),
				blob2: new Blob([content], { type: "text/plain" }),
			};
			const result = deserialize(serialize(original));

			expect(result.blob1).toBeInstanceOf(Blob);
			expect(result.blob2).toBeInstanceOf(Blob);
			expect(await result.blob1.text()).toBe(content);
			expect(await result.blob2.text()).toBe(content);
		});

		test("should deserialize nested objects with Blobs at different levels", async () => {
			const contents = [
				faker.lorem.paragraph(),
				faker.lorem.paragraph(),
				faker.lorem.paragraph(),
			];
			const original = {
				level1: {
					file: new Blob([contents[0]], { type: "text/plain" }),
					level2: {
						file: new Blob([contents[1]], { type: "image/png" }),
						level3: {
							file: new Blob([contents[2]], { type: "application/json" }),
						},
					},
				},
			};
			const result = deserialize(serialize(original));

			expect(result.level1.file).toBeInstanceOf(Blob);
			expect(result.level1.level2.file).toBeInstanceOf(Blob);
			expect(result.level1.level2.level3.file).toBeInstanceOf(Blob);
			expect(await result.level1.file.text()).toBe(contents[0]);
			expect(await result.level1.level2.file.text()).toBe(contents[1]);
			expect(await result.level1.level2.level3.file.text()).toBe(contents[2]);
		});

		test("should deserialize array of mixed Files and Blobs", async () => {
			const content1 = faker.lorem.paragraph();
			const content2 = faker.lorem.paragraph();
			const content3 = faker.lorem.paragraph();
			const content4 = faker.lorem.paragraph();

			const original = [
				new Blob([content1], { type: "text/plain" }),
				new File([content2], faker.system.fileName(), { type: "image/png" }),
				new Blob([content3], { type: "application/json" }),
				new File([content4], faker.system.fileName(), { type: "video/mp4" }),
			];

			const serialized = serialize(original);
			const result = deserialize(serialized);

			expect(result).toHaveLength(4);
			expect(result[0]).toBeInstanceOf(Blob);
			expect(result[1]).toBeInstanceOf(File);
			expect(result[2]).toBeInstanceOf(Blob);
			expect(result[3]).toBeInstanceOf(File);

			const texts = await Promise.all(result.map((r: Blob) => r.text()));
			expect(texts[0]).toBe(content1);
			expect(texts[1]).toBe(content2);
			expect(texts[2]).toBe(content3);
			expect(texts[3]).toBe(content4);
		});

		test("should preserve Blob with binary data", async () => {
			const binaryData = new Uint8Array([0, 1, 2, 3, 255, 254, 253]);
			const original = new Blob([binaryData], { type: "application/octet-stream" });

			const serialized = serialize(original);
			const result = deserialize(serialized);

			expect(result).toBeInstanceOf(Blob);
			
			const arrayBuffer = await result.arrayBuffer();
			const resultData = new Uint8Array(arrayBuffer);
			
			expect(resultData).toEqual(binaryData);
		});
	});

	describe("extension handling", () => {
		test("should deserialize Date with DateExtension without data loss", () => {
			const original = faker.date.recent();
			const result = deserialize(
				serialize(original, { extensions: [DateExtension] }),
				{ extensions: [DateExtension] }
			);
			expect(result).toBeInstanceOf(Date);
			expect(result.getTime()).toBe(original.getTime());
		});

		test("should deserialize BigInt with BigIntExtension without data loss", () => {
			const original = BigInt("9007199254740991999");
			const result = deserialize(
				serialize(original, { extensions: [BigIntExtension] }),
				{ extensions: [BigIntExtension] }
			);
			expect(result).toBe(original);
		});

		test("should deserialize object with multiple extension types without data loss", () => {
			const original = {
				createdAt: faker.date.recent(),
				id: BigInt(faker.number.bigInt()),
				name: faker.person.fullName(),
			};
			const result = deserialize(
				serialize(original, { extensions: [DateExtension, BigIntExtension] }),
				{ extensions: [DateExtension, BigIntExtension] }
			);

			expect(result.createdAt).toBeInstanceOf(Date);
			expect(result.createdAt.getTime()).toBe(original.createdAt.getTime());
			expect(result.id).toBe(original.id);
			expect(result.name).toBe(original.name);
		});

		test("should deserialize custom extension without data loss", () => {
			class CustomClass {
				constructor(public value: string) {}
			}

			const CustomExtension: SerializationExtension<CustomClass> = {
				name: "custom",
				serialize: (obj) => obj.value,
				deserialize: (data) => new CustomClass(data as string),
				canHandle: (value): value is CustomClass => value instanceof CustomClass,
			};

			const original = new CustomClass(faker.lorem.word());
			const result = deserialize(
				serialize(original, { extensions: [CustomExtension] }),
				{ extensions: [CustomExtension] }
			);

			expect(result).toBeInstanceOf(CustomClass);
			expect(result.value).toBe(original.value);
		});

		test("should deserialize array of extension types without data loss", () => {
			const original = [
				faker.date.recent(),
				faker.date.recent(),
				faker.date.recent(),
			];
			const result = deserialize(
				serialize(original, { extensions: [DateExtension] }),
				{ extensions: [DateExtension] }
			);

			expect(result).toHaveLength(3);
			result.forEach((date: Date, i: number) => {
				expect(date).toBeInstanceOf(Date);
				expect(date.getTime()).toBe(original[i].getTime());
			});
		});
	});

	describe("complex structures", () => {
		test("should deserialize complex mixed data without data loss", async () => {
			const content1 = faker.lorem.paragraph();
			const content2 = faker.lorem.paragraph();
			const date1 = faker.date.recent();
			const date2 = faker.date.recent();
			const bigInt = BigInt("123456789012345678901234567890");

			const original = {
				metadata: {
					created: date1,
					id: bigInt,
					tags: [faker.lorem.word(), faker.lorem.word()],
					files: [
						new Blob([content1], { type: "text/plain" }),
						new Blob([content2], { type: "text/plain" }),
					],
				},
				users: [
					{
						name: faker.person.fullName(),
						joinDate: date2,
						avatar: new Blob([faker.lorem.paragraph()], { type: "image/png" }),
					},
				],
				settings: {
					theme: "dark",
					notifications: true,
				},
			};
			const result = deserialize(
				serialize(original, { extensions: [DateExtension, BigIntExtension] }),
				{ extensions: [DateExtension, BigIntExtension] }
			);

			// Verify extensions and structure
			expect(result.metadata.created).toBeInstanceOf(Date);
			expect(result.metadata.created.getTime()).toBe(date1.getTime());
			expect(result.metadata.id).toBe(bigInt);
			expect(result.users[0].joinDate).toBeInstanceOf(Date);
			expect(result.users[0].joinDate.getTime()).toBe(date2.getTime());
			expect(result.metadata.files[0]).toBeInstanceOf(Blob);
			expect(result.metadata.files[1]).toBeInstanceOf(Blob);
			expect(result.users[0].avatar).toBeInstanceOf(Blob);
			expect(await result.metadata.files[0].text()).toBe(content1);
			expect(await result.metadata.files[1].text()).toBe(content2);
			expect(result.metadata.tags).toEqual(original.metadata.tags);
			expect(result.settings).toEqual(original.settings);
			expect(result.users[0].name).toBe(original.users[0].name);
		});

		test("should deserialize deeply nested structures without data loss", () => {
			const original = {
				level1: {
					level2: {
						level3: {
							level4: {
								level5: {
									value: faker.lorem.word(),
									number: faker.number.float(),
									boolean: faker.datatype.boolean(),
								},
							},
						},
					},
				},
			};
			const result = deserialize(serialize(original));
			expect(result).toEqual(original);
		});

		test("should deserialize array of objects with Blobs without data loss", async () => {
			const contents = [
				faker.lorem.paragraph(),
				faker.lorem.paragraph(),
				faker.lorem.paragraph(),
			];
			const original = Array.from({ length: 3 }, (_, i) => ({
				name: faker.person.fullName(),
				email: faker.internet.email(),
				avatar: new Blob([contents[i]], { type: "image/png" }),
			}));
			const result = deserialize(serialize(original));

			expect(result).toHaveLength(3);
			for (let i = 0; i < 3; i++) {
				expect(result[i].name).toBe(original[i].name);
				expect(result[i].email).toBe(original[i].email);
				expect(result[i].avatar).toBeInstanceOf(Blob);
				expect(await result[i].avatar.text()).toBe(contents[i]);
			}
		});
	});

	describe("edge cases", () => {
		test("should deserialize unicode strings without data loss", () => {
			const original = {
				emoji: "🚀 👋 🎉",
				chinese: "你好世界",
				arabic: "مرحبا بالعالم",
				japanese: "こんにちは世界",
			};
			const result = deserialize(serialize(original));
			expect(result).toEqual(original);
		});

		test("should deserialize very long strings without data loss", () => {
			const longString = faker.lorem.paragraphs(100);
			const original = { content: longString };
			const result = deserialize(serialize(original));
			expect(result.content).toBe(longString);
		});

		test("should deserialize NaN (becomes null)", () => {
			const original = { value: Number.NaN };

			const serialized = serialize(original);
			const result = deserialize(serialized);

			expect(result.value).toBe(null);
		});

		test("should deserialize Infinity (becomes null)", () => {
			const original = { value: Number.POSITIVE_INFINITY };

			const serialized = serialize(original);
			const result = deserialize(serialized);

			expect(result.value).toBe(null);
		});

		test("should deserialize mixed null and valid values without data loss", () => {
			const original = {
				user: {
					name: faker.person.fullName(),
					deletedAt: null,
					profile: {
						bio: faker.lorem.sentence(),
						avatar: null,
					},
				},
				tags: [faker.lorem.word(), null, faker.lorem.word()],
			};
			const result = deserialize(serialize(original));
			expect(result).toEqual(original);
		});

		test("should deserialize arrays with various falsy values without data loss", () => {
			const original = [0, "", false, null, faker.lorem.word()];
			const result = deserialize(serialize(original));
			expect(result).toEqual(original);
		});

		test("should deserialize very large arrays without data loss", () => {
			const original = Array.from({ length: 1000 }, (_, i) => ({
				id: i,
				value: faker.lorem.word(),
			}));
			const result = deserialize(serialize(original));
			expect(result).toHaveLength(1000);
			expect(result[0]).toEqual(original[0]);
			expect(result[500]).toEqual(original[500]);
			expect(result[999]).toEqual(original[999]);
		});

		test("should deserialize negative zero", () => {
			const original = { value: -0 };
			const result = deserialize(serialize(original));
			// JSON doesn't distinguish -0 from 0
			expect(result.value).toBe(0);
		});

		test("should deserialize very small and very large numbers without precision loss", () => {
			const original = {
				small: Number.MIN_VALUE,
				large: Number.MAX_VALUE,
				safeInt: Number.MAX_SAFE_INTEGER,
			};
			const result = deserialize(serialize(original));
			expect(result).toEqual(original);
		});

		test("should throw on missing $data key", () => {
			const invalidFormData = new FormData();
			invalidFormData.set("someKey", "someValue");

			expect(() => deserialize(invalidFormData)).toThrow("No data found in FormData");
		});

		test("should throw on invalid JSON in $data", () => {
			const invalidFormData = new FormData();
			invalidFormData.set(DEFAULT_REFERENCE_PREFIX.data, "invalid json {");

			expect(() => deserialize(invalidFormData)).toThrow();
		});

		test("should deserialize Blob with special characters in content", async () => {
			const content = "Special: \n\t\r chars and 🎉";
			const original = new Blob([content], { type: "text/plain" });
			const result = deserialize(serialize({ file: original }));
			expect(result.file).toBeInstanceOf(Blob);
			expect(await result.file.text()).toBe(content);
		});

		test("should deserialize empty string keys without data loss", () => {
			const original = {
				"": faker.lorem.word(),
				normal: faker.lorem.word(),
			};
			const result = deserialize(serialize(original));
			expect(result).toEqual(original);
		});

		test("should preserve data through multiple serialize/deserialize cycles", async () => {
			const content = faker.lorem.paragraph();
			const original = {
				string: faker.lorem.word(),
				number: faker.number.float(),
				boolean: true,
				null: null,
				blob: new Blob([content], { type: "text/plain" }),
				date: faker.date.recent(),
				bigInt: BigInt(123456789),
				nested: {
					array: [1, 2, 3],
				},
			};

			// First cycle
			const deserialized1 = deserialize(
				serialize(original, { extensions: [DateExtension, BigIntExtension] }),
				{ extensions: [DateExtension, BigIntExtension] }
			);

			// Second cycle
			const deserialized2 = deserialize(
				serialize(deserialized1, { extensions: [DateExtension, BigIntExtension] }),
				{ extensions: [DateExtension, BigIntExtension] }
			);

			// Verify all data preserved
			expect(deserialized2.string).toBe(original.string);
			expect(deserialized2.number).toBe(original.number);
			expect(deserialized2.boolean).toBe(original.boolean);
			expect(deserialized2.null).toBe(null);
			expect(deserialized2.date).toBeInstanceOf(Date);
			expect(deserialized2.date.getTime()).toBe(original.date.getTime());
			expect(deserialized2.bigInt).toBe(original.bigInt);
			expect(deserialized2.nested).toEqual(original.nested);
			expect(await deserialized2.blob.text()).toBe(content);
		});
	});
});

