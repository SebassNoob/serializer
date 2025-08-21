import { join } from "node:path";

const LOCAL_OUTPUT_DIR = join(import.meta.dirname, "docs");

/** @type {Partial<import("typedoc").TypeDocOptions>} */
const config = {
	entryPoints: ["src/index.ts", "src/extensions/index.ts"],
	out: LOCAL_OUTPUT_DIR,
	plugin: ["typedoc-plugin-markdown"],
	readme: "none",
	excludeInternal: true,
	fileExtension: ".mdx",
	entryPointStrategy: "expand", // Create separate modules for each entry point
	flattenOutputFiles: true, // Put both files at the same level
	outputFileStrategy: "modules", // Group by modules - one file per module
	hideBreadcrumbs: true,
	hidePageHeader: true,
	interfacePropertiesFormat: "table",
	parametersFormat: "table",
	typeAliasPropertiesFormat: "table",
	enumMembersFormat: "table",
	propertyMembersFormat: "table",
	typeDeclarationFormat: "table",
	includeVersion: true,
	categorizeByGroup: true,
	groupOrder: ["Functions", "Classes", "Interfaces", "Type Aliases", "Variables"],
	navigation: {
		includeCategories: true,
		includeGroups: true,
	},
	sanitizeComments: true,
};

export default config;
