import type { CalloutProps, CalloutStyles } from "./types";
import { twMerge } from "tailwind-merge";

const styles = {
	info: {
		container: "bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-900",
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				strokeWidth={1.5}
				stroke="currentColor"
				className="size-6 stroke-blue-500 dark:stroke-blue-400"
				aria-label="Info"
				role="img"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
				/>
			</svg>
		),
		title: "text-blue-800 dark:text-blue-300",
		content: "text-blue-700 dark:text-blue-400",
	},
	warning: {
		container: "bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-900",
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				strokeWidth={1.5}
				stroke="currentColor"
				className="size-6 stroke-amber-500 dark:stroke-amber-400"
				aria-label="Warning"
				role="img"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
				/>
			</svg>
		),
		title: "text-amber-800 dark:text-amber-300",
		content: "text-amber-700 dark:text-amber-400",
	},
	success: {
		container: "bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-900",
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				strokeWidth={1.5}
				stroke="currentColor"
				className="size-6 stroke-green-500 dark:stroke-green-400"
				aria-label="Success"
				role="img"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
				/>
			</svg>
		),
		title: "text-green-800 dark:text-green-300",
		content: "text-green-700 dark:text-green-400",
	},
} as const satisfies Record<string, CalloutStyles>;

export function Callout({ type = "info", title, children }: CalloutProps) {
	return (
		<div className={twMerge("rounded-lg border p-4", styles[type].container)}>
			<div className="flex items-start space-x-3">
				<div className="flex-shrink-0 pt-0.5 sm:block hidden">{styles[type].icon}</div>
				<div className="flex flex-col w-full gap-2">
					{title && <h1 className={twMerge("font-medium text-lg", styles[type].title)}>{title}</h1>}
					<div className={twMerge("text-sm flex flex-col gap-2", styles[type].content)}>
						{children}
					</div>
				</div>
			</div>
		</div>
	);
}
