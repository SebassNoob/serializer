"use client";
import { serialize, deserialize } from "form-data-serializer";
import { runSerialize } from "./runSerialize";
import {
	DateExtension,
	BigIntExtension,
	ErrorExtension,
	SymbolExtension,
} from "form-data-serializer/extensions";
import { useEffect } from "react";

// Minimal test-only page: register a programmatic helper used by the Playwright tests.
export default function Home() {
	useEffect(() => {
		(window as any).__runSerialized = async (
			inputStr: string,
			tName: string,
			flagsObj?: Record<string, boolean>,
		) => {
			let parsed: unknown;
			let lastErr: unknown = null;
			try {
				parsed = JSON.parse(inputStr);
			} catch (e) {
				lastErr = e;
			}
			if (parsed === undefined) {
				try {
					parsed = eval("(" + inputStr + ")");
				} catch (e) {
					lastErr = e;
				}
			}
			if (parsed === undefined) {
				try {
					parsed = eval(inputStr);
				} catch (rawErr) {
					return JSON.stringify({
						ok: false,
						errors: [`Parse error: ${String(rawErr ?? lastErr)}`],
					});
				}
			}

			const f = flagsObj ?? {};
			const extensionNames: string[] = [];
			if (f["flag-date"]) extensionNames.push("date");
			if (f["flag-bigint"]) extensionNames.push("bigint");
			if (f["flag-error"]) extensionNames.push("error");
			if (f["flag-symbol"]) extensionNames.push("symbol");

			try {
				// Build client-side extension objects for local serialize/deserialize
				const extMap: Record<string, any> = {
					date: DateExtension,
					bigint: BigIntExtension,
					error: ErrorExtension,
					symbol: SymbolExtension,
				};
				const clientExtensions = extensionNames.map((n) => extMap[n]).filter(Boolean);

				const fd = serialize(parsed as any, clientExtensions as any);
				const res = await runSerialize(tName || "", fd, extensionNames as any);
				const out = deserialize(res as any, clientExtensions as any);
				return JSON.stringify(out, (_k, v) => (typeof v === "bigint" ? `${v.toString()}n` : v));
			} catch (err) {
				return JSON.stringify({ ok: false, errors: [String(err)] });
			}
		};
	}, []);

	return <div id="test-only">ready</div>;
}
