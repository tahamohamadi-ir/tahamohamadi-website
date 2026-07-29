import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { BlockInspector } from "./BlockInspector";
import type { ComposerBlock } from "./types";

function makeBlock(overrides: Partial<ComposerBlock> = {}): ComposerBlock {
    return {
        id: "block-1",
        block_type: "hero",
        settings: {},
        ordering: 0,
        ...overrides,
    };
}

describe("BlockInspector", () => {
    it("renders the block type as heading", () => {
        const block = makeBlock({ block_type: "hero" });
        render(
            <BlockInspector
                block={block}
                onChange={vi.fn()}
                onDelete={vi.fn()}
                onClose={vi.fn()}
            />,
        );
        expect(screen.getByText("hero Settings")).toBeInTheDocument();
    });

    it("renders close button and calls onClose when clicked", async () => {
        const onClose = vi.fn();
        render(
            <BlockInspector
                block={makeBlock()}
                onChange={vi.fn()}
                onDelete={vi.fn()}
                onClose={onClose}
            />,
        );
        await userEvent.click(screen.getByLabelText("Close inspector"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("renders delete button and calls onDelete with block id", async () => {
        const onDelete = vi.fn();
        const block = makeBlock({ id: "block-42" });
        render(
            <BlockInspector
                block={block}
                onChange={vi.fn()}
                onDelete={onDelete}
                onClose={vi.fn()}
            />,
        );
        await userEvent.click(screen.getByText("Delete Block"));
        expect(onDelete).toHaveBeenCalledWith("block-42");
    });

    describe("Hero editor", () => {
        it("renders hero-specific fields", () => {
            const block = makeBlock({
                block_type: "hero",
                settings: { title: "Welcome", subtitle: "Hello" },
            });
            render(
                <BlockInspector
                    block={block}
                    onChange={vi.fn()}
                    onDelete={vi.fn()}
                    onClose={vi.fn()}
                />,
            );
            expect(screen.getByLabelText("Title")).toHaveValue("Welcome");
            expect(screen.getByLabelText("Subtitle")).toHaveValue("Hello");
            expect(screen.getByLabelText("Media ID")).toBeInTheDocument();
            expect(screen.getByLabelText("CTA URL")).toBeInTheDocument();
        });

        it("calls onChange with updated settings on input change", () => {
            const onChange = vi.fn();
            const block = makeBlock({
                block_type: "hero",
                settings: { title: "Old" },
            });
            render(
                <BlockInspector
                    block={block}
                    onChange={onChange}
                    onDelete={vi.fn()}
                    onClose={vi.fn()}
                />,
            );
            const titleInput = screen.getByLabelText("Title");
            fireEvent.change(titleInput, { target: { value: "New Title" } });
            expect(onChange).toHaveBeenCalledWith("block-1", { title: "New Title" });
        });
    });

    describe("Text editor", () => {
        it("renders content textarea and alignment select", () => {
            const block = makeBlock({
                block_type: "text",
                settings: { content: "Hello world", alignment: "center" },
            });
            render(
                <BlockInspector
                    block={block}
                    onChange={vi.fn()}
                    onDelete={vi.fn()}
                    onClose={vi.fn()}
                />,
            );
            expect(screen.getByLabelText("Content")).toHaveValue("Hello world");
            expect(screen.getByLabelText("Alignment")).toHaveValue("center");
        });
    });

    describe("Gallery editor", () => {
        it("renders media ids and layout select", () => {
            const block = makeBlock({
                block_type: "gallery",
                settings: { media_ids: ["id1", "id2"], layout: "carousel" },
            });
            render(
                <BlockInspector
                    block={block}
                    onChange={vi.fn()}
                    onDelete={vi.fn()}
                    onClose={vi.fn()}
                />,
            );
            expect(screen.getByLabelText("Media IDs (comma-separated)")).toHaveValue("id1, id2");
            expect(screen.getByLabelText("Layout")).toHaveValue("carousel");
        });
    });

    describe("CTA editor", () => {
        it("renders label, url, and variant fields", () => {
            const block = makeBlock({
                block_type: "cta",
                settings: { label: "Click Me", url: "https://example.com", variant: "secondary" },
            });
            render(
                <BlockInspector
                    block={block}
                    onChange={vi.fn()}
                    onDelete={vi.fn()}
                    onClose={vi.fn()}
                />,
            );
            expect(screen.getByLabelText("Label")).toHaveValue("Click Me");
            expect(screen.getByLabelText("URL")).toHaveValue("https://example.com");
            expect(screen.getByLabelText("Variant")).toHaveValue("secondary");
        });
    });

    describe("Collection editor", () => {
        it("renders source, filter, and limit fields", () => {
            const block = makeBlock({
                block_type: "collection",
                settings: { source: "portfolio", filter: { topic: "ai" }, limit: 6 },
            });
            render(
                <BlockInspector
                    block={block}
                    onChange={vi.fn()}
                    onDelete={vi.fn()}
                    onClose={vi.fn()}
                />,
            );
            expect(screen.getByLabelText("Source")).toHaveValue("portfolio");
            expect(screen.getByLabelText("Filter (JSON)")).toHaveValue(
                JSON.stringify({ topic: "ai" }, null, 2),
            );
            expect(screen.getByLabelText("Limit")).toHaveValue(6);
        });
    });

    describe("Quote editor", () => {
        it("renders text, author, and source fields", () => {
            const block = makeBlock({
                block_type: "quote",
                settings: { text: "A wise quote", author: "Author", source: "Book" },
            });
            render(
                <BlockInspector
                    block={block}
                    onChange={vi.fn()}
                    onDelete={vi.fn()}
                    onClose={vi.fn()}
                />,
            );
            expect(screen.getByLabelText("Quote Text")).toHaveValue("A wise quote");
            expect(screen.getByLabelText("Author")).toHaveValue("Author");
            expect(screen.getByLabelText("Source")).toHaveValue("Book");
        });
    });

    describe("Divider editor", () => {
        it("renders style select with correct value", () => {
            const block = makeBlock({
                block_type: "divider",
                settings: { style: "dots" },
            });
            render(
                <BlockInspector
                    block={block}
                    onChange={vi.fn()}
                    onDelete={vi.fn()}
                    onClose={vi.fn()}
                />,
            );
            expect(screen.getByLabelText("Style")).toHaveValue("dots");
        });

        it("calls onChange when style is changed", async () => {
            const onChange = vi.fn();
            const block = makeBlock({
                block_type: "divider",
                settings: { style: "line" },
            });
            render(
                <BlockInspector
                    block={block}
                    onChange={onChange}
                    onDelete={vi.fn()}
                    onClose={vi.fn()}
                />,
            );
            fireEvent.change(screen.getByLabelText("Style"), { target: { value: "space" } });
            expect(onChange).toHaveBeenCalledWith("block-1", { style: "space" });
        });
    });

    describe("Research Focus editor", () => {
        it("renders title and research areas", () => {
            const block = makeBlock({
                block_type: "research_focus",
                settings: {
                    title: "My Research",
                    areas: [{ name: "AI", description: "Artificial Intelligence" }],
                },
            });
            render(
                <BlockInspector
                    block={block}
                    onChange={vi.fn()}
                    onDelete={vi.fn()}
                    onClose={vi.fn()}
                />,
            );
            expect(screen.getByLabelText("Title")).toHaveValue("My Research");
            expect(screen.getByLabelText("Area 1 name")).toHaveValue("AI");
            expect(screen.getByLabelText("Area 1 description")).toHaveValue("Artificial Intelligence");
        });

        it("can add a new research area", async () => {
            const onChange = vi.fn();
            const block = makeBlock({
                block_type: "research_focus",
                settings: { title: "Research", areas: [] },
            });
            render(
                <BlockInspector
                    block={block}
                    onChange={onChange}
                    onDelete={vi.fn()}
                    onClose={vi.fn()}
                />,
            );
            await userEvent.click(screen.getByText("Add Research Area"));
            expect(onChange).toHaveBeenCalledWith("block-1", {
                title: "Research",
                areas: [{ name: "", description: "" }],
            });
        });

        it("can remove a research area", async () => {
            const onChange = vi.fn();
            const block = makeBlock({
                block_type: "research_focus",
                settings: {
                    title: "Research",
                    areas: [
                        { name: "AI", description: "desc1" },
                        { name: "ML", description: "desc2" },
                    ],
                },
            });
            render(
                <BlockInspector
                    block={block}
                    onChange={onChange}
                    onDelete={vi.fn()}
                    onClose={vi.fn()}
                />,
            );
            await userEvent.click(screen.getByLabelText("Remove area 1"));
            expect(onChange).toHaveBeenCalledWith("block-1", {
                title: "Research",
                areas: [{ name: "ML", description: "desc2" }],
            });
        });
    });

    it("has proper accessibility attributes", () => {
        render(
            <BlockInspector
                block={makeBlock()}
                onChange={vi.fn()}
                onDelete={vi.fn()}
                onClose={vi.fn()}
            />,
        );
        const aside = screen.getByRole("complementary");
        expect(aside).toHaveAttribute("aria-label", "Block Inspector");
    });
});
