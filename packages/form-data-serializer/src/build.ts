import { build } from "bun";
import { createProgram, ModuleKind, ModuleResolutionKind, ScriptTarget } from "typescript";

await build({
	entrypoints: ["src/index.ts", "src/extensions/index.ts"],
	outdir: "dist",
	format: "esm",
	target: "bun",
	minify: true,
	sourcemap: true,
	external: ["*"],
});

// Generate TypeScript declaration files
const program = createProgram({
	rootNames: ["src/index.ts", "src/extensions/index.ts"],
	options: {
		declaration: true,
		emitDeclarationOnly: true,
		outDir: "dist",
		target: ScriptTarget.ES2020,
		module: ModuleKind.ESNext,
		moduleResolution: ModuleResolutionKind.NodeJs,
		esModuleInterop: true,
		allowSyntheticDefaultImports: true,
		strict: true,
	},
});

program.emit();

console.info("Build and type generation complete!");
