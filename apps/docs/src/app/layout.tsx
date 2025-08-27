import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Form Data Serializer",
  description:
    "Serialize complex data structures, including Dates, Errors, BigInts, Symbols, and more, into FormData for HTTP requests.",
  icons: {
    icon: "/favicon.ico",
  },
  
};

const navbar = (
	<Navbar
		logo={<h1 className="font-bold">Form Data Serializer</h1>}
		// ... Your additional navbar options
	/>
);
const footer = <Footer>Powered by Nextra. © SebassNoob.</Footer>;

export default async function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html
			// Not required, but good for SEO
			lang="en"
			// Required to be set
			dir="ltr"
			// Suggested by `next-themes` package https://github.com/pacocoursey/next-themes#with-app
			suppressHydrationWarning
		>
			<Head
			// ... Your additional head options
			>
				{/* Your additional tags should be passed as `children` of `<Head>` element */}
			</Head>
			<body>
				<Layout
					navbar={navbar}
					pageMap={await getPageMap()}
					docsRepositoryBase="https://github.com/SebassNoob/serializer"
					footer={footer}
					// ... Your additional layout options
				>
					{children}
				</Layout>
			</body>
		</html>
	);
}
