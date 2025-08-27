import { Hono } from "hono";
import { deserialize, serialize } from "form-data-serializer";
import type { SerializationExtension, Serializable } from "../../../../serialize/types";
import {
	DateExtension,
	BigIntExtension,
	ErrorExtension,
	SymbolExtension,
} from "form-data-serializer/extensions";

const EXT_MAP: Record<string, SerializationExtension<any> | undefined> = {
	date: DateExtension,
	bigint: BigIntExtension,
	error: ErrorExtension,
	symbol: SymbolExtension,
};

function isExt(x: unknown): x is SerializationExtension<any> {
	if (!x || typeof x !== "object") return false;
	const obj = x as Partial<SerializationExtension<any>>;
	return (
		typeof obj.name === "string" &&
		typeof obj.serialize === "function" &&
		typeof obj.deserialize === "function"
	);
}

const app = new Hono();

// Helper to safely stringify JSON that may contain BigInt values
function safeJsonStringify(value: unknown) {
	return JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? `${v.toString()}n` : v));
}

app.get("/", (c) =>
	c.html(`<!doctype html>
<html>
<head><meta charset="utf-8"><title>hono test</title></head>
<body>
  <div id="test-only">ready</div>
  <script>
    // Minimal programmatic helper used by Playwright tests. Instead of importing the library in-browser
    // we POST the user's input string to the server which will perform the serialize/deserialize round-trip
    // using the library server-side and return a JSON string result.
    (function(){
      window.__runSerialized = async function(inputStr, tName, flagsObj){
        try{
          const res = await fetch('/runRaw', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ inputStr, name: tName, flags: flagsObj || {} }) });
          return await res.text();
        }catch(e){
          return JSON.stringify({ ok: false, errors: [String(e)] });
        }
      };
    })();
  </script>
</body>
</html>`),
);

// POST /run - accept form-data and optional extension names in query
// POST /runRaw - accepts JSON { inputStr, name, flags } and performs parse -> serialize/deserialize on server
app.post("/runRaw", async (c) => {
	try {
		const body = await c.req.json();
		const inputStr = body.inputStr;

		// parse like the Next.js helper: try JSON.parse, then parenthesized eval, then raw eval
		let parsed: any;
		let lastErr: any = null;
		try {
			parsed = JSON.parse(inputStr);
		} catch (e) {
			lastErr = e;
		}
		if (parsed === undefined) {
			try {
				// eslint-disable-next-line no-eval
				parsed = eval(`(${inputStr})`);
			} catch {}
		}
		if (parsed === undefined) {
			try {
				// eslint-disable-next-line no-eval
				parsed = eval(inputStr);
			} catch (rawErr) {
				return new Response(
					safeJsonStringify({ ok: false, errors: [`Parse error: ${String(rawErr ?? lastErr)}`] }),
					{ headers: { "content-type": "application/json" } },
				);
			}
		}

		const f = body.flags || {};
		const extensionNames: string[] = [];
		if (f["flag-date"]) extensionNames.push("date");
		if (f["flag-bigint"]) extensionNames.push("bigint");
		if (f["flag-error"]) extensionNames.push("error");
		if (f["flag-symbol"]) extensionNames.push("symbol");

		try {
			const extensions = extensionNames.map((n) => EXT_MAP[n]).filter(isExt);
			// serialize then deserialize on server to emulate round-trip
			const fdOrStr = serialize(parsed as unknown as Serializable, extensions);
			let result: unknown;
			if (
				fdOrStr instanceof FormData ||
				(fdOrStr && typeof (fdOrStr as { get?: Function }).get === "function")
			) {
				result = deserialize(fdOrStr as FormData, extensions);
			} else {
				result = fdOrStr as unknown;
			}
			return new Response(safeJsonStringify({ ok: true, value: result }), {
				headers: { "content-type": "application/json" },
			});
		} catch (err) {
			return new Response(
				safeJsonStringify({
					ok: false,
					errors: [String(err), (err && (err as unknown as { stack?: string }).stack) ?? ""],
				}),
				{ headers: { "content-type": "application/json" } },
			);
		}
	} catch (e) {
		return new Response(safeJsonStringify({ ok: false, errors: [String(e)] }), {
			headers: { "content-type": "application/json" },
		});
	}
});

// start server when run directly under Bun
if (import.meta.main) {
	// Hono provides request handling; use Bun to serve the app in this environment.
	Bun.serve({ fetch: app.fetch, port: 3001 });
}

export default app;
