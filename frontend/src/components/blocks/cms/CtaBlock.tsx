import type { BlockComponentProps, CtaSettings } from "../types";

function safeLocalizedUrl(value: string | undefined, locale: "fa" | "en"): string | undefined {
  const url = value?.trim();
  if (!url) return undefined;
  if (url.startsWith("#") || /^https?:\/\//i.test(url)) return url;
  if (!url.startsWith("/") || url.startsWith("//")) return undefined;
  if (/^\/(fa|en)(\/|$)/.test(url)) return url;
  return `/${locale}${url === "/" ? "" : url}`;
}

export function CtaBlock({ data, locale }: BlockComponentProps<CtaSettings>) {
  const href = safeLocalizedUrl(data.url, locale);
  if (!href || !data.label?.trim()) return null;

  const isPrimary = (data.variant ?? "primary") === "primary";
  return (
    <div className="flex w-full justify-center py-12" dir={locale === "fa" ? "rtl" : "ltr"}>
      <a
        href={href}
        className={
          isPrimary
            ? "inline-flex min-h-12 items-center border border-[#1746e0] bg-[#1746e0] px-7 py-3 font-semibold text-white transition-colors hover:border-black hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1746e0] focus-visible:ring-offset-4"
            : "inline-flex min-h-12 items-center border border-black px-7 py-3 font-semibold text-black transition-colors hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1746e0] focus-visible:ring-offset-4"
        }
      >
        {data.label}
      </a>
    </div>
  );
}
