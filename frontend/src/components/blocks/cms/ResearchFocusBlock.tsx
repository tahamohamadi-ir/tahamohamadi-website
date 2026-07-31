import { cn } from "@/lib/utils";
import type { BlockComponentProps, ResearchFocusSettings } from "../types";

export function ResearchFocusBlock({ data, locale }: BlockComponentProps<ResearchFocusSettings>) {
  const isRtl = locale === "fa";
  if (!data.title && !data.description) return null;

  return (
    <section
      className="mx-auto w-full max-w-5xl border-y border-black/10 px-5 py-14 sm:px-8 md:py-20"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="flex items-start gap-5">
        {data.icon && (
          <span
            aria-label={data.icon}
            className="inline-flex min-h-12 min-w-12 items-center justify-center border border-[#1746e0] px-2 text-sm font-bold text-[#1746e0]"
          >
            {data.icon}
          </span>
        )}
        <div>
          {data.title && (
            <h2 className={cn("text-3xl font-black tracking-[-0.04em] md:text-5xl", isRtl && "font-vazirmatn")}>
              {data.title}
            </h2>
          )}
          {data.description && (
            <p className="mt-5 max-w-3xl text-lg leading-8 text-black/70 md:text-xl">
              {data.description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
