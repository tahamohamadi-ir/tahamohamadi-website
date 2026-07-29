import { cn } from "@/lib/utils";
import type { BlockComponentProps, CtaSettings } from "../types";

export function CtaBlock({ data, locale }: BlockComponentProps<CtaSettings>) {
    const isPrimary = (data.variant ?? "primary") === "primary";

    return (
        <div className="flex w-full justify-center py-8" dir={locale === "fa" ? "rtl" : "ltr"}>
            <a
                href={data.url}
                className={cn(
                    "inline-flex items-center rounded-lg px-6 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isPrimary
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                )}
            >
                {data.label}
            </a>
        </div>
    );
}
