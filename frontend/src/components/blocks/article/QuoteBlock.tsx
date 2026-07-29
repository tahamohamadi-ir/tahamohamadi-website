import { cn } from "@/lib/utils";
import type { BlockComponentProps, QuoteSettings } from "../types";

/**
 * Article-level quote block.
 * Similar to CMS QuoteBlock but optimized for inline article context.
 */
export function ArticleQuoteBlock({ data, locale }: BlockComponentProps<QuoteSettings>) {
    const isRtl = locale === "fa";

    return (
        <blockquote
            className={cn(
                "border-primary/60 py-3",
                isRtl ? "border-r-4 pr-5" : "border-l-4 pl-5"
            )}
            dir={isRtl ? "rtl" : "ltr"}
        >
            <p className="text-base italic text-foreground">{data.text}</p>
            {(data.author || data.role) && (
                <footer className="mt-2 text-sm text-muted-foreground">
                    {data.author && <span className="font-medium">{data.author}</span>}
                    {data.author && data.role && <span> — </span>}
                    {data.role && <span>{data.role}</span>}
                </footer>
            )}
        </blockquote>
    );
}
