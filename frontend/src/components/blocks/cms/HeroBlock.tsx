import { cn } from "@/lib/utils";
import type { BlockComponentProps, HeroSettings } from "../types";

function safeCtaUrl(value: string | undefined, locale: "fa" | "en"): string | undefined {
  const url = value?.trim();
  if (!url) return undefined;
  if (url.startsWith("#")) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (!url.startsWith("/") || url.startsWith("//")) return undefined;
  if (/^\/(fa|en)(\/|$)/.test(url)) return url;
  return `/${locale}${url === "/" ? "" : url}`;
}

export function HeroBlock({ data, locale }: BlockComponentProps<HeroSettings>) {
  const isRtl = locale === "fa";
  const ctaUrl = safeCtaUrl(data.cta_url, locale);

  return (
    <section
      className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden bg-white text-black md:min-h-[calc(100svh-76px)]"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="mx-auto grid min-h-[inherit] w-full max-w-[1440px] items-center px-5 py-16 sm:px-8 sm:py-20 md:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] md:px-10 lg:px-12">
        <div className="relative z-10 max-w-4xl py-8 md:py-16">
          {data.title && (
            <h1
              className={cn(
                "max-w-[10ch] text-[clamp(4rem,9vw,8.75rem)] font-black leading-[0.83] tracking-[-0.075em] text-black",
                isRtl && "font-vazirmatn leading-[1.05] tracking-[-0.055em]"
              )}
            >
              {data.title}
            </h1>
          )}
          {data.subtitle && (
            <p className="mt-8 max-w-2xl text-2xl font-medium leading-8 tracking-[-0.025em] text-black/72 md:mt-10 md:text-[2rem] md:leading-[1.25]">
              {data.subtitle}
            </p>
          )}
          {ctaUrl && data.cta_label && (
            <a
              href={ctaUrl}
              className="mt-10 inline-flex min-h-14 items-center gap-5 bg-[#1746e0] px-6 py-4 text-base font-bold text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1746e0] focus-visible:ring-offset-4 motion-reduce:transition-none sm:mt-12 sm:px-8"
            >
              <span>{data.cta_label}</span>
              <span aria-hidden="true" className={cn("text-xl", isRtl && "rotate-180")}>
                →
              </span>
            </a>
          )}
        </div>

        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 w-[46%] overflow-hidden border-black/10 md:relative md:inset-auto md:h-[min(68vh,690px)] md:w-full",
            isRtl ? "left-0 border-r md:border" : "right-0 border-l md:border"
          )}
        >
          <div
            className="absolute inset-0 opacity-55"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0,0,0,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.12) 1px, transparent 1px)",
              backgroundSize: "42px 42px",
            }}
          />
          <div className="absolute left-[-18%] top-[15%] h-px w-[138%] rotate-[34deg] bg-[#1746e0]" />
          <div className="absolute bottom-[20%] right-[-20%] h-px w-[112%] -rotate-[24deg] bg-black/70" />
          <div className="absolute left-[25%] top-[30%] h-3 w-3 bg-[#1746e0]" />
          <div className="absolute bottom-[25%] right-[22%] h-2 w-2 bg-black" />
          {data.media_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.media_url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-20 grayscale mix-blend-multiply"
            />
          )}
        </div>
      </div>
    </section>
  );
}
