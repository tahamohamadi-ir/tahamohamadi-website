import { cn } from "@/lib/utils";
import type { BlockComponentProps, ParagraphContent } from "../types";

export function ParagraphBlock({ data, locale }: BlockComponentProps<ParagraphContent>) {
    return (
        <p
            className={cn(
                "text-base leading-relaxed text-foreground",
                locale === "fa" && "font-vazirmatn"
            )}
            dangerouslySetInnerHTML={{ __html: data.text }}
        />
    );
}
