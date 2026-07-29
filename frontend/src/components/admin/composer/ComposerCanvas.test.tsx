import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComposerCanvas } from "./ComposerCanvas";
import type { ComposerSection } from "./types";

function makeSections(): ComposerSection[] {
    return [
        {
            id: "section-1",
            layout: "full-width",
            enabled: true,
            ordering: 0,
            blocks: [
                { id: "block-1", block_type: "hero", settings: {}, ordering: 0 },
                { id: "block-2", block_type: "text", settings: {}, ordering: 1 },
            ],
        },
        {
            id: "section-2",
            layout: "two-column",
            enabled: true,
            ordering: 1,
            blocks: [
                { id: "block-3", block_type: "cta", settings: {}, ordering: 0 },
            ],
        },
    ];
}

describe("ComposerCanvas", () => {
    it("renders empty state when no sections provided", () => {
        render(<ComposerCanvas />);
        expect(
            screen.getByText(/no sections yet/i)
        ).toBeInTheDocument();
    });

    it("renders initial sections with their blocks", () => {
        render(<ComposerCanvas initialSections={makeSections()} />);
        // Section labels in canvas (lowercase, CSS capitalizes visually)
        expect(screen.getByText("full width")).toBeInTheDocument();
        expect(screen.getByText("two column")).toBeInTheDocument();
        // Block type labels appear in both library and canvas, use getAllByText
        expect(screen.getAllByText(/hero/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/text/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/cta/i).length).toBeGreaterThanOrEqual(1);
    });

    it("adds a section via the section library", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<ComposerCanvas onChange={onChange} />);

        await user.click(screen.getByRole("button", { name: /full width/i }));

        expect(screen.queryByText(/no sections yet/i)).not.toBeInTheDocument();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ layout: "full-width" }),
            ])
        );
    });

    it("disables block library when no section selected", () => {
        render(<ComposerCanvas />);
        expect(screen.getByText(/select a section first/i)).toBeInTheDocument();
    });

    it("adds a block to a selected section", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<ComposerCanvas initialSections={makeSections()} onChange={onChange} />);

        // Select the first section by clicking its label in the canvas
        await user.click(screen.getByText("full width"));

        // Add a quote block
        await user.click(screen.getByRole("button", { name: /quote/i }));

        expect(onChange).toHaveBeenCalled();
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
        const firstSection = lastCall.find(
            (s: ComposerSection) => s.id === "section-1"
        );
        expect(firstSection.blocks).toHaveLength(3);
        expect(firstSection.blocks[2].block_type).toBe("quote");
    });

    it("deletes a section", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<ComposerCanvas initialSections={makeSections()} onChange={onChange} />);

        const deleteButtons = screen.getAllByRole("button", { name: /delete section/i });
        await user.click(deleteButtons[0]);

        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
        expect(lastCall).toHaveLength(1);
        expect(lastCall[0].id).toBe("section-2");
    });

    it("duplicates a section", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<ComposerCanvas initialSections={makeSections()} onChange={onChange} />);

        const dupButtons = screen.getAllByRole("button", { name: /duplicate section/i });
        await user.click(dupButtons[0]);

        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
        expect(lastCall).toHaveLength(3);
        expect(lastCall[0].layout).toBe("full-width");
        expect(lastCall[1].layout).toBe("full-width");
        expect(lastCall[1].id).not.toBe(lastCall[0].id);
    });

    it("moves a section up via keyboard button", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<ComposerCanvas initialSections={makeSections()} onChange={onChange} />);

        const moveUpButtons = screen.getAllByRole("button", { name: /move section up/i });
        // Second section's move-up button
        await user.click(moveUpButtons[1]);

        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
        expect(lastCall[0].id).toBe("section-2");
        expect(lastCall[1].id).toBe("section-1");
    });

    it("moves a section down via keyboard button", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<ComposerCanvas initialSections={makeSections()} onChange={onChange} />);

        const moveDownButtons = screen.getAllByRole("button", { name: /move section down/i });
        // First section's move-down button
        await user.click(moveDownButtons[0]);

        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
        expect(lastCall[0].id).toBe("section-2");
        expect(lastCall[1].id).toBe("section-1");
    });

    it("deletes a block from a section", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<ComposerCanvas initialSections={makeSections()} onChange={onChange} />);

        const deleteBlockBtns = screen.getAllByRole("button", { name: /delete block/i });
        await user.click(deleteBlockBtns[0]);

        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
        const firstSection = lastCall.find((s: ComposerSection) => s.id === "section-1");
        expect(firstSection.blocks).toHaveLength(1);
        expect(firstSection.blocks[0].id).toBe("block-2");
    });

    it("duplicates a block", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<ComposerCanvas initialSections={makeSections()} onChange={onChange} />);

        const dupBlockBtns = screen.getAllByRole("button", { name: /duplicate block/i });
        await user.click(dupBlockBtns[0]);

        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
        const firstSection = lastCall.find((s: ComposerSection) => s.id === "section-1");
        expect(firstSection.blocks).toHaveLength(3);
        expect(firstSection.blocks[0].block_type).toBe("hero");
        expect(firstSection.blocks[1].block_type).toBe("hero");
        expect(firstSection.blocks[1].id).not.toBe("block-1");
    });

    it("moves a block down via keyboard button", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<ComposerCanvas initialSections={makeSections()} onChange={onChange} />);

        const moveDownBtns = screen.getAllByRole("button", { name: /move block down/i });
        // First block in first section
        await user.click(moveDownBtns[0]);

        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
        const firstSection = lastCall.find((s: ComposerSection) => s.id === "section-1");
        expect(firstSection.blocks[0].id).toBe("block-2");
        expect(firstSection.blocks[1].id).toBe("block-1");
    });

    it("renders section and block library panels", () => {
        render(<ComposerCanvas />);
        expect(screen.getByText("Sections")).toBeInTheDocument();
        expect(screen.getByText("Blocks")).toBeInTheDocument();
    });
});
