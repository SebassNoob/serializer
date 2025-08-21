import nextra from "nextra";
import type { NextConfig } from "next";

const withNextra = nextra({
	//contentDirBasePath: "/docs",
});

export default withNextra({} satisfies NextConfig);
