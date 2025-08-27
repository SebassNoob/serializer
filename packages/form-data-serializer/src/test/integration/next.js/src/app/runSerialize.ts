"use server";
import { deserialize, serialize } from "form-data-serializer";
import getCases from "../../../testCases";

type ValidationResult = {
	ok: boolean;
	errors?: string[];
};

// Helper: compare two values with special handling for Blob/File
async function deepEqual(
	a: any,
	b: any,
	path = "root",
): Promise<{ equal: boolean; path?: string; reason?: string }> {
	if (a === b) return { equal: true };

	// Handle null/undefined
	if (a == null || b == null) {
		return { equal: false, path, reason: `one is ${String(a)}, other is ${String(b)}` };
	}

	// Symbols: treat symbols as equal when they have the same global key or same description
	if (typeof a === "symbol" || typeof b === "symbol") {
		if (typeof a !== "symbol" || typeof b !== "symbol")
			return { equal: false, path, reason: "one is symbol other is not" };
		try {
			// Prefer global symbol identity via keyFor
			const aKey = (Symbol as any).keyFor ? Symbol.keyFor(a as symbol) : undefined;
			const bKey = (Symbol as any).keyFor ? Symbol.keyFor(b as symbol) : undefined;
			if (aKey != null || bKey != null) {
				if (aKey === bKey) return { equal: true };
				return {
					equal: false,
					path: path + ".description",
					reason: `symbol key ${String(aKey)} !== ${String(bKey)}`,
				};
			}
			// Fall back to description-based comparison (useful for comparing serialized symbols)
			const aDesc = (a as symbol).description;
			const bDesc = (b as symbol).description;
			if (aDesc === bDesc) return { equal: true };
			return {
				equal: false,
				path: path + ".description",
				reason: `symbol description ${String(aDesc)} !== ${String(bDesc)}`,
			};
		} catch (e) {
			return { equal: false, path, reason: `symbol comparison error: ${String(e)}` };
		}
	}

	// Blobs/Files: compare size and type, and name for Files when available
	const isBlob = (v: any) =>
		typeof v === "object" && v !== null && typeof v.size === "number" && typeof v.type === "string";
	const isFile = (v: any) => isBlob(v) && typeof v.name === "string";
	if (isBlob(a) || isBlob(b)) {
		if (!isBlob(a) || !isBlob(b))
			return { equal: false, path, reason: "one is blob/file other is not" };
		if (a.size !== b.size)
			return { equal: false, path: path + ".size", reason: `size ${a.size} !== ${b.size}` };
		if ((a.type || "") !== (b.type || ""))
			return { equal: false, path: path + ".type", reason: `type ${a.type} !== ${b.type}` };
		if (isFile(a) || isFile(b)) {
			// when both are files, compare name if present
			if (isFile(a) && isFile(b) && a.name !== b.name)
				return { equal: false, path: path + ".name", reason: `name ${a.name} !== ${b.name}` };
		}
		return { equal: true };
	}

	// Arrays
	if (Array.isArray(a) || Array.isArray(b)) {
		if (!Array.isArray(a) || !Array.isArray(b))
			return { equal: false, path, reason: "one is array other is not" };
		if (a.length !== b.length)
			return { equal: false, path: path + ".length", reason: `length ${a.length} !== ${b.length}` };
		for (let i = 0; i < a.length; i++) {
			const res = await deepEqual(a[i], b[i], `${path}[${i}]`);
			if (!res.equal) return res;
		}
		return { equal: true };
	}

	// Objects
	if (typeof a === "object" && typeof b === "object") {
		const aKeys = Object.keys(a).filter((k) => typeof a[k] !== "undefined");
		const bKeys = Object.keys(b).filter((k) => typeof b[k] !== "undefined");
		// compare key sets
		const allKeys = new Set([...aKeys, ...bKeys]);
		for (const k of allKeys) {
			if (!(k in a)) return { equal: false, path: path + "." + k, reason: "missing in left" };
			if (!(k in b)) return { equal: false, path: path + "." + k, reason: "missing in right" };
			const res = await deepEqual(a[k], b[k], path + "." + k);
			if (!res.equal) return res;
		}
		return { equal: true };
	}

	// Fallback primitive mismatch
	if (a !== b)
		return { equal: false, path, reason: `primitive mismatch ${String(a)} !== ${String(b)}` };
	return { equal: true };
}

// This function is intended to be used as a Next.js Server Action ("use server").
export async function runSerialize(testName: string, payload: FormData) {
	// Find test case by name
	const cases = getCases();
	const test = cases.find((c) => c.name === testName);
	if (!test) {
		return serialize({ ok: false, errors: [`Test case '${testName}' not found`] } as ValidationResult)
	}

	try {
		const extensions = test.extensions ?? [];
		const value = deserialize(payload, extensions);

		try {
			console.log(value, test.input);
			const res = await deepEqual(value, test.input);
			if (res.equal) return serialize({ ok: true } as ValidationResult);
			return serialize({
				ok: false,
				errors: [`Mismatch at ${res.path}: ${res.reason}`],
			} as ValidationResult)
		} catch (assertErr) {
			return serialize({ ok: false, errors: [String(assertErr)] } as ValidationResult)
		}
	} catch (err) {
		return serialize({ ok: false, errors: [String(err)] } as ValidationResult)
	}
}
