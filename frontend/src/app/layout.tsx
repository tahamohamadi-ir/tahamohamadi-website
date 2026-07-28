import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TahaMohamadi.ir",
  description:
    "Bilingual Persian/English personal website, blog, portfolio, and CMS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
