"use client";
import { serialize, deserialize } from "form-data-serializer";
import { runSerialize } from "./runSerialize";
import {
	DateExtension,
	BigIntExtension,
	ErrorExtension,
	SymbolExtension,
} from "form-data-serializer/extensions";
import { useState, useReducer } from "react";
import { TEST_INPUTS, FLAGS, RESULT } from "../constants";

export default function Home() {
	const [output, setOutput] = useState<unknown | null>(null);
	const [input, setInput] = useState<string>("");
	const [testName, setTestName] = useState<string>("");
	const checkboxInitial = Object.fromEntries(Object.values(FLAGS).map((f) => [f, false]));
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
		let parsed;
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
		const extensions = [];
		if (flags.date) extensions.push(DateExtension);
		if (flags.bigint) extensions.push(BigIntExtension);
		if (flags.error) extensions.push(ErrorExtension);
		if (flags.symbol) extensions.push(SymbolExtension);

		// serialize returns a FormData instance
		const formData = serialize(parsed, extensions);

		try {
			const result = await runSerialize(testName || "", formData);
			setOutput(deserialize(result));
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
						id={TEST_INPUTS.NAME}
						placeholder="test name"
						value={testName}
						onChange={(e) => setTestName(e.target.value)}
					/>
					<input
						id={TEST_INPUTS.DATA}
						placeholder="JSON input"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						style={{ minWidth: 400 }}
					/>
					<button id={TEST_INPUTS.RUN} type="submit">
						Run serializer server action
					</button>
				</div>
				<div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center" }}>
					{Object.values(FLAGS).map((f) => (
						<label key={f}>
							<input
								id={f}
								type="checkbox"
								checked={flags[f]}
								onChange={(e) => dispatchFlags({ type: "toggle", key: f, value: e.target.checked })}
							/>{" "}
							{f.replace("flag-", "").replace(/^\w/, (c) => c.toUpperCase())}Ext
						</label>
					))}
				</div>
			</form>
			{output ? (
				<pre id={RESULT.RESOLVED}>{JSON.stringify(output, null, 2)}</pre>
			) : (
				<pre id={RESULT.UNRESOLVED}>No output yet</pre>
			)}
		</div>
	);
}
