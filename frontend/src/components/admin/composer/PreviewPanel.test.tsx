import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { PreviewPanel } from "./PreviewPanel";
import type { ComposerSection } from "./types";

function makeSections(overrides: Partial<ComposerSection>[] = []): ComposerSection[] {
    if (overrides.length === 0) {
        return [
            {
                id: "section-1",
                layout: "full-width",
                enabled: true,
                ordering: 0,
                blocks: [
                    {
                        id: "block-1",
                        block_type: "text",
                        settings: { content: "Hello World" },
                        ordering: 0,
                    },
                ],
            },
        ];
    }
    return overrides.map((o, i) => ({
        id: `section-${i}`,
        layout: "full-width" as const,
        enabled: true,
        ordering: i,
        blocks: [],
        ...o,
    }));
}

describe("PreviewPanel", () => {
    it("renders device toggle buttons for desktop, tablet, and mobile", () => {
        render(<PreviewPanel sections={[]} />);

        expect(screen.getByRole("radio", { name: /desktop.*1440px/i })).toBeInTheDocument();
        expect(screen.getByRole("radio", { name: /tablet.*768px/i })).toBeInTheDocument();
        expect(screen.getByRole("radio", { name: /mobile.*375px/i })).toBeInTheDocument();
    });

    it("renders locale toggle buttons for fa and en", () => {
        render(<PreviewPanel sections={[]} />);

        expect(screen.getByRole("radio", { name: /فارسی/i })).toBeInTheDocument();
        expect(screen.getByRole("radio", { name: /english/i })).toBeInTheDocument();
    });

    it("defaults to desktop device and fa locale", () => {
        render(<PreviewPanel sections={[]} />);

        const desktopBtn = screen.getByRole("radio", { name: /desktop.*1440px/i });
        expect(desktopBtn).toHaveAttribute("aria-checked", "true");

        const faBtn = screen.getByRole("radio", { name: /فارسی/i });
        expect(faBtn).toHaveAttribute("aria-checked", "true");
    });

    it("switches to tablet width on tablet click", async () => {
        render(<PreviewPanel sections={makeSections()} />);

        await userEvent.click(screen.getByRole("radio", { name: /tablet.*768px/i }));

        const tabletBtn = screen.getByRole("radio", { name: /tablet.*768px/i });
        expect(tabletBtn).toHaveAttribute("aria-checked", "true");

        // Status bar should update
        expect(screen.getByText(/Tablet — 768px/)).toBeInTheDocument();
    });

    it("switches to mobile width on mobile click", async () => {
        render(<PreviewPanel sections={makeSections()} />);

        await userEvent.click(screen.getByRole("radio", { name: /mobile.*375px/i }));

        expect(screen.getByText(/Mobile — 375px/)).toBeInTheDocument();
    });

    it("switches locale to en and sets LTR direction", async () => {
        render(<PreviewPanel sections={makeSections()} />);

        await userEvent.click(screen.getByRole("radio", { name: /english/i }));

        const enBtn = screen.getByRole("radio", { name: /english/i });
        expect(enBtn).toHaveAttribute("aria-checked", "true");

        // Status bar should show LTR
        expect(screen.getByText(/LTR/)).toBeInTheDocument();
    });

    it("shows empty state when no sections", () => {
        render(<PreviewPanel sections={[]} />);

        // Default locale is fa, so Persian empty message shows
        expect(screen.getByText("محتوایی برای پیش‌نمایش وجود ندارد")).toBeInTheDocument();
    });

    it("shows English empty state when locale is en", async () => {
        render(<PreviewPanel sections={[]} />);

        await userEvent.click(screen.getByRole("radio", { name: /english/i }));

        expect(screen.getByText("No content to preview")).toBeInTheDocument();
    });

    it("renders enabled sections and skips disabled ones", () => {
        const sections = makeSections([
            {
                id: "s1",
                enabled: true,
                ordering: 0,
                blocks: [
                    { id: "b1", block_type: "text", settings: { content: "Visible" }, ordering: 0 },
                ],
            },
            {
                id: "s2",
                enabled: false,
                ordering: 1,
                blocks: [
                    { id: "b2", block_type: "text", settings: { content: "Hidden" }, ordering: 0 },
                ],
            },
        ]);

        render(<PreviewPanel sections={sections} />);

        expect(screen.getByText("Visible")).toBeInTheDocument();
        expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
    });

    it("has proper accessibility structure with radiogroups", () => {
        render(<PreviewPanel sections={[]} />);

        const deviceGroup = screen.getByRole("radiogroup", { name: /device preview/i });
        expect(deviceGroup).toBeInTheDocument();

        const localeGroup = screen.getByRole("radiogroup", { name: /locale preview/i });
        expect(localeGroup).toBeInTheDocument();
    });
});
