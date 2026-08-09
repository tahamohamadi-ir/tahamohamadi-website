import { cn } from "@/lib/utils";
import type { BlockComponentProps, TextSettings } from "../types";

export function TextBlock({ data, locale }: BlockComponentProps<TextSettings>) {
    const alignmentClass = {
        start: "text-start",
        center: "text-center",
        end: "text-end",
    }[data.alignment ?? "start"];

    return (
        <div
            className={cn(
                "prose prose-lg max-w-none whitespace-pre-wrap dark:prose-invert",
                alignmentClass,
                locale === "fa" && "prose-rtl font-vazirmatn"
            )}
        >
            {data.content}
        </div>
    );
}
