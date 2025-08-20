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

// Generate documentation using TypeDoc
const typedocResult = Bun.spawnSync([
	"bunx", 
	"typedoc", 
	"--entryPoints", "src/index.ts", "src/extensions/index.ts",
	"--out", "docs",
	"--plugin", "typedoc-plugin-markdown",
	"--readme", "none",
	"--excludeInternal"
]);

if (typedocResult.exitCode !== 0) {
	const errorMsg = typedocResult.stderr ? new TextDecoder().decode(typedocResult.stderr) : "Unknown error";
	console.error("TypeDoc generation failed:", errorMsg);
	process.exit(1);
}

console.info("Documentation generated successfully in ./docs");
