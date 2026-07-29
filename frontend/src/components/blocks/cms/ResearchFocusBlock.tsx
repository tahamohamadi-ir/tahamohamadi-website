import { cn } from "@/lib/utils";
import type { BlockComponentProps, ResearchFocusSettings } from "../types";

export function ResearchFocusBlock({
    data,
    locale,
}: BlockComponentProps<ResearchFocusSettings>) {
    const isRtl = locale === "fa";
    const areas = data.areas ?? [];

    return (
        <div className="w-full py-8" dir={isRtl ? "rtl" : "ltr"}>
            {data.title && (
                <h2
                    className={cn(
                        "mb-6 text-2xl font-bold md:text-3xl",
                        isRtl && "font-vazirmatn"
                    )}
                >
                    {data.title}
                </h2>
            )}
            {data.description && (
                <p className="mb-8 max-w-3xl text-muted-foreground">{data.description}</p>
            )}
            {areas.length > 0 && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {areas.map((area, index) => (
                        <div
                            key={index}
                            className="rounded-lg border border-border bg-card p-6 transition-shadow motion-reduce:transition-none hover:shadow-md"
                        >
                            {area.icon && (
                                <div className="mb-3 text-2xl" aria-hidden="true">
                                    {area.icon}
                                </div>
                            )}
                            <h3 className="mb-2 text-lg font-semibold">{area.name}</h3>
                            {area.description && (
                                <p className="text-sm text-muted-foreground">{area.description}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
