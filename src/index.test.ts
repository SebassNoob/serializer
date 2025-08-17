import { describe, test, expect } from "bun:test";
import { faker } from "@faker-js/faker";
import { serialize } from "./index";

describe("serialize", () => {
	test("should serialize primitive types with key:type format", () => {
		const name = faker.person.fullName();
		const age = faker.number.int({ min: 18, max: 100 });
		const isActive = faker.datatype.boolean();
		
		const data = {
			name,
			age,
			isActive,
			value: null,
		};

		const result = serialize(data);

		expect(result.get("name:string")).toBe(name);
		expect(result.get("age:number")).toBe(age.toString());
		expect(result.get("isActive:boolean")).toBe(isActive.toString());
		expect(result.get("value:null")).toBe("null");
	});

	test("should serialize Date and URL types", () => {
		const date = faker.date.recent();
		const url = new URL(faker.internet.url());
		
		const data = {
			createdAt: date,
			website: url,
		};

		const result = serialize(data);

		expect(result.get("createdAt:Date")).toBe(date.toISOString());
		expect(result.get("website:URL")).toBe(url.toString());
	});

	test("should serialize Blob type", () => {
		const content = faker.lorem.sentence();
		const blob = new Blob([content], { type: "text/plain" });
		
		const data = {
			file: blob,
		};

		const result = serialize(data);

		expect(result.get("file:Blob")).toBeInstanceOf(Blob);
	});

	test("should serialize Blob arrays", () => {
		const content1 = faker.lorem.sentence();
		const content2 = faker.lorem.sentence();
		const content3 = faker.lorem.sentence();
		
		const blob1 = new Blob([content1], { type: "text/plain" });
		const blob2 = new Blob([content2], { type: "application/json" });
		const blob3 = new Blob([content3], { type: "text/html" });
		
		const data = {
			files: [blob1, blob2, blob3],
		};

		const result = serialize(data);

		// Check array type info
		expect(result.get("files:Blob[]")).toBe("[3]");

		// Check individual blob elements
		expect(result.get("files[0]:Blob")).toBeInstanceOf(Blob);
		expect(result.get("files[1]:Blob")).toBeInstanceOf(Blob);
		expect(result.get("files[2]:Blob")).toBeInstanceOf(Blob);

		// Verify the blobs are the correct ones (note: Blob constructor may add charset)
		const retrievedBlob1 = result.get("files[0]:Blob") as Blob;
		const retrievedBlob2 = result.get("files[1]:Blob") as Blob;
		const retrievedBlob3 = result.get("files[2]:Blob") as Blob;

		expect(retrievedBlob1.type).toContain("text/plain");
		expect(retrievedBlob2.type).toContain("application/json");
		expect(retrievedBlob3.type).toContain("text/html");
		
		// Verify sizes are correct
		expect(retrievedBlob1.size).toBe(blob1.size);
		expect(retrievedBlob2.size).toBe(blob2.size);
		expect(retrievedBlob3.size).toBe(blob3.size);
	});

	test("should serialize mixed arrays containing Blobs", () => {
		const text = faker.lorem.word();
		const number = faker.number.int();
		const boolean = faker.datatype.boolean();
		const content = faker.lorem.sentence();
		
		const blob = new Blob([content], { type: "text/plain" });
		const data = {
			mixedWithBlob: [text, number, blob, boolean],
		};

		const result = serialize(data);

		// Mixed arrays should be generic array type
		expect(result.get("mixedWithBlob:array")).toBe("[4]");

		// Individual elements should maintain their types
		expect(result.get("mixedWithBlob[0]:string")).toBe(text);
		expect(result.get("mixedWithBlob[1]:number")).toBe(number.toString());
		expect(result.get("mixedWithBlob[2]:Blob")).toBeInstanceOf(Blob);
		expect(result.get("mixedWithBlob[3]:boolean")).toBe(boolean.toString());
	});

	test("should serialize simple arrays with proper type detection", () => {
		const numbers = [
			faker.number.int(),
			faker.number.int(),
			faker.number.int()
		];
		const strings = [
			faker.lorem.word(),
			faker.lorem.word(),
			faker.lorem.word()
		];
		const booleans = [
			faker.datatype.boolean(),
			faker.datatype.boolean(),
			faker.datatype.boolean()
		];
		const nulls = [null, null];
		
		const data = {
			numbers,
			strings,
			booleans,
			nulls,
		};

		const result = serialize(data);

		// Check array type info
		expect(result.get("numbers:number[]")).toBe("[3]");
		expect(result.get("strings:string[]")).toBe("[3]");
		expect(result.get("booleans:boolean[]")).toBe("[3]");
		expect(result.get("nulls:null[]")).toBe("[2]");

		// Check individual elements
		expect(result.get("numbers[0]:number")).toBe(numbers[0]!.toString());
		expect(result.get("numbers[1]:number")).toBe(numbers[1]!.toString());
		expect(result.get("numbers[2]:number")).toBe(numbers[2]!.toString());

		expect(result.get("strings[0]:string")).toBe(strings[0]!);
		expect(result.get("strings[1]:string")).toBe(strings[1]!);
		expect(result.get("strings[2]:string")).toBe(strings[2]!);

		expect(result.get("booleans[0]:boolean")).toBe(booleans[0]!.toString());
		expect(result.get("booleans[1]:boolean")).toBe(booleans[1]!.toString());
		expect(result.get("booleans[2]:boolean")).toBe(booleans[2]!.toString());

		expect(result.get("nulls[0]:null")).toBe("null");
		expect(result.get("nulls[1]:null")).toBe("null");
	});

	test("should serialize mixed arrays as generic array type", () => {
		const number = faker.number.int();
		const text = faker.lorem.word();
		const boolean = faker.datatype.boolean();
		
		const data = {
			mixed: [number, text, boolean, null],
		};

		const result = serialize(data);

		// Mixed arrays should be typed as generic "array"
		expect(result.get("mixed:array")).toBe("[4]");

		// Individual elements should have their proper types
		expect(result.get("mixed[0]:number")).toBe(number.toString());
		expect(result.get("mixed[1]:string")).toBe(text);
		expect(result.get("mixed[2]:boolean")).toBe(boolean.toString());
		expect(result.get("mixed[3]:null")).toBe("null");
	});

	test("should serialize empty arrays", () => {
		const data = {
			empty: [],
		};

		const result = serialize(data);

		expect(result.get("empty:array")).toBe("[0]");
	});

	test("should serialize simple objects", () => {
		const name = faker.person.firstName();
		const age = faker.number.int({ min: 18, max: 100 });
		const active = faker.datatype.boolean();
		
		const data = {
			user: {
				name,
				age,
				active,
			},
		};

		const result = serialize(data);

		// Check object type info
		expect(result.get("user:object")).toBe("{3}");

		// Check individual properties
		expect(result.get("user[name]:string")).toBe(name);
		expect(result.get("user[age]:number")).toBe(age.toString());
		expect(result.get("user[active]:boolean")).toBe(active.toString());
	});

	test("should serialize nested arrays", () => {
		const matrix = [
			[faker.number.int(), faker.number.int()],
			[faker.number.int(), faker.number.int()],
			[faker.number.int(), faker.number.int()]
		];
		
		const data = {
			matrix,
		};

		const result = serialize(data);

		// Check main array - should now be properly detected as number[][]
		expect(result.get("matrix:number[][]")).toBe("[3]");

		// Check nested arrays
		expect(result.get("matrix[0]:number[]")).toBe("[2]");
		expect(result.get("matrix[1]:number[]")).toBe("[2]");
		expect(result.get("matrix[2]:number[]")).toBe("[2]");

		// Check individual elements
		expect(result.get("matrix[0][0]:number")).toBe(matrix[0]![0]!.toString());
		expect(result.get("matrix[0][1]:number")).toBe(matrix[0]![1]!.toString());
		expect(result.get("matrix[1][0]:number")).toBe(matrix[1]![0]!.toString());
		expect(result.get("matrix[1][1]:number")).toBe(matrix[1]![1]!.toString());
		expect(result.get("matrix[2][0]:number")).toBe(matrix[2]![0]!.toString());
		expect(result.get("matrix[2][1]:number")).toBe(matrix[2]![1]!.toString());
	});

	test("should properly detect deeply nested array types", () => {
		const data = {
			stringMatrix: [["a", "b"], ["c", "d"]], // string[][]
			mixedMatrix: [[1, 2], ["a", "b"]], // array (mixed types)
			tripleNested: [[[1, 2], [3, 4]], [[5, 6], [7, 8]]], // number[][][]
		};

		const result = serialize(data);
		
		// String matrix should be detected as string[][]
		expect(result.get("stringMatrix:string[][]")).toBe("[2]");
		expect(result.get("stringMatrix[0]:string[]")).toBe("[2]");
		expect(result.get("stringMatrix[0][0]:string")).toBe("a");
		expect(result.get("stringMatrix[1][1]:string")).toBe("d");
		
		// Mixed matrix should be generic array since it has different types
		expect(result.get("mixedMatrix:array")).toBe("[2]");
		
		// Triple nested should be detected as number[][][]
		expect(result.get("tripleNested:number[][][]")).toBe("[2]");
		expect(result.get("tripleNested[0]:number[][]")).toBe("[2]");
		expect(result.get("tripleNested[0][0]:number[]")).toBe("[2]");
		expect(result.get("tripleNested[0][0][0]:number")).toBe("1");
		expect(result.get("tripleNested[1][1][1]:number")).toBe("8");
	});

	test("should serialize nested objects", () => {
		const data = {
			company: {
				name: "TechCorp",
				address: {
					street: "123 Main St",
					city: "Anytown",
					country: "USA",
				},
			},
		};

		const result = serialize(data);

		// Check main object
		expect(result.get("company:object")).toBe("{2}");

		// Check nested object
		expect(result.get("company[address]:object")).toBe("{3}");

		// Check all properties
		expect(result.get("company[name]:string")).toBe("TechCorp");
		expect(result.get("company[address][street]:string")).toBe("123 Main St");
		expect(result.get("company[address][city]:string")).toBe("Anytown");
		expect(result.get("company[address][country]:string")).toBe("USA");
	});

	test("should serialize arrays containing objects", () => {
		const user1Name = faker.person.firstName();
		const user1Age = faker.number.int({ min: 18, max: 65 });
		const user2Name = faker.person.firstName();
		const user2Age = faker.number.int({ min: 18, max: 65 });
		
		const data = {
			users: [
				{ name: user1Name, age: user1Age },
				{ name: user2Name, age: user2Age },
			],
		};

		const result = serialize(data);

		// Check main array (mixed content = generic array)
		expect(result.get("users:array")).toBe("[2]");

		// Check nested objects
		expect(result.get("users[0]:object")).toBe("{2}");
		expect(result.get("users[1]:object")).toBe("{2}");

		// Check object properties
		expect(result.get("users[0][name]:string")).toBe(user1Name);
		expect(result.get("users[0][age]:number")).toBe(user1Age.toString());
		expect(result.get("users[1][name]:string")).toBe(user2Name);
		expect(result.get("users[1][age]:number")).toBe(user2Age.toString());
	});

	test("should serialize objects containing arrays", () => {
		const name = faker.person.firstName();
		const hobbies = [
			faker.lorem.word(),
			faker.lorem.word(),
			faker.lorem.word()
		];
		const scores = [
			faker.number.int({ min: 70, max: 100 }),
			faker.number.int({ min: 70, max: 100 }),
			faker.number.int({ min: 70, max: 100 })
		];
		
		const data = {
			person: {
				name,
				hobbies,
				scores,
			},
		};

		const result = serialize(data);

		// Check main object
		expect(result.get("person:object")).toBe("{3}");

		// Check arrays within object
		expect(result.get("person[hobbies]:string[]")).toBe("[3]");
		expect(result.get("person[scores]:number[]")).toBe("[3]");

		// Check primitive property
		expect(result.get("person[name]:string")).toBe(name);

		// Check array elements
		expect(result.get("person[hobbies][0]:string")).toBe(hobbies[0]!);
		expect(result.get("person[hobbies][1]:string")).toBe(hobbies[1]!);
		expect(result.get("person[hobbies][2]:string")).toBe(hobbies[2]!);

		expect(result.get("person[scores][0]:number")).toBe(scores[0]!.toString());
		expect(result.get("person[scores][1]:number")).toBe(scores[1]!.toString());
		expect(result.get("person[scores][2]:number")).toBe(scores[2]!.toString());
	});

	test("should handle deeply nested structures", () => {
		const data = {
			level1: {
				level2: {
					level3: {
						values: [1, 2, 3],
						nested: {
							deep: "value",
						},
					},
				},
			},
		};

		const result = serialize(data);

		// Check nested objects
		expect(result.get("level1:object")).toBe("{1}");
		expect(result.get("level1[level2]:object")).toBe("{1}");
		expect(result.get("level1[level2][level3]:object")).toBe("{2}");
		expect(result.get("level1[level2][level3][nested]:object")).toBe("{1}");

		// Check nested array
		expect(result.get("level1[level2][level3][values]:number[]")).toBe("[3]");

		// Check deeply nested values
		expect(result.get("level1[level2][level3][values][0]:number")).toBe("1");
		expect(result.get("level1[level2][level3][values][1]:number")).toBe("2");
		expect(result.get("level1[level2][level3][values][2]:number")).toBe("3");
		expect(result.get("level1[level2][level3][nested][deep]:string")).toBe("value");
	});

	test("should handle complex real-world data structures with faker", () => {
		// Create realistic user data with faker
		const user1 = {
			id: faker.string.uuid(),
			profile: {
				firstName: faker.person.firstName(),
				lastName: faker.person.lastName(),
				email: faker.internet.email(),
				avatar: new Blob([faker.lorem.text()], { type: "image/jpeg" }),
				birthDate: faker.date.birthdate(),
				website: new URL(faker.internet.url()),
			},
			preferences: {
				theme: faker.helpers.arrayElement(["dark", "light", "auto"]),
				notifications: faker.datatype.boolean(),
				languages: [
					faker.helpers.arrayElement(["en", "es", "fr"]),
					faker.helpers.arrayElement(["de", "it", "pt"])
				],
			},
			scores: [
				faker.number.int({ min: 0, max: 100 }),
				faker.number.int({ min: 0, max: 100 }),
				faker.number.int({ min: 0, max: 100 })
			],
			metadata: {
				createdAt: faker.date.past(),
				tags: [
					faker.lorem.word(),
					faker.lorem.word()
				],
				settings: {
					privacy: faker.datatype.boolean(),
					newsletter: faker.datatype.boolean(),
				},
			},
		};

		const data = { user: user1 };
		const result = serialize(data);

		// Test structure - we can verify the structure is preserved
		expect(result.get("user:object")).toBe("{5}"); // id, profile, preferences, scores, metadata
		expect(result.get("user[profile]:object")).toBe("{6}"); // firstName, lastName, email, avatar, birthDate, website
		expect(result.get("user[preferences]:object")).toBe("{3}"); // theme, notifications, languages
		expect(result.get("user[scores]:number[]")).toBe("[3]");
		expect(result.get("user[metadata]:object")).toBe("{3}"); // createdAt, tags, settings

		// Test some specific values
		expect(result.get("user[id]:string")).toBe(user1.id);
		expect(result.get("user[profile][firstName]:string")).toBe(user1.profile.firstName);
		expect(result.get("user[profile][email]:string")).toBe(user1.profile.email);
		expect(result.get("user[profile][avatar]:Blob")).toBeInstanceOf(Blob);
		expect(result.get("user[profile][birthDate]:Date")).toBe(user1.profile.birthDate.toISOString());
		expect(result.get("user[profile][website]:URL")).toBe(user1.profile.website.toString());
		expect(result.get("user[preferences][theme]:string")).toBe(user1.preferences.theme);
		expect(result.get("user[preferences][notifications]:boolean")).toBe(user1.preferences.notifications.toString());
		expect(result.get("user[preferences][languages]:string[]")).toBe("[2]");
		expect(result.get("user[metadata][settings]:object")).toBe("{2}");
		expect(result.get("user[metadata][settings][privacy]:boolean")).toBe(user1.metadata.settings.privacy.toString());
	});

	test("should handle complex mixed nested structures", () => {
		const data = {
			complexData: {
				users: [
					{
						name: "Alice",
						preferences: {
							themes: ["dark", "light"],
							notifications: true,
						},
					},
					{
						name: "Bob",
						preferences: {
							themes: ["blue"],
							notifications: false,
						},
					},
				],
				metadata: {
					version: "1.0",
					tags: ["prod", "stable"],
				},
			},
		};

		const result = serialize(data);

		// Check top level
		expect(result.get("complexData:object")).toBe("{2}");
		
		// Check users array
		expect(result.get("complexData[users]:array")).toBe("[2]");
		
		// Check first user
		expect(result.get("complexData[users][0]:object")).toBe("{2}");
		expect(result.get("complexData[users][0][name]:string")).toBe("Alice");
		expect(result.get("complexData[users][0][preferences]:object")).toBe("{2}");
		expect(result.get("complexData[users][0][preferences][themes]:string[]")).toBe("[2]");
		expect(result.get("complexData[users][0][preferences][themes][0]:string")).toBe("dark");
		expect(result.get("complexData[users][0][preferences][themes][1]:string")).toBe("light");
		expect(result.get("complexData[users][0][preferences][notifications]:boolean")).toBe("true");

		// Check second user
		expect(result.get("complexData[users][1]:object")).toBe("{2}");
		expect(result.get("complexData[users][1][name]:string")).toBe("Bob");
		expect(result.get("complexData[users][1][preferences]:object")).toBe("{2}");
		expect(result.get("complexData[users][1][preferences][themes]:string[]")).toBe("[1]");
		expect(result.get("complexData[users][1][preferences][themes][0]:string")).toBe("blue");
		expect(result.get("complexData[users][1][preferences][notifications]:boolean")).toBe("false");

		// Check metadata
		expect(result.get("complexData[metadata]:object")).toBe("{2}");
		expect(result.get("complexData[metadata][version]:string")).toBe("1.0");
		expect(result.get("complexData[metadata][tags]:string[]")).toBe("[2]");
		expect(result.get("complexData[metadata][tags][0]:string")).toBe("prod");
		expect(result.get("complexData[metadata][tags][1]:string")).toBe("stable");
	});

	test("should throw error for unsupported types", () => {
		const data = {
			unsupported: Symbol("test") as any,
		};

		expect(() => serialize(data)).toThrow('Unsupported type for key "unsupported"');
	});
});