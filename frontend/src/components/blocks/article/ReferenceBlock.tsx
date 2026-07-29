import { cn } from "@/lib/utils";
import type { BlockComponentProps, ReferenceContent } from "../types";

export function ReferenceBlock({ data, locale }: BlockComponentProps<ReferenceContent>) {
    const isRtl = locale === "fa";

    return (
        <div
            className={cn(
                "rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground",
                isRtl ? "border-r-2 border-r-primary/50" : "border-l-2 border-l-primary/50"
            )}
            dir={isRtl ? "rtl" : "ltr"}
        >
            {data.url ? (
                <a
                    href={data.url}
                    className="text-foreground underline-offset-4 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {data.text}
                </a>
            ) : (
                <span className="text-foreground">{data.text}</span>
            )}
            {(data.authors || data.year) && (
                <span className="mt-1 block text-xs text-muted-foreground">
                    {data.authors}
                    {data.authors && data.year && ", "}
                    {data.year}
                </span>
            )}
        </div>
    );
}
