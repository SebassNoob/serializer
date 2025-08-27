import { generateStaticParamsFor, importPage } from "nextra/pages";
import { useMDXComponents as getMDXComponents } from "@/mdx-components";

export const generateStaticParams = generateStaticParamsFor("mdxPath");

export async function generateMetadata(props: { params: Promise<{ mdxPath: string[] }> }) {
	const params = await props.params;
	const { metadata } = await importPage(params.mdxPath);
	return metadata;
}

const Wrapper = getMDXComponents().wrapper;

export default async function Page(props: { params: { mdxPath: string[] } }) {
	const params = await props.params;
	const page = await importPage(params.mdxPath);
	const MDXContent = page.default;
	const { toc, metadata } = page;
	// some build-time variants include `sourceCode`; make it optional at runtime
	// but always pass a string (fallback to empty string) because the theme
	// wrapper expects it as a required prop in the pruned build.
  // biome-ignore lint/suspicious/noExplicitAny: see below
	const sourceCode = (page as any).sourceCode ?? "";

	return (
		// @ts-expect-error: pass sourceCode for pruned builds where theme expects it
		<Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
			<MDXContent {...props} params={params} />
		</Wrapper>
	);
}
