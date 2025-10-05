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
	const { default: MDXContent, toc, metadata } = page;

	// ????
	const wrapperProps = { toc, metadata };

	return (
		// @ts-expect-error: wtf is nextra doing here ??
		<Wrapper {...wrapperProps} sourcecode={(page as any).sourceCode}>
			<MDXContent {...props} params={params} />
		</Wrapper>
	);
}
