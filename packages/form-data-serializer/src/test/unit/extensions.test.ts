import { beforeEach, describe, expect, test } from "bun:test";
import { faker } from "@faker-js/faker";
import { deserialize, type SerializationExtension, serialize } from "@/serialize-refactor";
import {
	BigIntExtension,
	DateExtension,
	ErrorExtension,
	SymbolExtension,
} from "@/extensions-refactor";

describe("Extensions - Edge Cases and Complex Scenarios", () => {
	beforeEach(() => {
		faker.seed(123);
	});

	describe("DateExtension - Edge Cases", () => {
		test("should handle Date at Unix epoch (1970-01-01)", () => {
			const original = new Date(0);
			const result = deserialize(serialize(original, { extensions: [DateExtension] }), {
				extensions: [DateExtension],
			}) as Date;
			expect(result).toBeInstanceOf(Date);
			expect(result.getTime()).toBe(0);
		});

		test("should handle very old dates (year 1900)", () => {
			const original = new Date("1900-01-01T00:00:00.000Z");
			const result = deserialize(serialize(original, { extensions: [DateExtension] }), {
				extensions: [DateExtension],
			}) as Date;
			expect(result).toBeInstanceOf(Date);
			expect(result.getTime()).toBe(original.getTime());
		});

		test("should handle far future dates (year 2500)", () => {
			const original = new Date("2500-12-31T23:59:59.999Z");
			const result = deserialize(serialize(original, { extensions: [DateExtension] }), {
				extensions: [DateExtension],
			}) as Date;
			expect(result).toBeInstanceOf(Date);
			expect(result.getTime()).toBe(original.getTime());
		});

		test("should handle dates with millisecond precision", () => {
			const original = new Date("2025-10-06T12:34:56.789Z");
			const result = deserialize(serialize(original, { extensions: [DateExtension] }), {
				extensions: [DateExtension],
			}) as Date;
			expect(result).toBeInstanceOf(Date);
			expect(result.getTime()).toBe(original.getTime());
		});

		test("should handle invalid Date objects", () => {
			const original = new Date("invalid");

			// Invalid dates can't be serialized with toISOString(), so this should throw
			expect(() => serialize(original, { extensions: [DateExtension] })).toThrow();
		});

		test("should handle Date with maximum safe timestamp", () => {
			const original = new Date(8640000000000000); // Max date value
			const result = deserialize(serialize(original, { extensions: [DateExtension] }), {
				extensions: [DateExtension],
			}) as Date;
			expect(result).toBeInstanceOf(Date);
			expect(result.getTime()).toBe(original.getTime());
		});

		test("should handle Date with minimum safe timestamp", () => {
			const original = new Date(-8640000000000000); // Min date value
			const result = deserialize(serialize(original, { extensions: [DateExtension] }), {
				extensions: [DateExtension],
			}) as Date;
			expect(result).toBeInstanceOf(Date);
			expect(result.getTime()).toBe(original.getTime());
		});

		test("should handle array of dates with different timezones", () => {
			const original = [
				new Date("2025-01-01T00:00:00.000Z"),
				new Date("2025-06-15T12:30:45.123Z"),
				new Date("2025-12-31T23:59:59.999Z"),
			];
			const result = deserialize(serialize(original, { extensions: [DateExtension] }), {
				extensions: [DateExtension],
			}) as Date[];

			expect(result).toHaveLength(3);
			result.forEach((date: Date, i: number) => {
				expect(date).toBeInstanceOf(Date);
				expect(date.getTime()).toBe(original[i].getTime());
			});
		});

		test("should handle deeply nested dates", () => {
			const original = {
				level1: {
					date: new Date("2025-01-01"),
					level2: {
						date: new Date("2025-02-01"),
						level3: {
							date: new Date("2025-03-01"),
							dates: [new Date("2025-04-01"), new Date("2025-05-01")],
						},
					},
				},
			};
			const result = deserialize(serialize(original, { extensions: [DateExtension] }), {
				extensions: [DateExtension],
			}) as typeof original;

			// Check types and verify structure
			expect(result.level1.date).toBeInstanceOf(Date);
			expect(result.level1.level2.date).toBeInstanceOf(Date);
			expect(result.level1.level2.level3.date).toBeInstanceOf(Date);
			expect(result.level1.level2.level3.dates[0]).toBeInstanceOf(Date);
			expect(result.level1.level2.level3.dates[1]).toBeInstanceOf(Date);
		});

		test("should handle dates mixed with null values", () => {
			const original = {
				createdAt: new Date("2025-01-01"),
				updatedAt: new Date("2025-02-01"),
				deletedAt: null,
			};
			const result = deserialize(serialize(original, { extensions: [DateExtension] }), {
				extensions: [DateExtension],
			}) as typeof original;

			expect(result.createdAt).toBeInstanceOf(Date);
			expect(result.updatedAt).toBeInstanceOf(Date);
			expect(result.deletedAt).toBe(null);
		});
	});

	describe("BigIntExtension - Edge Cases", () => {
		test("should handle zero BigInt", () => {
			const original = BigInt(0);
			const result = deserialize(serialize(original, { extensions: [BigIntExtension] }), {
				extensions: [BigIntExtension],
			});
			expect(result).toBe(BigInt(0));
		});

		test("should handle negative BigInt", () => {
			const original = BigInt("-9007199254740991999");
			const result = deserialize(serialize(original, { extensions: [BigIntExtension] }), {
				extensions: [BigIntExtension],
			});
			expect(result).toBe(original);
		});

		test("should handle very large BigInt (beyond Number.MAX_SAFE_INTEGER)", () => {
			const original = BigInt("999999999999999999999999999999");
			const result = deserialize(serialize(original, { extensions: [BigIntExtension] }), {
				extensions: [BigIntExtension],
			});
			expect(result).toBe(original);
		});

		test("should handle BigInt one", () => {
			const original = BigInt(1);
			const result = deserialize(serialize(original, { extensions: [BigIntExtension] }), {
				extensions: [BigIntExtension],
			});
			expect(result).toBe(BigInt(1));
		});

		test("should handle BigInt negative one", () => {
			const original = BigInt(-1);
			const result = deserialize(serialize(original, { extensions: [BigIntExtension] }), {
				extensions: [BigIntExtension],
			});
			expect(result).toBe(BigInt(-1));
		});

		test("should handle array of mixed positive and negative BigInts", () => {
			const original = [
				BigInt("123456789012345678901234567890"),
				BigInt("-987654321098765432109876543210"),
				BigInt(0),
				BigInt(1),
				BigInt(-1),
			];
			const result = deserialize(serialize(original, { extensions: [BigIntExtension] }), {
				extensions: [BigIntExtension],
			}) as bigint[];

			expect(result).toHaveLength(5);
			result.forEach((bigInt: bigint, i: number) => {
				expect(bigInt).toBe(original[i]);
			});
		});

		test("should handle object with BigInt IDs and counters", () => {
			const original = {
				userId: BigInt("1234567890123456789"),
				sessionId: BigInt("9876543210987654321"),
				viewCount: BigInt(1000000000),
				balance: BigInt("-5000"),
			};
			const result = deserialize(serialize(original, { extensions: [BigIntExtension] }), {
				extensions: [BigIntExtension],
			}) as typeof original;

			expect(result.userId).toBe(original.userId);
			expect(result.sessionId).toBe(original.sessionId);
			expect(result.viewCount).toBe(original.viewCount);
			expect(result.balance).toBe(original.balance);
		});

		test("should handle BigInt in nested arrays", () => {
			const original = [[BigInt(1), BigInt(2)], [BigInt(3), BigInt(4)], [[BigInt(5), BigInt(6)]]];
			const result = deserialize(serialize(original, { extensions: [BigIntExtension] }), {
				extensions: [BigIntExtension],
			}) as Array<bigint[] | bigint[][]>;

			expect((result[0] as bigint[])[0]).toBe(BigInt(1));
			expect((result[2] as bigint[][])[0][1]).toBe(BigInt(6));
		});

		test("should handle BigInt mixed with null values", () => {
			const original = {
				id: BigInt(123),
				previousId: null,
				nextId: BigInt(456),
			};
			const result = deserialize(serialize(original, { extensions: [BigIntExtension] }), {
				extensions: [BigIntExtension],
			}) as typeof original;

			expect(result.id).toBe(BigInt(123));
			expect(result.previousId).toBe(null);
			expect(result.nextId).toBe(BigInt(456));
		});
	});

	describe("ErrorExtension - Edge Cases", () => {
		test("should handle basic Error", () => {
			const original = new Error("Something went wrong");
			const result = deserialize(serialize(original, { extensions: [ErrorExtension] }), {
				extensions: [ErrorExtension],
			}) as Error;

			expect(result).toBeInstanceOf(Error);
			expect(result.message).toBe("Something went wrong");
			expect(result.name).toBe("Error");
		});

		test("should handle Error with empty message", () => {
			const original = new Error("");
			const result = deserialize(serialize(original, { extensions: [ErrorExtension] }), {
				extensions: [ErrorExtension],
			}) as Error;

			expect(result).toBeInstanceOf(Error);
			expect(result.message).toBe("");
		});

		test("should handle TypeError", () => {
			const original = new TypeError("Invalid type");
			const result = deserialize(serialize(original, { extensions: [ErrorExtension] }), {
				extensions: [ErrorExtension],
			}) as Error;

			expect(result).toBeInstanceOf(Error);
			expect(result.message).toBe("Invalid type");
			expect(result.name).toBe("TypeError");
		});

		test("should handle RangeError", () => {
			const original = new RangeError("Out of range");
			const result = deserialize(serialize(original, { extensions: [ErrorExtension] }), {
				extensions: [ErrorExtension],
			}) as Error;

			expect(result).toBeInstanceOf(Error);
			expect(result.message).toBe("Out of range");
			expect(result.name).toBe("RangeError");
		});

		test("should handle ReferenceError", () => {
			const original = new ReferenceError("Variable not defined");
			const serialized = serialize(original, { extensions: [ErrorExtension] });
			const result = deserialize(serialized, { extensions: [ErrorExtension] }) as Error;

			expect(result).toBeInstanceOf(Error);
			expect(result.message).toBe("Variable not defined");
			expect(result.name).toBe("ReferenceError");
		});

		test("should handle Error with stack trace", () => {
			const original = new Error("Test error");
			const serialized = serialize(original, { extensions: [ErrorExtension] });
			const result = deserialize(serialized, { extensions: [ErrorExtension] }) as Error;

			expect(result).toBeInstanceOf(Error);
			expect(result.message).toBe("Test error");
			// Stack trace should be preserved
			expect(result.stack).toBeDefined();
		});

		test("should handle array of different error types", () => {
			const original = [new Error("Error 1"), new TypeError("Error 2"), new RangeError("Error 3")];

			const serialized = serialize(original, { extensions: [ErrorExtension] });
			const result = deserialize(serialized, { extensions: [ErrorExtension] }) as Error[];

			expect(result).toHaveLength(3);
			expect(result[0]).toBeInstanceOf(Error);
			expect(result[0].message).toBe("Error 1");
			expect(result[1].name).toBe("TypeError");
			expect(result[2].name).toBe("RangeError");
		});

		test("should handle Error in nested object", () => {
			const original = {
				status: "failed",
				error: new Error("Operation failed"),
				metadata: {
					timestamp: Date.now(),
					nestedError: new TypeError("Type mismatch"),
				},
			};

			const serialized = serialize(original, { extensions: [ErrorExtension] });
			const result = deserialize(serialized, { extensions: [ErrorExtension] }) as typeof original;

			expect(result.status).toBe("failed");
			expect(result.error).toBeInstanceOf(Error);
			expect(result.error.message).toBe("Operation failed");
			expect(result.metadata.nestedError).toBeInstanceOf(Error);
			expect(result.metadata.nestedError.name).toBe("TypeError");
		});

		test("should handle Error with unicode characters in message", () => {
			const original = new Error("操作失败 🚫 Échec de l'opération");
			const serialized = serialize(original, { extensions: [ErrorExtension] });
			const result = deserialize(serialized, { extensions: [ErrorExtension] }) as Error;

			expect(result).toBeInstanceOf(Error);
			expect(result.message).toBe("操作失败 🚫 Échec de l'opération");
		});

		test("should handle Error with very long message", () => {
			const longMessage = faker.lorem.paragraphs(10);
			const original = new Error(longMessage);
			const serialized = serialize(original, { extensions: [ErrorExtension] });
			const result = deserialize(serialized, { extensions: [ErrorExtension] }) as Error;

			expect(result).toBeInstanceOf(Error);
			expect(result.message).toBe(longMessage);
		});
	});

	describe("SymbolExtension - Edge Cases", () => {
		test("should handle Symbol with description", () => {
			const original = Symbol("mySymbol");
			const serialized = serialize(original, { extensions: [SymbolExtension] });
			const result = deserialize(serialized, { extensions: [SymbolExtension] }) as symbol;

			expect(typeof result).toBe("symbol");
			expect(result.description).toBe("mySymbol");
		});

		test("should handle Symbol without description", () => {
			const original = Symbol();
			const serialized = serialize(original, { extensions: [SymbolExtension] });
			const result = deserialize(serialized, { extensions: [SymbolExtension] }) as symbol;

			expect(typeof result).toBe("symbol");
			// Note: Symbol() creates a symbol with empty string description, not undefined
			expect(result.description === undefined || result.description === "").toBe(true);
		});

		test("should handle Symbol with empty string description", () => {
			const original = Symbol("");
			const serialized = serialize(original, { extensions: [SymbolExtension] });
			const result = deserialize(serialized, { extensions: [SymbolExtension] }) as symbol;

			expect(typeof result).toBe("symbol");
			expect(result.description).toBe("");
		});

		test("should handle Symbol with unicode description", () => {
			const original = Symbol("🔑 密钥 clé");
			const serialized = serialize(original, { extensions: [SymbolExtension] });
			const result = deserialize(serialized, { extensions: [SymbolExtension] }) as symbol;

			expect(typeof result).toBe("symbol");
			expect(result.description).toBe("🔑 密钥 clé");
		});

		test("should handle array of Symbols", () => {
			const original = [Symbol("first"), Symbol("second"), Symbol("third")];

			const serialized = serialize(original, { extensions: [SymbolExtension] });
			const result = deserialize(serialized, { extensions: [SymbolExtension] }) as symbol[];

			expect(result).toHaveLength(3);
			result.forEach((sym: symbol, i: number) => {
				expect(typeof sym).toBe("symbol");
				expect(sym.description).toBe(original[i].description);
			});
		});

		test("should handle Symbol in object value", () => {
			const original = {
				id: Symbol("unique-id"),
				name: "test",
			};

			const serialized = serialize(original, { extensions: [SymbolExtension] });
			const result = deserialize(serialized, { extensions: [SymbolExtension] }) as typeof original;

			expect(typeof result.id).toBe("symbol");
			expect(result.id.description).toBe("unique-id");
			expect(result.name).toBe("test");
		});

		test("should create new Symbol instances (not preserve identity)", () => {
			const original = Symbol("test");
			const serialized = serialize(original, { extensions: [SymbolExtension] });
			const result = deserialize(serialized, { extensions: [SymbolExtension] }) as symbol;

			// Symbols are unique, so deserialized symbol won't be identical
			expect(typeof result).toBe("symbol");
			expect(result.description).toBe("test");
			expect(result).not.toBe(original);
		});
	});

	describe("Multiple Extensions - Complex Scenarios", () => {
		test("should handle all built-in extensions together", () => {
			const date = new Date("2025-10-06");
			const bigInt = BigInt("123456789");
			const error = new Error("Test error");
			const symbol = Symbol("testSymbol");

			const original = {
				timestamp: date,
				userId: bigInt,
				lastError: error,
				uniqueKey: symbol,
			};

			const serialized = serialize(original, {
				extensions: [DateExtension, BigIntExtension, ErrorExtension, SymbolExtension],
			});
			const result = deserialize(serialized, {
				extensions: [DateExtension, BigIntExtension, ErrorExtension, SymbolExtension],
			}) as typeof original;

			expect(result.timestamp).toBeInstanceOf(Date);
			expect(result.timestamp.getTime()).toBe(date.getTime());
			expect(typeof result.userId).toBe("bigint");
			expect(result.userId).toBe(bigInt);
			expect(result.lastError).toBeInstanceOf(Error);
			expect(result.lastError.message).toBe("Test error");
			expect(typeof result.uniqueKey).toBe("symbol");
			expect(result.uniqueKey.description).toBe("testSymbol");
		});

		test("should handle deeply nested mixed extensions", () => {
			const original = {
				level1: {
					date: new Date("2025-01-01"),
					level2: {
						bigInt: BigInt(999),
						level3: {
							error: new Error("Nested error"),
							level4: {
								symbol: Symbol("deep"),
								dates: [new Date("2025-02-01"), new Date("2025-03-01")],
								bigInts: [BigInt(111), BigInt(222)],
							},
						},
					},
				},
			};

			const serialized = serialize(original, {
				extensions: [DateExtension, BigIntExtension, ErrorExtension, SymbolExtension],
			});
			const result = deserialize(serialized, {
				extensions: [DateExtension, BigIntExtension, ErrorExtension, SymbolExtension],
			}) as typeof original;

			expect(result.level1.date).toBeInstanceOf(Date);
			expect(typeof result.level1.level2.bigInt).toBe("bigint");
			expect(result.level1.level2.level3.error).toBeInstanceOf(Error);
			expect(typeof result.level1.level2.level3.level4.symbol).toBe("symbol");
			expect(result.level1.level2.level3.level4.dates[0]).toBeInstanceOf(Date);
			expect(typeof result.level1.level2.level3.level4.bigInts[1]).toBe("bigint");
		});

		test("should handle array of mixed extension types", () => {
			const original = [
				new Date("2025-01-01"),
				BigInt(123),
				new Error("Error message"),
				Symbol("sym"),
				new Date("2025-02-01"),
				BigInt(456),
			];

			const serialized = serialize(original, {
				extensions: [DateExtension, BigIntExtension, ErrorExtension, SymbolExtension],
			});
			const result = deserialize(serialized, {
				extensions: [DateExtension, BigIntExtension, ErrorExtension, SymbolExtension],
			}) as Array<Date | bigint | Error | symbol>;

			expect(result[0]).toBeInstanceOf(Date);
			expect(typeof result[1]).toBe("bigint");
			expect(result[2]).toBeInstanceOf(Error);
			expect(typeof result[3]).toBe("symbol");
			expect(result[4]).toBeInstanceOf(Date);
			expect(typeof result[5]).toBe("bigint");
		});

		test("should handle extensions mixed with Blobs", async () => {
			const content = faker.lorem.paragraph();
			const original = {
				file: new Blob([content], { type: "text/plain" }),
				createdAt: new Date("2025-01-01"),
				size: BigInt(1024),
			};

			const serialized = serialize(original, {
				extensions: [DateExtension, BigIntExtension],
			});
			const result = deserialize(serialized, {
				extensions: [DateExtension, BigIntExtension],
			}) as typeof original;

			expect(result.file).toBeInstanceOf(Blob);
			const text = await result.file.text();
			expect(text).toBe(content);
			expect(result.createdAt).toBeInstanceOf(Date);
			expect(typeof result.size).toBe("bigint");
		});

		test("should handle extensions with null and undefined values", () => {
			const original = {
				date1: new Date("2025-01-01"),
				date2: null,
				bigInt1: BigInt(123),
				bigInt2: null,
				error1: new Error("Error"),
				error2: null,
			};

			const serialized = serialize(original, {
				extensions: [DateExtension, BigIntExtension, ErrorExtension],
			});
			const result = deserialize(serialized, {
				extensions: [DateExtension, BigIntExtension, ErrorExtension],
			}) as typeof original;

			expect(result.date1).toBeInstanceOf(Date);
			expect(result.date2).toBe(null);
			expect(typeof result.bigInt1).toBe("bigint");
			expect(result.bigInt2).toBe(null);
			expect(result.error1).toBeInstanceOf(Error);
			expect(result.error2).toBe(null);
		});
	});

	describe("Custom Extension - Edge Cases", () => {
		test("should handle custom Set extension", () => {
			const SetExtension: SerializationExtension<Set<unknown>> = {
				name: "set",
				serialize: (set) => JSON.stringify([...set]),
				deserialize: (data) => new Set(JSON.parse(data as string)),
				canHandle: (value): value is Set<unknown> => value instanceof Set,
			};

			const original = new Set([1, 2, 3, "hello", true]);
			const serialized = serialize(original, { extensions: [SetExtension] });
			const result = deserialize(serialized, { extensions: [SetExtension] }) as Set<unknown>;

			expect(result).toBeInstanceOf(Set);
			expect(result.size).toBe(5);
			expect(result.has(1)).toBe(true);
			expect(result.has("hello")).toBe(true);
		});

		test("should handle custom Map extension", () => {
			const MapExtension: SerializationExtension<Map<unknown, unknown>> = {
				name: "map",
				serialize: (map) => JSON.stringify([...map.entries()]),
				deserialize: (data) => new Map(JSON.parse(data as string)),
				canHandle: (value): value is Map<unknown, unknown> => value instanceof Map,
			};

			const original = new Map<unknown, unknown>([
				["key1", "value1"],
				["key2", 42],
				[3, true],
			]);
			const serialized = serialize(original, { extensions: [MapExtension] });
			const result = deserialize(serialized, { extensions: [MapExtension] }) as Map<
				unknown,
				unknown
			>;

			expect(result).toBeInstanceOf(Map);
			expect(result.size).toBe(3);
			expect(result.get("key1")).toBe("value1");
			expect(result.get("key2")).toBe(42);
			expect(result.get(3)).toBe(true);
		});

		test("should handle custom RegExp extension", () => {
			const RegExpExtension: SerializationExtension<RegExp> = {
				name: "regexp",
				serialize: (regexp) => JSON.stringify({ source: regexp.source, flags: regexp.flags }),
				deserialize: (data) => {
					const parsed = JSON.parse(data as string);
					return new RegExp(parsed.source, parsed.flags);
				},
				canHandle: (value): value is RegExp => value instanceof RegExp,
			};

			const original = /test\d+/gi;
			const serialized = serialize(original, { extensions: [RegExpExtension] });
			const result = deserialize(serialized, { extensions: [RegExpExtension] }) as RegExp;

			expect(result).toBeInstanceOf(RegExp);
			expect(result.source).toBe("test\\d+");
			expect(result.flags).toBe("gi");
			expect(result.test("test123")).toBe(true);
		});

		test("should handle custom URL extension", () => {
			const URLExtension: SerializationExtension<URL> = {
				name: "url",
				serialize: (url) => url.href,
				deserialize: (data) => new URL(data as string),
				canHandle: (value): value is URL => value instanceof URL,
			};

			const original = new URL("https://example.com/path?query=value#hash");
			const serialized = serialize(original, { extensions: [URLExtension] });
			const result = deserialize(serialized, { extensions: [URLExtension] }) as URL;

			expect(result).toBeInstanceOf(URL);
			expect(result.href).toBe(original.href);
			expect(result.pathname).toBe("/path");
			expect(result.searchParams.get("query")).toBe("value");
		});

		test("should handle custom Point class extension", () => {
			class Point {
				constructor(
					public x: number,
					public y: number,
				) {}
			}

			const PointExtension: SerializationExtension<Point> = {
				name: "point",
				serialize: (point) => JSON.stringify({ x: point.x, y: point.y }),
				deserialize: (data) => {
					const parsed = JSON.parse(data as string);
					return new Point(parsed.x, parsed.y);
				},
				canHandle: (value): value is Point => value instanceof Point,
			};

			const original = new Point(10, 20);
			const serialized = serialize(original, { extensions: [PointExtension] });
			const result = deserialize(serialized, { extensions: [PointExtension] }) as Point;

			expect(result).toBeInstanceOf(Point);
			expect(result.x).toBe(10);
			expect(result.y).toBe(20);
		});

		test("should handle nested custom extensions", () => {
			const SetExtension: SerializationExtension<Set<unknown>> = {
				name: "set",
				serialize: (set) => JSON.stringify([...set]),
				deserialize: (data) => new Set(JSON.parse(data as string)),
				canHandle: (value): value is Set<unknown> => value instanceof Set,
			};

			const original = {
				tags: new Set(["javascript", "typescript", "node"]),
				categories: new Set([1, 2, 3]),
				nested: {
					moreSet: new Set(["a", "b", "c"]),
				},
			};

			const serialized = serialize(original, { extensions: [SetExtension] });
			const result = deserialize(serialized, { extensions: [SetExtension] }) as typeof original;

			expect(result.tags).toBeInstanceOf(Set);
			expect(result.tags.size).toBe(3);
			expect(result.categories).toBeInstanceOf(Set);
			expect(result.nested.moreSet).toBeInstanceOf(Set);
		});

		test("should handle array of custom extension objects", () => {
			const RegExpExtension: SerializationExtension<RegExp> = {
				name: "regexp",
				serialize: (regexp) => JSON.stringify({ source: regexp.source, flags: regexp.flags }),
				deserialize: (data) => {
					const parsed = JSON.parse(data as string);
					return new RegExp(parsed.source, parsed.flags);
				},
				canHandle: (value): value is RegExp => value instanceof RegExp,
			};

			const original = [/\d+/g, /[a-z]+/i, /test/];

			const serialized = serialize(original, { extensions: [RegExpExtension] });
			const result = deserialize(serialized, { extensions: [RegExpExtension] }) as RegExp[];

			expect(result).toHaveLength(3);
			result.forEach((regexp: RegExp) => {
				expect(regexp).toBeInstanceOf(RegExp);
			});
			expect(result[0].flags).toContain("g");
			expect(result[1].flags).toContain("i");
		});

		test("should handle custom extension with complex nested data", () => {
			class ComplexObject {
				constructor(
					public id: number,
					public data: { nested: string[] },
					public metadata: Map<string, unknown>,
				) {}
			}

			const ComplexExtension: SerializationExtension<ComplexObject> = {
				name: "complex",
				serialize: (obj) =>
					JSON.stringify({
						id: obj.id,
						data: obj.data,
						metadata: [...obj.metadata.entries()],
					}),
				deserialize: (data) => {
					const parsed = JSON.parse(data as string);
					return new ComplexObject(parsed.id, parsed.data, new Map(parsed.metadata));
				},
				canHandle: (value): value is ComplexObject => value instanceof ComplexObject,
			};

			const original = new ComplexObject(
				123,
				{ nested: ["a", "b", "c"] },
				new Map<string, unknown>([
					["key1", "value1"],
					["key2", 42],
				]),
			);

			const serialized = serialize(original, { extensions: [ComplexExtension] });
			const result = deserialize(serialized, { extensions: [ComplexExtension] }) as ComplexObject;

			expect(result).toBeInstanceOf(ComplexObject);
			expect(result.id).toBe(123);
			expect(result.data.nested).toEqual(["a", "b", "c"]);
			expect(result.metadata.get("key1")).toBe("value1");
			expect(result.metadata.get("key2")).toBe(42);
		});
	});

	describe("Extension Priority and Conflicts", () => {
		test("should use first matching extension when multiple match", () => {
			const Extension1: SerializationExtension<Date> = {
				name: "date1",
				serialize: () => "extension1",
				deserialize: (data) => new Date(data as string),
				canHandle: (value): value is Date => value instanceof Date,
			};

			const Extension2: SerializationExtension<Date> = {
				name: "date2",
				serialize: () => "extension2",
				deserialize: (data) => new Date(data as string),
				canHandle: (value): value is Date => value instanceof Date,
			};

			const original = new Date("2025-01-01");
			const serialized = serialize(original, { extensions: [Extension1, Extension2] });

			// Should use Extension1 since it's first
			const dataValue = JSON.parse(serialized.get("$data") as string);
			const refKey = serialized.get(dataValue) as string;
			expect(JSON.parse(refKey)).toBe("extension1");
		});

		test("should handle extension name conflicts gracefully", () => {
			const Extension1: SerializationExtension<Date> = {
				name: "customDate",
				serialize: (d) => d.toISOString(),
				deserialize: (data) => new Date(data as string),
				canHandle: (value): value is Date => value instanceof Date,
			};

			const Extension2: SerializationExtension<Date> = {
				name: "customDate", // Same name
				serialize: (d) => d.getTime().toString(),
				deserialize: (data) => new Date(Number(data)),
				canHandle: (value): value is Date => value instanceof Date,
			};

			const original = new Date("2025-01-01");

			// Should throw on duplicate extension names
			expect(() => serialize(original, { extensions: [Extension1, Extension2] })).toThrow(
				"Duplicate extension name found: 'customDate'",
			);
		});

		test("should throw when missing extension during deserialization", () => {
			const original = new Date("2025-01-01");
			const serialized = serialize(original, { extensions: [DateExtension] });

			// Deserialize without the extension - should throw
			expect(() => deserialize(serialized, { extensions: [] })).toThrow(
				"Extension 'date' not found in provided extensions",
			);
		});
	});

	describe("Performance and Stress Tests", () => {
		test("should handle very large array of dates", () => {
			const original = Array.from({ length: 1000 }, (_, i) => new Date(Date.now() + i * 1000));

			const serialized = serialize(original, { extensions: [DateExtension] });
			const result = deserialize(serialized, { extensions: [DateExtension] }) as Date[];

			expect(result).toHaveLength(1000);
			result.forEach((date: Date, i: number) => {
				expect(date).toBeInstanceOf(Date);
				expect(date.getTime()).toBe(original[i].getTime());
			});
		});

		test("should handle very large array of BigInts", () => {
			const original = Array.from({ length: 1000 }, (_, i) => BigInt(i));

			const serialized = serialize(original, { extensions: [BigIntExtension] });
			const result = deserialize(serialized, { extensions: [BigIntExtension] }) as bigint[];

			expect(result).toHaveLength(1000);
			result.forEach((bigInt: bigint, i: number) => {
				expect(typeof bigInt).toBe("bigint");
				expect(bigInt).toBe(BigInt(i));
			});
		});

		test("should handle deeply nested extension objects (50 levels)", () => {
			let original: any = { value: new Date("2025-01-01") };
			for (let i = 0; i < 49; i++) {
				original = { nested: original };
			}

			const serialized = serialize(original, { extensions: [DateExtension] });
			const result = deserialize(serialized, { extensions: [DateExtension] }) as any;

			// Navigate to the deepest level
			let current = result;
			for (let i = 0; i < 49; i++) {
				expect(current.nested).toBeDefined();
				current = current.nested;
			}
			expect(current.value).toBeInstanceOf(Date);
		});
	});
});
