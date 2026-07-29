/**
 * Component tests for LanguageSwitcher.
 *
 * **Validates: Requirements 15.4, 15.5**
 *
 * Tests that the language switcher:
 * - Navigates to equivalent page in the other locale
 * - Displays correct labels for each locale
 * - Generates correct paths for various URL patterns
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LanguageSwitcher } from "./LanguageSwitcher";

// Mock next/navigation
const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
    usePathname: () => mockUsePathname(),
}));

describe("LanguageSwitcher", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("locale switching navigation", () => {
        it("links to /en equivalent when current locale is fa", () => {
            mockUsePathname.mockReturnValue("/fa/blog");
            render(<LanguageSwitcher locale="fa" />);

            const link = screen.getByRole("link");
            expect(link).toHaveAttribute("href", "/en/blog");
        });

        it("links to /fa equivalent when current locale is en", () => {
            mockUsePathname.mockReturnValue("/en/blog");
            render(<LanguageSwitcher locale="en" />);

            const link = screen.getByRole("link");
            expect(link).toHaveAttribute("href", "/fa/blog");
        });

        it("preserves nested paths when switching locale", () => {
            mockUsePathname.mockReturnValue("/fa/portfolio/my-project");
            render(<LanguageSwitcher locale="fa" />);

            const link = screen.getByRole("link");
            expect(link).toHaveAttribute("href", "/en/portfolio/my-project");
        });

        it("handles root path with only locale segment", () => {
            mockUsePathname.mockReturnValue("/fa");
            render(<LanguageSwitcher locale="fa" />);

            const link = screen.getByRole("link");
            expect(link).toHaveAttribute("href", "/en");
        });

        it("handles blog detail paths", () => {
            mockUsePathname.mockReturnValue("/en/blog/my-article-slug");
            render(<LanguageSwitcher locale="en" />);

            const link = screen.getByRole("link");
            expect(link).toHaveAttribute("href", "/fa/blog/my-article-slug");
        });
    });

    describe("locale display and labels", () => {
        it("shows 'English' label when current locale is fa", () => {
            mockUsePathname.mockReturnValue("/fa");
            render(<LanguageSwitcher locale="fa" />);

            expect(screen.getByText("English")).toBeInTheDocument();
            expect(screen.getByText("EN")).toBeInTheDocument();
        });

        it("shows 'فارسی' label when current locale is en", () => {
            mockUsePathname.mockReturnValue("/en");
            render(<LanguageSwitcher locale="en" />);

            expect(screen.getByText("فارسی")).toBeInTheDocument();
            expect(screen.getByText("FA")).toBeInTheDocument();
        });

        it("sets hrefLang attribute to the alternate locale", () => {
            mockUsePathname.mockReturnValue("/fa");
            render(<LanguageSwitcher locale="fa" />);

            const link = screen.getByRole("link");
            expect(link).toHaveAttribute("hreflang", "en");
        });

        it("sets lang attribute to the alternate locale", () => {
            mockUsePathname.mockReturnValue("/en");
            render(<LanguageSwitcher locale="en" />);

            const link = screen.getByRole("link");
            expect(link).toHaveAttribute("lang", "fa");
        });
    });

    describe("accessibility", () => {
        it("has aria-label for fa locale", () => {
            mockUsePathname.mockReturnValue("/fa");
            render(<LanguageSwitcher locale="fa" />);

            const link = screen.getByRole("link");
            expect(link).toHaveAttribute("aria-label", "تغییر زبان به English");
        });

        it("has aria-label for en locale", () => {
            mockUsePathname.mockReturnValue("/en");
            render(<LanguageSwitcher locale="en" />);

            const link = screen.getByRole("link");
            expect(link).toHaveAttribute("aria-label", "Switch language to فارسی");
        });

        it("includes screen-reader-only current language text", () => {
            mockUsePathname.mockReturnValue("/fa");
            render(<LanguageSwitcher locale="fa" />);

            expect(screen.getByText("زبان فعلی: فارسی.")).toBeInTheDocument();
        });
    });
});
