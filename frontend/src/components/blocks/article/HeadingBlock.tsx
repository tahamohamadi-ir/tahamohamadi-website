import { cn } from "@/lib/utils";
import type { BlockComponentProps, HeadingContent } from "../types";

const headingStyles: Record<number, string> = {
    1: "text-3xl font-bold md:text-4xl",
    2: "text-2xl font-bold md:text-3xl",
    3: "text-xl font-semibold md:text-2xl",
    4: "text-lg font-semibold md:text-xl",
    5: "text-base font-semibold md:text-lg",
    6: "text-sm font-semibold md:text-base",
};

export function HeadingBlock({ data, locale }: BlockComponentProps<HeadingContent>) {
    const Tag = `h${data.level}` as keyof Pick<
        React.JSX.IntrinsicElements,
        "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
    >;

    return (
        <Tag
            id={data.id}
            className={cn(
                headingStyles[data.level] ?? headingStyles[2],
                "scroll-mt-20 text-foreground",
                locale === "fa" && "font-vazirmatn"
            )}
        >
            {data.text}
        </Tag>
    );
}
