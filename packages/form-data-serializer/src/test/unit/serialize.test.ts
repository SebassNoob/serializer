import { beforeEach, describe, expect, test } from "bun:test";
import { faker } from "@faker-js/faker";
import { type SerializationExtension, serialize } from "@/serialize-refactor";
import { BigIntExtension, DateExtension, ErrorExtension, SymbolExtension } from "@/extensions-refactor";
import { DEFAULT_REFERENCE_PREFIX } from "@/serialize-refactor/constants";

describe("serialize", () => {
	beforeEach(() => {
		// Reset faker seed for consistent tests
		faker.seed(123);
	});

	describe("primitives", () => {
		test("should serialize string", () => {
			const str = faker.lorem.word();
			const result = serialize(str);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toBe(str);
		});

		test("should serialize number (float)", () => {
			const num = faker.number.float();
			const result = serialize(num);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toBe(num);
		});

		test("should serialize number (integer)", () => {
			const num = faker.number.int();
			const result = serialize(num);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toBe(num);
		});

		test("should serialize boolean true", () => {
			const result = serialize(true);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toBe(true);
		});

		test("should serialize boolean false", () => {
			const result = serialize(false);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toBe(false);
		});

		test("should serialize null", () => {
			const result = serialize(null);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toBe(null);
		});

		test("should throw error for undefined", () => {
			expect(() => serialize(undefined)).toThrow("Cannot serialize undefined value");
		});

		test("should serialize zero", () => {
			const result = serialize(0);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toBe(0);
		});

		test("should serialize empty string", () => {
			const result = serialize("");

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toBe("");
		});

		test("should serialize negative number", () => {
			const num = -faker.number.int({ max: 1000 });
			const result = serialize(num);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toBe(num);
		});
	});

	describe("objects", () => {
		test("should serialize simple object", () => {
			const obj = {
				name: faker.person.fullName(),
				age: faker.number.int({ min: 18, max: 100 }),
				active: faker.datatype.boolean(),
			};

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toEqual(obj);
		});

		test("should serialize nested object", () => {
			const obj = {
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

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toEqual(obj);
		});

		test("should serialize empty object", () => {
			const obj = {};

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toEqual(obj);
		});

		test("should omit undefined values in object", () => {
			const obj = {
				name: faker.person.fullName(),
				age: undefined,
				email: faker.internet.email(),
			};

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toEqual({
				name: obj.name,
				email: obj.email,
			});
			expect(dataValue).not.toHaveProperty("age");
		});

		test("should serialize object with null values", () => {
			const obj = {
				name: faker.person.fullName(),
				deletedAt: null,
				metadata: null,
			};

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toEqual(obj);
		});

		test("should serialize object with mixed types", () => {
			const obj = {
				string: faker.lorem.word(),
				number: faker.number.int(),
				boolean: faker.datatype.boolean(),
				null: null,
				array: [1, 2, 3],
				nested: {
					key: faker.lorem.word(),
				},
			};

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toEqual(obj);
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

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toEqual(arr);
		});

		test("should serialize array of objects", () => {
			const arr = Array.from({ length: 3 }, () => ({
				name: faker.person.fullName(),
				age: faker.number.int({ min: 18, max: 100 }),
			}));

			const result = serialize(arr);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toEqual(arr);
		});

		test("should serialize nested arrays", () => {
			const arr = [
				[1, 2, 3],
				[4, 5, 6],
				[[7, 8], [9, 10]],
			];

			const result = serialize(arr);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toEqual(arr);
		});

		test("should serialize empty array", () => {
			const arr: unknown[] = [];

			const result = serialize(arr);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toEqual(arr);
		});

		test("should serialize array with null values", () => {
			const arr = [
				faker.lorem.word(),
				null,
				faker.number.int(),
				null,
			];

			const result = serialize(arr);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toEqual(arr);
		});

		test("should serialize sparse array (holes become undefined, then omitted)", () => {
			const arr = [1, , 3]; // eslint-disable-line no-sparse-arrays
			
			const result = serialize(arr);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			// JSON.stringify converts undefined to null in arrays
			expect(dataValue).toEqual([1, null, 3]);
		});
	});

	describe("Blob handling", () => {
		test("should serialize single Blob", () => {
			const content = faker.lorem.paragraph();
			const blob = new Blob([content], { type: "text/plain" });

			const result = serialize(blob);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toMatch(/^\$ref:blob:/);
			expect(result.has(dataValue)).toBe(true);
		});

		test("should serialize object containing Blob", () => {
			const content = faker.lorem.paragraph();
			const obj = {
				name: faker.person.fullName(),
				avatar: new Blob([content], { type: "image/png" }),
				active: true,
			};

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue.name).toBe(obj.name);
			expect(dataValue.active).toBe(true);
			expect(dataValue.avatar).toMatch(/^\$ref:blob:/);
			expect(result.has(dataValue.avatar)).toBe(true);
		});

		test("should serialize array containing Blobs", () => {
			const blobs = Array.from({ length: 3 }, () =>
				new Blob([faker.lorem.paragraph()], { type: "text/plain" }),
			);

			const result = serialize(blobs);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(Array.isArray(dataValue)).toBe(true);
			expect(dataValue).toHaveLength(3);
			dataValue.forEach((ref: string) => {
				expect(ref).toMatch(/^\$ref:blob:/);
				expect(result.has(ref)).toBe(true);
			});
		});

		test("should serialize File objects", () => {
			const content = faker.lorem.paragraph();
			const fileName = faker.system.fileName();
			const file = new File([content], fileName, { type: "text/plain" });

			const result = serialize(file);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toMatch(/^\$ref:blob:/);
			expect(result.has(dataValue)).toBe(true);
			
			// Verify the File object is stored in FormData
			const storedFile = result.get(dataValue);
			expect(storedFile).toBeInstanceOf(File);
			expect((storedFile as File).name).toBe(fileName);
			// Note: FormData may add charset to the type
			expect((storedFile as File).type).toContain("text/plain");
		});

		test("should preserve File name attribute", () => {
			const fileName = "test-document.pdf";
			const file = new File([faker.lorem.paragraph()], fileName, { type: "application/pdf" });

			const result = serialize({ document: file });

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			const storedFile = result.get(dataValue.document);
			
			expect(storedFile).toBeInstanceOf(File);
			expect((storedFile as File).name).toBe(fileName);
		});

		test("should preserve File type attribute", () => {
			const file = new File(
				[faker.lorem.paragraph()],
				faker.system.fileName(),
				{ type: "image/jpeg" }
			);

			const result = serialize(file);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			const storedFile = result.get(dataValue);
			
			expect(storedFile).toBeInstanceOf(File);
			expect((storedFile as File).type).toBe("image/jpeg");
		});

		test("should preserve File lastModified attribute", () => {
			const lastModified = Date.now();
			const file = new File(
				[faker.lorem.paragraph()],
				faker.system.fileName(),
				{ type: "text/plain", lastModified }
			);

			const result = serialize(file);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			const storedFile = result.get(dataValue);
			
			expect(storedFile).toBeInstanceOf(File);
			expect((storedFile as File).lastModified).toBe(lastModified);
		});

		test("should preserve all File attributes simultaneously", () => {
			const fileName = "report-2025.docx";
			const fileType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
			const lastModified = Date.now() - 86400000; // 1 day ago
			const content = faker.lorem.paragraphs(5);

			const file = new File([content], fileName, { type: fileType, lastModified });

			const result = serialize({ attachment: file });

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			const storedFile = result.get(dataValue.attachment);
			
			expect(storedFile).toBeInstanceOf(File);
			expect((storedFile as File).name).toBe(fileName);
			expect((storedFile as File).type).toBe(fileType);
			expect((storedFile as File).lastModified).toBe(lastModified);
		});

		test("should preserve File attributes in array of Files", () => {
			const files = [
				new File([faker.lorem.paragraph()], "file1.txt", { type: "text/plain", lastModified: 1000 }),
				new File([faker.lorem.paragraph()], "file2.json", { type: "application/json", lastModified: 2000 }),
				new File([faker.lorem.paragraph()], "file3.png", { type: "image/png", lastModified: 3000 }),
			];

			const result = serialize(files);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			
			dataValue.forEach((ref: string, index: number) => {
				const storedFile = result.get(ref);
				expect(storedFile).toBeInstanceOf(File);
				expect((storedFile as File).name).toBe(files[index].name);
				expect((storedFile as File).type).toBe(files[index].type);
				expect((storedFile as File).lastModified).toBe(files[index].lastModified);
			});
		});

		test("should handle File with empty name", () => {
			const file = new File([faker.lorem.paragraph()], "", { type: "text/plain" });

			const result = serialize(file);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			const storedFile = result.get(dataValue);
			
			expect(storedFile).toBeInstanceOf(File);
			// Note: Empty file name may become undefined in some implementations
			const name = (storedFile as File).name;
			expect(name === "" || name === undefined).toBe(true);
		});

		test("should handle File with special characters in name", () => {
			const fileName = "file (1) - copy [final].txt";
			const file = new File([faker.lorem.paragraph()], fileName, { type: "text/plain" });

			const result = serialize({ upload: file });

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			const storedFile = result.get(dataValue.upload);
			
			expect(storedFile).toBeInstanceOf(File);
			expect((storedFile as File).name).toBe(fileName);
		});

		test("should handle File with unicode characters in name", () => {
			const fileName = "документ-文件-📄.pdf";
			const file = new File([faker.lorem.paragraph()], fileName, { type: "application/pdf" });

			const result = serialize(file);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			const storedFile = result.get(dataValue);
			
			expect(storedFile).toBeInstanceOf(File);
			expect((storedFile as File).name).toBe(fileName);
		});

		test("should handle File with very long name", () => {
			const fileName = "a".repeat(255) + ".txt";
			const file = new File([faker.lorem.paragraph()], fileName, { type: "text/plain" });

			const result = serialize(file);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			const storedFile = result.get(dataValue);
			
			expect(storedFile).toBeInstanceOf(File);
			expect((storedFile as File).name).toBe(fileName);
		});

		test("should differentiate between File and Blob", () => {
			const content = faker.lorem.paragraph();
			const file = new File([content], "document.txt", { type: "text/plain" });
			const blob = new Blob([content], { type: "text/plain" });

			const result = serialize({ file, blob });

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			const storedFile = result.get(dataValue.file);
			const storedBlob = result.get(dataValue.blob);
			
			expect(storedFile).toBeInstanceOf(File);
			expect((storedFile as File).name).toBe("document.txt");
			
			expect(storedBlob).toBeInstanceOf(Blob);
			// Blob doesn't have a name property
			expect((storedBlob as any).name).toBeUndefined();
		});

		test("should preserve File attributes in nested structure", () => {
			const files = {
				profile: {
					avatar: new File([faker.lorem.paragraph()], "avatar.jpg", { 
						type: "image/jpeg",
						lastModified: 1000 
					}),
					resume: new File([faker.lorem.paragraph()], "resume.pdf", { 
						type: "application/pdf",
						lastModified: 2000 
					}),
				},
			};

			const result = serialize(files);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			
			const avatarFile = result.get(dataValue.profile.avatar);
			expect(avatarFile).toBeInstanceOf(File);
			expect((avatarFile as File).name).toBe("avatar.jpg");
			expect((avatarFile as File).type).toBe("image/jpeg");
			expect((avatarFile as File).lastModified).toBe(1000);
			
			const resumeFile = result.get(dataValue.profile.resume);
			expect(resumeFile).toBeInstanceOf(File);
			expect((resumeFile as File).name).toBe("resume.pdf");
			expect((resumeFile as File).type).toBe("application/pdf");
			expect((resumeFile as File).lastModified).toBe(2000);
		});

		test("should serialize empty Blob", () => {
			const blob = new Blob([], { type: "text/plain" });

			const result = serialize(blob);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toMatch(/^\$ref:blob:/);
			expect(result.has(dataValue)).toBe(true);
		});

		test("should serialize Blob without explicit type", () => {
			const blob = new Blob([faker.lorem.paragraph()]);

			const result = serialize(blob);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toMatch(/^\$ref:blob:/);
			expect(result.has(dataValue)).toBe(true);
		});

		test("should serialize Blob with various MIME types", () => {
			const types = ["application/json", "image/jpeg", "video/mp4", "application/pdf"];
			const blobs = types.map(type => new Blob([faker.lorem.paragraph()], { type }));

			const result = serialize({ files: blobs });

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue.files).toHaveLength(4);
			dataValue.files.forEach((ref: string) => {
				expect(ref).toMatch(/^\$ref:blob:/);
				expect(result.has(ref)).toBe(true);
			});
		});

		test("should serialize large Blob", () => {
			// Create a ~1MB blob
			const largeContent = faker.lorem.paragraphs(1000);
			const blob = new Blob([largeContent], { type: "text/plain" });

			const result = serialize(blob);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toMatch(/^\$ref:blob:/);
			expect(result.has(dataValue)).toBe(true);
		});

		test("should serialize Blob from multiple parts", () => {
			const parts = [
				faker.lorem.paragraph(),
				new Uint8Array([1, 2, 3, 4, 5]),
				faker.lorem.paragraph(),
			];
			const blob = new Blob(parts, { type: "application/octet-stream" });

			const result = serialize(blob);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toMatch(/^\$ref:blob:/);
			expect(result.has(dataValue)).toBe(true);
		});

		test("should serialize object with multiple Blobs having same content", () => {
			const content = faker.lorem.paragraph();
			const obj = {
				blob1: new Blob([content], { type: "text/plain" }),
				blob2: new Blob([content], { type: "text/plain" }),
			};

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue.blob1).toMatch(/^\$ref:blob:/);
			expect(dataValue.blob2).toMatch(/^\$ref:blob:/);
			// Should create separate references even with same content
			expect(dataValue.blob1).not.toBe(dataValue.blob2);
			expect(result.has(dataValue.blob1)).toBe(true);
			expect(result.has(dataValue.blob2)).toBe(true);
		});

		test("should serialize nested objects with Blobs at different levels", () => {
			const obj = {
				level1: {
					file: new Blob([faker.lorem.paragraph()], { type: "text/plain" }),
					level2: {
						file: new Blob([faker.lorem.paragraph()], { type: "image/png" }),
						level3: {
							file: new Blob([faker.lorem.paragraph()], { type: "application/json" }),
						},
					},
				},
			};

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue.level1.file).toMatch(/^\$ref:blob:/);
			expect(dataValue.level1.level2.file).toMatch(/^\$ref:blob:/);
			expect(dataValue.level1.level2.level3.file).toMatch(/^\$ref:blob:/);
			expect(result.has(dataValue.level1.file)).toBe(true);
			expect(result.has(dataValue.level1.level2.file)).toBe(true);
			expect(result.has(dataValue.level1.level2.level3.file)).toBe(true);
		});

		test("should serialize array of mixed Files and Blobs", () => {
			const items = [
				new Blob([faker.lorem.paragraph()], { type: "text/plain" }),
				new File([faker.lorem.paragraph()], faker.system.fileName(), { type: "image/png" }),
				new Blob([faker.lorem.paragraph()], { type: "application/json" }),
				new File([faker.lorem.paragraph()], faker.system.fileName(), { type: "video/mp4" }),
			];

			const result = serialize(items);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toHaveLength(4);
			dataValue.forEach((ref: string) => {
				expect(ref).toMatch(/^\$ref:blob:/);
				expect(result.has(ref)).toBe(true);
			});
		});

		test("should serialize object with Blob as property value null fallback", () => {
			const obj = {
				name: faker.person.fullName(),
				document: new Blob([faker.lorem.paragraph()], { type: "application/pdf" }),
				backup: null,
			};

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue.name).toBe(obj.name);
			expect(dataValue.document).toMatch(/^\$ref:blob:/);
			expect(dataValue.backup).toBeNull();
			expect(result.has(dataValue.document)).toBe(true);
		});
	});

	describe("extension handling", () => {
		test("should serialize Date with DateExtension", () => {
			const date = faker.date.recent();
			const result = serialize(date, { extensions: [DateExtension] });

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toMatch(/^\$ref:date:/);

			const entries = Array.from(result.entries());
			const extEntry = entries.find(([key]) => key.startsWith("$ref:date:"));
			expect(extEntry).toBeDefined();
			expect(JSON.parse(extEntry?.[1] as string)).toBe(date.toISOString());
		});

		test("should serialize BigInt with BigIntExtension", () => {
			const bigInt = BigInt(faker.number.bigInt());
			const result = serialize(bigInt, { extensions: [BigIntExtension] });

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toMatch(/^\$ref:bigint:/);

			const entries = Array.from(result.entries());
			const extEntry = entries.find(([key]) => key.startsWith("$ref:bigint:"));
			expect(extEntry).toBeDefined();
			expect(JSON.parse(extEntry?.[1] as string)).toBe(bigInt.toString());
		});

		test("should serialize object with multiple extension types", () => {
			const date = faker.date.recent();
			const bigInt = BigInt(faker.number.bigInt());
			const obj = {
				name: faker.person.fullName(),
				count: faker.number.int(),
				createdAt: date,
				id: bigInt,
			};

			const result = serialize(obj, { extensions: [DateExtension, BigIntExtension] });

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue.name).toBe(obj.name);
			expect(dataValue.count).toBe(obj.count);
			expect(dataValue.createdAt).toMatch(/^\$ref:date:/);
			expect(dataValue.id).toMatch(/^\$ref:bigint:/);
		});

		test("should serialize custom extension", () => {
			const customData = { special: faker.lorem.sentence() };
			const customExtension: SerializationExtension<typeof customData> = {
				name: "custom",
				serialize: (value) => JSON.stringify(value),
				deserialize: (value) => JSON.parse(value as string),
				canHandle: (value): value is typeof customData =>
					typeof value === "object" && value !== null && "special" in value,
			};

			const result = serialize(customData, { extensions: [customExtension] });

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toMatch(/^\$ref:custom:/);

			const entries = Array.from(result.entries());
			const extEntry = entries.find(([key]) => key.startsWith("$ref:custom:"));
			expect(typeof extEntry?.[1]).toBe("string");
		});

		test("should handle extension priority (first matching extension wins)", () => {
			const date = faker.date.recent();

			const altDateExtension: SerializationExtension<Date> = {
				name: "alt-date",
				serialize: (date) => date.getTime().toString(),
				deserialize: (value) => new Date(Number.parseInt(value as string, 10)),
				canHandle: (value): value is Date => value instanceof Date,
			};

			// First extension should win
			const result = serialize(date, { extensions: [DateExtension, altDateExtension] });

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toMatch(/^\$ref:date:/);
			expect(dataValue).not.toMatch(/^\$ref:alt-date:/);
		});
	});

	describe("complex nested structures", () => {
		test("should serialize complex mixed data with Blobs and extensions", () => {
			const content1 = faker.lorem.paragraph();
			const content2 = faker.lorem.paragraph();
			const blob1 = new Blob([content1], { type: "text/plain" });
			const blob2 = new Blob([content2], { type: "text/plain" });
			const date1 = faker.date.recent();
			const date2 = faker.date.recent();
			const bigInt = BigInt(faker.number.bigInt());

			const complexObj = {
				metadata: {
					created: date1,
					id: bigInt,
					tags: [faker.lorem.word(), faker.lorem.word()],
					files: [blob1, blob2],
				},
				users: [
					{
						name: faker.person.fullName(),
						joinDate: date2,
						avatar: new Blob([faker.lorem.paragraph()], { type: "image/png" }),
					},
					{
						name: faker.person.fullName(),
						joinDate: faker.date.recent(),
						avatar: new Blob([faker.lorem.paragraph()], { type: "image/png" }),
					},
				],
				settings: {
					theme: faker.helpers.arrayElement(["light", "dark"]),
					notifications: faker.datatype.boolean(),
				},
			};

			const result = serialize(complexObj, { extensions: [DateExtension, BigIntExtension] });

			// Verify structure
			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);

			// Check extensions were handled
			expect(dataValue.metadata.created).toMatch(/^\$ref:date:/);
			expect(dataValue.metadata.id).toMatch(/^\$ref:bigint:/);
			expect(dataValue.users[0].joinDate).toMatch(/^\$ref:date:/);
			expect(dataValue.users[1].joinDate).toMatch(/^\$ref:date:/);

			// Check blobs were replaced with references
			expect(dataValue.metadata.files[0]).toMatch(/^\$ref:blob:/);
			expect(dataValue.metadata.files[1]).toMatch(/^\$ref:blob:/);
			expect(dataValue.users[0].avatar).toMatch(/^\$ref:blob:/);
			expect(dataValue.users[1].avatar).toMatch(/^\$ref:blob:/);

			// Check primitive values preserved
			expect(dataValue.metadata.tags).toEqual(complexObj.metadata.tags);
			expect(dataValue.settings).toEqual(complexObj.settings);

			// Count form data entries
			const entries = Array.from(result.entries());
			const refEntries = entries.filter(([key]) => key.startsWith("$ref:blob:"));
			const extEntries = entries.filter(([key]) => key.startsWith("$ref:"));

			expect(refEntries).toHaveLength(4); // 4 blobs
			expect(extEntries).toHaveLength(8); // 3 dates + 1 bigint + 4 blobs
		});

		test("should serialize deeply nested structures", () => {
			const content = faker.lorem.paragraph();
			const deepObj = {
				level1: {
					level2: {
						level3: {
							level4: {
								level5: {
									value: faker.lorem.word(),
									blob: new Blob([content], { type: "text/plain" }),
								},
							},
						},
					},
				},
			};

			const result = serialize(deepObj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue.level1.level2.level3.level4.level5.value).toBe(
				deepObj.level1.level2.level3.level4.level5.value,
			);
			expect(dataValue.level1.level2.level3.level4.level5.blob).toMatch(/^\$ref:blob:/);
		});

		test("should serialize array of objects with Blobs", () => {
			const users = Array.from({ length: 3 }, () => ({
				name: faker.person.fullName(),
				email: faker.internet.email(),
				avatar: new Blob([faker.lorem.paragraph()], { type: "image/png" }),
			}));

			const result = serialize(users);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(Array.isArray(dataValue)).toBe(true);
			expect(dataValue).toHaveLength(3);

			dataValue.forEach((user: any, index: number) => {
				expect(user.name).toBe(users[index].name);
				expect(user.email).toBe(users[index].email);
				expect(user.avatar).toMatch(/^\$ref:blob:/);
			});
		});
	});

	describe("edge cases", () => {
		test("should handle empty extensions array", () => {
			const obj = { name: faker.person.fullName() };
			const serialized = serialize(obj, { extensions: [] });

			const dataValue = JSON.parse(serialized.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toEqual(obj);
		});

		test("should handle no extensions parameter", () => {
			const obj = { name: faker.person.fullName() };
			const serialized = serialize(obj);

			const dataValue = JSON.parse(serialized.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toEqual(obj);
		});

		test("should handle very large arrays", () => {
			const largeArray = Array.from({ length: 1000 }, (_, i) => ({
				id: i,
				value: faker.lorem.word(),
			}));

			const result = serialize(largeArray);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toHaveLength(1000);
			expect(dataValue[0]).toEqual(largeArray[0]);
			expect(dataValue[999]).toEqual(largeArray[999]);
		});

		test("should handle objects with numeric keys", () => {
			const obj = {
				0: faker.lorem.word(),
				1: faker.lorem.word(),
				2: faker.lorem.word(),
			};

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toEqual(obj);
		});

		test("should handle objects with special characters in keys", () => {
			const obj = {
				"key-with-dash": faker.lorem.word(),
				"key.with.dots": faker.lorem.word(),
				"key with spaces": faker.lorem.word(),
				"key@special#chars": faker.lorem.word(),
			};

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toEqual(obj);
		});

		test("should handle unicode strings", () => {
			const obj = {
				emoji: "🚀 👋 🎉",
				chinese: "你好世界",
				arabic: "مرحبا بالعالم",
				japanese: "こんにちは世界",
			};

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toEqual(obj);
		});

		test("should handle very long strings", () => {
			const longString = faker.lorem.paragraphs(100);
			const obj = { content: longString };

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue.content).toBe(longString);
		});

		test("should handle NaN (becomes null in JSON)", () => {
			const obj = { value: Number.NaN };

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue.value).toBe(null);
		});

		test("should handle Infinity (becomes null in JSON)", () => {
			const obj = { value: Number.POSITIVE_INFINITY };

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue.value).toBe(null);
		});

		test("should validate extension names and throw on invalid names", () => {
			const invalidExtension: SerializationExtension<unknown> = {
				name: "invalid:name",
				serialize: () => "",
				deserialize: () => null,
				canHandle: (value): value is unknown => false,
			};

			expect(() => serialize({}, { extensions: [invalidExtension] })).toThrow(
				"Extension name 'invalid:name' cannot contain colon (:) character",
			);
		});

		test("should throw on duplicate extension names", () => {
			const date = faker.date.recent();

			const ext1: SerializationExtension<Date> = {
				name: "date",
				serialize: (d) => "ext1:" + d.toISOString(),
				deserialize: (v) => new Date(v as string),
				canHandle: (v): v is Date => v instanceof Date,
			};

			const ext2: SerializationExtension<Date> = {
				name: "date",
				serialize: (d) => "ext2:" + d.toISOString(),
				deserialize: (v) => new Date(v as string),
				canHandle: (v): v is Date => v instanceof Date,
			};

			// Should throw on duplicate extension names
			expect(() => serialize(date, { extensions: [ext1, ext2] })).toThrow(
				"Duplicate extension name found: 'date'",
			);
		});

		test("should handle mixed null and valid values in nested structure", () => {
			const obj = {
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

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toEqual(obj);
		});

		test("should handle circular reference-like structures (non-circular but repeated objects)", () => {
			const sharedObj = { value: faker.lorem.word() };
			const obj = {
				ref1: sharedObj,
				ref2: sharedObj, // Same object reference
			};

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			// Both should have the same value, but are serialized separately
			expect(dataValue.ref1).toEqual(sharedObj);
			expect(dataValue.ref2).toEqual(sharedObj);
		});

		test("should handle objects with Symbol keys (ignored by JSON.stringify)", () => {
			const sym = Symbol("test");
			const obj = {
				normalKey: faker.lorem.word(),
				[sym]: "this will be ignored",
			};

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue.normalKey).toBe(obj.normalKey);
			expect(dataValue[sym as any]).toBeUndefined();
		});

		test("should handle Date objects without DateExtension (becomes ISO string)", () => {
			const date = faker.date.recent();
			const obj = { createdAt: date };

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			// Without extension, Date.toJSON() is called, returning ISO string
			expect(dataValue.createdAt).toBe(date.toISOString());
		});

		test("should handle objects with toJSON method", () => {
			const customObj = {
				value: faker.lorem.word(),
				secret: faker.lorem.word(),
				toJSON() {
					return { value: this.value }; // Exclude secret
				},
			};

			const result = serialize(customObj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue.value).toBe(customObj.value);
			expect(dataValue.secret).toBeUndefined();
		});

		test("should handle arrays with various falsy values", () => {
			const arr = [0, "", false, null, faker.lorem.word()];

			const result = serialize(arr);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toEqual(arr);
		});

		test("should handle very deeply nested objects", () => {
			let deepObj: any = { value: faker.lorem.word() };
			for (let i = 0; i < 50; i++) {
				deepObj = { nested: deepObj };
			}

			const result = serialize(deepObj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			let current = dataValue;
			for (let i = 0; i < 50; i++) {
				expect(current.nested).toBeDefined();
				current = current.nested;
			}
		});

		test("should handle array with single Blob element", () => {
			const blob = new Blob([faker.lorem.paragraph()], { type: "text/plain" });
			const arr = [blob];

			const result = serialize(arr);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toHaveLength(1);
			expect(dataValue[0]).toMatch(/^\$ref:blob:/);
			expect(result.has(dataValue[0])).toBe(true);
		});

		test("should handle object with only Blob properties", () => {
			const obj = {
				blob1: new Blob([faker.lorem.paragraph()], { type: "text/plain" }),
				blob2: new Blob([faker.lorem.paragraph()], { type: "image/png" }),
			};

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue.blob1).toMatch(/^\$ref:blob:/);
			expect(dataValue.blob2).toMatch(/^\$ref:blob:/);
			expect(result.has(dataValue.blob1)).toBe(true);
			expect(result.has(dataValue.blob2)).toBe(true);
		});

		test("should handle mixing Blobs and extensions in same object", () => {
			const obj = {
				document: new Blob([faker.lorem.paragraph()], { type: "application/pdf" }),
				createdAt: faker.date.recent(),
				count: BigInt(faker.number.bigInt()),
			};

			const result = serialize(obj, { extensions: [DateExtension, BigIntExtension] });

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue.document).toMatch(/^\$ref:blob:/);
			expect(dataValue.createdAt).toMatch(/^\$ref:date:/);
			expect(dataValue.count).toMatch(/^\$ref:bigint:/);
			expect(result.has(dataValue.document)).toBe(true);
			expect(result.has(dataValue.createdAt)).toBe(true);
			expect(result.has(dataValue.count)).toBe(true);
		});

		test("should handle empty string keys", () => {
			const obj = {
				"": faker.lorem.word(),
				normal: faker.lorem.word(),
			};

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue[""]).toBe(obj[""]);
			expect(dataValue.normal).toBe(obj.normal);
		});

		test("should handle object with prototype chain properties", () => {
			class Parent {
				parentProp = faker.lorem.word();
			}
			class Child extends Parent {
				childProp = faker.lorem.word();
			}

			const obj = new Child();
			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			// JSON.stringify only serializes own properties
			expect(dataValue.childProp).toBe(obj.childProp);
			expect(dataValue.parentProp).toBe(obj.parentProp);
		});

		test("should handle negative zero", () => {
			const obj = { value: -0 };

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			// JSON doesn't distinguish -0 from 0
			expect(dataValue.value).toBe(0);
		});

		test("should handle very small and very large numbers", () => {
			const obj = {
				small: Number.MIN_VALUE,
				large: Number.MAX_VALUE,
				safeInt: Number.MAX_SAFE_INTEGER,
			};

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue.small).toBe(obj.small);
			expect(dataValue.large).toBe(obj.large);
			expect(dataValue.safeInt).toBe(obj.safeInt);
		});

		test("should handle array-like objects", () => {
			const arrayLike = {
				0: faker.lorem.word(),
				1: faker.lorem.word(),
				2: faker.lorem.word(),
				length: 3,
			};

			const result = serialize(arrayLike);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toEqual(arrayLike);
		});

		test("should handle Map-like plain objects", () => {
			const obj = {
				[faker.lorem.word()]: faker.lorem.word(),
				[faker.lorem.word()]: faker.lorem.word(),
			};

			const result = serialize(obj);

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue).toEqual(obj);
		});

		test("should handle Blob with special characters in content", () => {
			const content = "Special: \n\t\r\0 chars and 🎉";
			const blob = new Blob([content], { type: "text/plain" });

			const result = serialize({ file: blob });

			const dataValue = JSON.parse(result.get(DEFAULT_REFERENCE_PREFIX.data) as string);
			expect(dataValue.file).toMatch(/^\$ref:blob:/);
			expect(result.has(dataValue.file)).toBe(true);
		});
	});
});


