import { NotFoundPage } from "nextra-theme-docs";
import { Title } from "@lib/ui";

export default function NotFound() {
	return (
		<NotFoundPage content="Submit an issue" labels="broken-link">
			<Title order={1} className="text-4xl">
				Page not found.
			</Title>
		</NotFoundPage>
	);
}
