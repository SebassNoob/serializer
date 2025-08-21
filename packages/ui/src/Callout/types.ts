import type { ReactNode } from "react";
type CalloutType = "info" | "warning" | "success";

export interface CalloutProps {
	type?: CalloutType;
	title: string;
	children: string;
}

export interface CalloutStyles {
	container: string;
	icon: ReactNode;
	title: string;
	content: string;
}
