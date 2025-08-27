"use server";
import { deserialize, serialize } from "form-data-serializer";
import {
	DateExtension,
	BigIntExtension,
	ErrorExtension,
	SymbolExtension,
} from "form-data-serializer/extensions";

const EXT_MAP: Record<string, any> = {
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
		const value = deserialize(payload, extensions as any);
		return serialize({ ok: true, value } as any, extensions as any);
	} catch (err) {
		// ensure error serializable
		return serialize({ ok: false, errors: [String(err)] } as any, []);
	}
}
