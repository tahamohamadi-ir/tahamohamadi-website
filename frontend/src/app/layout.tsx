import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TahaMohamadi.ir",
  description:
    "Bilingual Persian/English personal website, blog, portfolio, and CMS",
};

/**
 * Root layout — intentionally minimal.
 * Lang/dir are set dynamically by the [locale] layout segment.
 * We suppress hydration warnings since lang/dir are set server-side per route.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
