import { cn } from "@/lib/utils";
import type { BlockComponentProps, HeroSettings } from "../types";

function safeCtaUrl(value: string | undefined): string | undefined {
    const url = value?.trim();
    if (!url) return undefined;
    if (url.startsWith("/") && !url.startsWith("//")) return url;
    if (url.startsWith("#")) return url;
    if (/^https?:\/\//i.test(url)) return url;
    return undefined;
}

export function HeroBlock({ data, locale }: BlockComponentProps<HeroSettings>) {
    const isRtl = locale === "fa";
    const ctaUrl = safeCtaUrl(data.cta_url);

    return (
        <section
            className="relative isolate flex min-h-[68vh] w-full items-center justify-center overflow-hidden border-y border-border/60 bg-background px-5 py-20 text-center sm:px-8 md:min-h-[74vh] md:py-28"
            dir={isRtl ? "rtl" : "ltr"}
        >
            <div
                aria-hidden="true"
                className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_15%,hsl(var(--primary)/0.16),transparent_42%),linear-gradient(to_bottom,hsl(var(--muted)/0.35),transparent_55%)]"
            />
            <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
            />
            {data.media_url && (
                <div className="absolute inset-0 -z-30 overflow-hidden" aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={data.media_url}
                        alt=""
                        className="h-full w-full object-cover opacity-15"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/75 to-background" />
                </div>
            )}

            <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
                {data.title && (
                    <h1
                        className={cn(
                            "text-balance text-5xl font-black leading-[1.05] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-8xl",
                            isRtl && "font-vazirmatn"
                        )}
                    >
                        {data.title}
                    </h1>
                )}
                {data.subtitle && (
                    <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl md:mt-9 md:text-2xl">
                        {data.subtitle}
                    </p>
                )}
                {ctaUrl && data.cta_label && (
                    <a
                        href={ctaUrl}
                        className="mt-10 inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-7 py-3 text-base font-semibold text-primary-foreground shadow-[0_12px_40px_-16px_hsl(var(--primary))] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none"
                    >
                        {data.cta_label}
                    </a>
                )}
            </div>
        </section>
    );
}
