import { cn } from "@/lib/utils";
import type { BlockComponentProps, QuoteSettings } from "../types";

export function QuoteBlock({ data, locale }: BlockComponentProps<QuoteSettings>) {
    const isRtl = locale === "fa";
    const attribution = data.attribution ?? data.author;

    return (
        <blockquote
            className={cn(
                "mx-auto max-w-4xl border-primary py-6 md:py-10",
                isRtl ? "border-r-4 pr-6" : "border-l-4 pl-6"
            )}
            dir={isRtl ? "rtl" : "ltr"}
        >
            <p className="text-xl font-medium italic leading-relaxed text-foreground md:text-3xl">
                {data.text}
            </p>

            {(attribution || data.role) && (
                <footer className="mt-8 text-lg md:text-xl text-muted-foreground flex items-center gap-2">
                    <div className="h-[2px] w-12 bg-primary/50" />
                    {attribution && <span className="font-bold text-foreground">{attribution}</span>}
                    {attribution && data.role && <span>—</span>}
                    {data.role && <span>{data.role}</span>}
                </footer>
            )}
        </blockquote>
    );
}
