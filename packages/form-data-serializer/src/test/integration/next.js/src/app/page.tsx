"use client";
import { deserialize, serialize } from "form-data-serializer";
import { runSerialize } from "./runSerialize";
import {
	DateExtension,
	BigIntExtension,
	ErrorExtension,
	SymbolExtension,
} from "form-data-serializer/extensions";
import { useState, useReducer } from "react";

export default function Home() {
	const [output, setOutput] = useState<unknown | null>(null);
	const [input, setInput] = useState<string>("");
	const [testName, setTestName] = useState<string>("");
	const checkboxInitial = { date: false, bigint: false, error: false, symbol: false };
	function checkboxReducer(
		state: typeof checkboxInitial,
		action: { type: "toggle"; key: keyof typeof checkboxInitial; value: boolean },
	) {
		switch (action.type) {
			case "toggle":
				return { ...state, [action.key]: action.value };
			default:
				return state;
		}
	}
	const [flags, dispatchFlags] = useReducer(checkboxReducer, checkboxInitial);

	const submitHandler = async (e: React.FormEvent) => {
		e.preventDefault();
		// Unsafe parsing flow (dev-only):
		// 1) Try strict JSON.parse (fast/common)
		// 2) Fallback to eval('(' + input + ')') so object literals parse
		// 3) Fallback to raw eval for any remaining JS expressions
		let parsed: any;
		const s = input.trim();
		let lastErr: unknown = null;

		// 1) Try strict JSON.parse
		try {
			parsed = JSON.parse(s);
		} catch (e) {
			lastErr = e;
		}

		// 2) If JSON.parse didn't produce a value, try eval with parens (accepts object literals)
		if (parsed === undefined) {
			try {
				parsed = eval("(" + s + ")");
			} catch (e) {
				lastErr = e;
			}
		}

		// 3) Fallback: raw eval. If that fails, return error (guard return)
		if (parsed === undefined) {
			try {
				parsed = eval(s);
			} catch (rawErr) {
				setOutput({ ok: false, errors: [`Parse error: ${String(rawErr ?? lastErr)}`] });
				return;
			}
		}

		// build extensions list from user selection
		const extensions = [] as any[];
		if (flags.date) extensions.push(DateExtension);
		if (flags.bigint) extensions.push(BigIntExtension);
		if (flags.error) extensions.push(ErrorExtension);
		if (flags.symbol) extensions.push(SymbolExtension);

		// serialize returns a FormData instance
		const formData = serialize(parsed, extensions);

		try {
			const result = await runSerialize(testName || "", formData as any);
			setOutput(result);
		} catch (err) {
			setOutput({ ok: false, errors: [String(err)] });
		}
	};

	return (
		<div
			style={{
				width: "100vw",
				height: "100dvh",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: "1rem",
			}}
		>
			<form onSubmit={submitHandler}>
				<div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
					<input
						id="input-test-name"
						placeholder="test name"
						value={testName}
						onChange={(e) => setTestName(e.target.value)}
					/>
					<input
						id="input-json"
						placeholder="JSON input"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						style={{ minWidth: 400 }}
					/>
					<button id="run-btn" type="submit">Run serializer server action</button>
				</div>
				<div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center" }}>
					<label>
						<input
							id="flag-date"
							type="checkbox"
							checked={flags.date}
							onChange={(e) =>
								dispatchFlags({ type: "toggle", key: "date", value: e.target.checked })
							}
						/>{" "}
						DateExt
					</label>
					<label>
						<input
							id="flag-bigint"
							type="checkbox"
							checked={flags.bigint}
							onChange={(e) =>
								dispatchFlags({ type: "toggle", key: "bigint", value: e.target.checked })
							}
						/>{" "}
						BigIntExt
					</label>
					<label>
						<input
							id="flag-error"
							type="checkbox"
							checked={flags.error}
							onChange={(e) =>
								dispatchFlags({ type: "toggle", key: "error", value: e.target.checked })
							}
						/>{" "}
						ErrorExt
					</label>
					<label>
						<input
							id="flag-symbol"
							type="checkbox"
							checked={flags.symbol}
							onChange={(e) =>
								dispatchFlags({ type: "toggle", key: "symbol", value: e.target.checked })
							}
						/>{" "}
						SymbolExt
					</label>
				</div>
			</form>

			<pre id='result'>{output ? JSON.stringify(output, null, 2) : "No output yet"}</pre>
		</div>
	);
}
