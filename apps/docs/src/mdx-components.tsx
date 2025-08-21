import { useMDXComponents as getThemeComponents } from "nextra-theme-docs"; // nextra-theme-blog or your custom theme
import type { MDXComponents } from "mdx/types";
import { Callout } from "@lib/ui";

// Get the default MDX components
const themeComponents = getThemeComponents();
const components: MDXComponents = {
  Callout
};

// Merge components
export function useMDXComponents() {
	return {
		...themeComponents,
		...components,
	};
}
