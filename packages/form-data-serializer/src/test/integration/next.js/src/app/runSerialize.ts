"use server";
import { deserialize, serialize } from "form-data-serializer";
import {
	DateExtension,
	BigIntExtension,
	ErrorExtension,
	SymbolExtension,
} from "form-data-serializer/extensions";

const EXT_MAP: Record<string, unknown> = {
	date: DateExtension,
	bigint: BigIntExtension,
	error: ErrorExtension,
	symbol: SymbolExtension,
};

// Accept extension names (strings) from the client, map to local extension objects server-side.
export async function runSerialize(
	_testName: string,
	payload: FormData,
	extensionNames: readonly string[] = [],
) {
	try {
		const extensions = (extensionNames ?? []).map((n) => EXT_MAP[n]).filter(Boolean);
		// runtime: EXT_MAP contains extension objects; TS typing here is intentionally loose
		// @ts-ignore - passing runtime-built extensions into serializer/deserializer
		const value = deserialize(payload, extensions);
		// @ts-ignore - serialize accepts the same runtime-built extensions
		return serialize({ ok: true, value }, extensions);
	} catch (err) {
		// ensure error serializable
		return serialize({ ok: false, errors: [String(err)] } as any, []);
	}
}
