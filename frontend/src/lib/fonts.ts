import { Inter, Vazirmatn } from "next/font/google";

/**
 * Inter — Latin/English font (LTR).
 * Loaded with variable font support for optimal flexibility.
 */
export const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

/**
 * Vazirmatn — Persian/Arabic font (RTL).
 * Loaded with arabic subset for proper Farsi rendering.
 */
export const vazirmatn = Vazirmatn({
    subsets: ["arabic"],
    variable: "--font-vazirmatn",
    display: "swap",
});
