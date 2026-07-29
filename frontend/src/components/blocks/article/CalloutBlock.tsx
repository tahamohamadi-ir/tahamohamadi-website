import { cn } from "@/lib/utils";
import type { BlockComponentProps, CalloutContent } from "../types";

const calloutStyles: Record<string, { border: string; bg: string; icon: string }> = {
    info: {
        border: "border-blue-500/40",
        bg: "bg-blue-50 dark:bg-blue-950/20",
        icon: "ℹ️",
    },
    warning: {
        border: "border-yellow-500/40",
        bg: "bg-yellow-50 dark:bg-yellow-950/20",
        icon: "⚠️",
    },
    tip: {
        border: "border-green-500/40",
        bg: "bg-green-50 dark:bg-green-950/20",
        icon: "💡",
    },
    note: {
        border: "border-gray-500/40",
        bg: "bg-gray-50 dark:bg-gray-800/20",
        icon: "📝",
    },
};

export function CalloutBlock({ data, locale }: BlockComponentProps<CalloutContent>) {
    const style = calloutStyles[data.type ?? "note"] ?? calloutStyles.note;
    const isRtl = locale === "fa";

    return (
        <div
            className={cn(
                "w-full rounded-lg border p-4",
                style.border,
                style.bg,
                isRtl ? "border-r-4" : "border-l-4"
            )}
            dir={isRtl ? "rtl" : "ltr"}
            role="note"
        >
            <div className="flex items-start gap-3">
                <span className="shrink-0 text-lg" aria-hidden="true">
                    {style.icon}
                </span>
                <p className="text-sm text-foreground">{data.text}</p>
            </div>
        </div>
    );
}
