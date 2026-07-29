import { cn } from "@/lib/utils";
import type { BlockComponentProps, HeroSettings } from "../types";

export function HeroBlock({ data, locale }: BlockComponentProps<HeroSettings>) {
    const isRtl = locale === "fa";

    return (
        <div className="relative flex flex-col items-center justify-center py-16 md:py-24 lg:py-32 text-center">
            {data.media_url && (
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={data.media_url}
                        alt=""
                        className="h-full w-full object-cover opacity-20"
                    />
                </div>
            )}
            {data.title && (
                <h1
                    className={cn(
                        "text-3xl font-bold tracking-tight md:text-5xl lg:text-6xl",
                        isRtl && "font-vazirmatn"
                    )}
                >
                    {data.title}
                </h1>
            )}
            {data.subtitle && (
                <p className="mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
                    {data.subtitle}
                </p>
            )}
            {data.cta_url && data.cta_label && (
                <a
                    href={data.cta_url}
                    className="mt-8 inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    {data.cta_label}
                </a>
            )}
        </div>
    );
}
