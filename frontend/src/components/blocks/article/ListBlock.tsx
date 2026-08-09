import { cn } from "@/lib/utils";
import type { BlockComponentProps, ListContent } from "../types";

export function ListBlock({ data, locale }: BlockComponentProps<ListContent>) {
    const Tag = data.ordered ? "ol" : "ul";
    const isRtl = locale === "fa";

    return (
        <Tag
            className={cn(
                "space-y-2 text-foreground",
                data.ordered ? "list-decimal" : "list-disc",
                isRtl ? "pr-6" : "pl-6"
            )}
        >
            {data.items.map((item, index) => (
                <li key={index}>{item}</li>
            ))}

        </Tag>
    );
}
