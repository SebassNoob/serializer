import { cpSync, rmSync } from "node:fs";
import { join } from "node:path";
import { build, spawnSync } from "bun";
import { createProgram, ModuleKind, ModuleResolutionKind, ScriptTarget } from "typescript";

interface BuildTask {
	name: string;
	fn: () => Promise<void> | void;
}

const LOCAL_OUTPUT_DIR = join(__dirname, "../docs");
const APP_OUTPUT_DIR = join(__dirname, "../../../apps/docs/src/content/__api");

async function runBuildTasks(tasks: BuildTask[]) {
	for (let i = 0; i < tasks.length; i++) {
		const task = tasks[i];
		const start = performance.now();

		try {
			await task.fn();
			const duration = ((performance.now() - start) / 1000).toFixed(2);
			console.info(
				`\x1b[34m(${i + 1}/${tasks.length}) \x1b[32m${duration}s\x1b[0m\x1b[0m ${task.name}`,
			);
		} catch (error) {
			const duration = ((performance.now() - start) / 1000).toFixed(2);
			console.error(
				`\x1b[34m(${i + 1}/${tasks.length}) \x1b[31m${duration}s\x1b[0m \x1b[31m${task.name} FAILED\x1b[0m`,
			);
			throw error;
		}
	}
}

async function bundleJavaScript() {
	await build({
		entrypoints: ["src/index.ts", "src/extensions/index.ts"],
		outdir: "dist",
		format: "esm",
		target: "bun",
		minify: true,
		sourcemap: true,
		external: ["*"],
	});
}

function generateTypeScriptDeclarations() {
	const program = createProgram({
		rootNames: ["src/index.ts", "src/extensions/index.ts"],
		options: {
			declaration: true,
			emitDeclarationOnly: true,
			outFile: "dist/bundle.d.ts", // This flattens all declarations into a single file
			target: ScriptTarget.ES2020,
			module: ModuleKind.ESNext,
			moduleResolution: ModuleResolutionKind.NodeJs,
			esModuleInterop: true,
			allowSyntheticDefaultImports: true,
			strict: true,
		},
	});

	program.emit();
}

function generateDocumentation() {
	const typedocResult = spawnSync(["bunx", "typedoc", "--options", "typedoc.config.mjs"]);

	if (typedocResult.exitCode !== 0) {
		const errorMsg = typedocResult.stderr
			? new TextDecoder().decode(typedocResult.stderr)
			: "Unknown error";
		throw new Error(errorMsg);
	}
	
	// Remove README.mdx if it was generated
	try {
		rmSync(join(LOCAL_OUTPUT_DIR, "README.mdx"), { force: true });
	} catch {
		// Ignore if file doesn't exist
	}
}

function copyToDocsApp() {
	rmSync(APP_OUTPUT_DIR, { recursive: true, force: true });
	// Copy files from source to target
	cpSync(LOCAL_OUTPUT_DIR, APP_OUTPUT_DIR, { recursive: true });
}

// Execute build steps
const buildTasks: BuildTask[] = [
	{ name: "JS bundled at dist/", fn: bundleJavaScript },
	{ name: "TypeScript declarations generated at dist/", fn: generateTypeScriptDeclarations },
	{ name: "Documentation generated at docs/", fn: generateDocumentation },
	{ name: "Documentation copied to apps/docs/public/docs/", fn: copyToDocsApp },
];

await runBuildTasks(buildTasks);
