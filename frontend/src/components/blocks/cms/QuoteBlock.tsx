import { cn } from "@/lib/utils";
import type { BlockComponentProps, QuoteSettings } from "../types";

export function QuoteBlock({ data, locale }: BlockComponentProps<QuoteSettings>) {
    const isRtl = locale === "fa";

    return (
        <blockquote
            className={cn(
                "border-primary py-4",
                isRtl ? "border-r-4 pr-6" : "border-l-4 pl-6"
            )}
            dir={isRtl ? "rtl" : "ltr"}
        >
            <p className="text-lg italic text-foreground">{data.text}</p>
            {(data.author || data.role) && (
                <footer className="mt-3 text-sm text-muted-foreground">
                    {data.author && <span className="font-medium">{data.author}</span>}
                    {data.author && data.role && <span> — </span>}
                    {data.role && <span>{data.role}</span>}
                </footer>
            )}
        </blockquote>
    );
}
