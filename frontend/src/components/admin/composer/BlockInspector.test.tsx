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
            expect(screen.getByRole("button", { name: "Choose media..." })).toBeInTheDocument();
            expect(screen.queryByLabelText("Media ID")).not.toBeInTheDocument();
            expect(screen.getByLabelText("CTA URL")).toBeInTheDocument();
        });

        it("renders every bilingual legacy hero field without mixing schemas", () => {
            const block = makeBlock({
                block_type: "hero",
                settings: {
                    heading_fa: "عنوان فارسی",
                    heading_en: "English title",
                    subheading_fa: "زیرعنوان",
                    subheading_en: "Subtitle",
                    cta_text_fa: "بیشتر",
                    cta_text_en: "More",
                    cta_link: "/about",
                    media_id: "11111111-2222-4333-8444-555555555555",
                },
            });
            render(
                <BlockInspector block={block} onChange={vi.fn()} onDelete={vi.fn()} onClose={vi.fn()} />,
            );

            expect(screen.getByLabelText("Title — فارسی")).toHaveValue("عنوان فارسی");
            expect(screen.getByLabelText("Title — English")).toHaveValue("English title");
            expect(screen.getByLabelText("CTA text — فارسی")).toHaveValue("بیشتر");
            expect(screen.getByLabelText("CTA text — English")).toHaveValue("More");
            expect(screen.getByLabelText("CTA URL")).toHaveValue("/about");
            expect(screen.getByText("Media selected")).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Clear media selection" })).toBeInTheDocument();
            expect(screen.queryByText("11111111-2222-4333-8444-555555555555")).not.toBeInTheDocument();
            expect(screen.queryByLabelText("Media ID")).not.toBeInTheDocument();
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

        it("renders independent Persian and English content for localized text", () => {
            const block = makeBlock({
                block_type: "text",
                settings: { body_fa: "متن فارسی", body_en: "English body", alignment: "end" },
            });
            render(
                <BlockInspector block={block} onChange={vi.fn()} onDelete={vi.fn()} onClose={vi.fn()} />,
            );

            expect(screen.getByLabelText("Content — فارسی")).toHaveValue("متن فارسی");
            expect(screen.getByLabelText("Content — English")).toHaveValue("English body");
            expect(screen.getByLabelText("Alignment")).toHaveValue("end");
        });
    });

    describe("Gallery editor", () => {
        it("renders a non-raw selected-media list with individual clear controls", async () => {
            const onChange = vi.fn();
            const block = makeBlock({
                block_type: "gallery",
                settings: { media_ids: ["id1", "id2"], layout: "carousel" },
            });
            render(
                <BlockInspector
                    block={block}
                    onChange={onChange}
                    onDelete={vi.fn()}
                    onClose={vi.fn()}
                />,
            );
            expect(screen.getByText("2 media items selected")).toBeInTheDocument();
            expect(screen.queryByText(/id1|id2/)).not.toBeInTheDocument();
            expect(screen.queryByLabelText("Media IDs (comma-separated)")).not.toBeInTheDocument();
            await userEvent.click(screen.getByRole("button", { name: "Remove selected media 1" }));
            expect(onChange).toHaveBeenLastCalledWith("block-1", {
                media_ids: ["id2"],
                layout: "carousel",
            });
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
        it("renders only schema-backed text and attribution fields", () => {
            const block = makeBlock({
                block_type: "quote",
                settings: { text: "A wise quote", attribution: "Author — Book" },
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
            expect(screen.getByLabelText("Attribution")).toHaveValue("Author — Book");
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
        it("renders every schema-backed field", () => {
            const block = makeBlock({
                block_type: "research_focus",
                settings: {
                    title: "My Research",
                    description: "Artificial Intelligence",
                    icon: "brain",
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
            expect(screen.getByLabelText("Description")).toHaveValue("Artificial Intelligence");
            expect(screen.getByLabelText("Icon")).toHaveValue("brain");
        });
    });

    describe("Animation editors", () => {
        it("exposes every parallax field through its label and preserves a zero speed", () => {
            const onChange = vi.fn();
            const settings = {
                title: "Depth",
                subtitle: "Layered",
                media_url: "/media/depth.jpg",
                speed: 0.5,
                duration: 600,
                delay: 0,
                easing: "ease-out",
                trigger: "scroll",
            };
            render(
                <BlockInspector
                    block={makeBlock({ block_type: "parallax", settings })}
                    onChange={onChange}
                    onDelete={vi.fn()}
                    onClose={vi.fn()}
                />,
            );

            expect(screen.getByLabelText("Title")).toHaveValue("Depth");
            expect(screen.getByLabelText("Subtitle")).toHaveValue("Layered");
            expect(screen.getByLabelText("Media URL")).toHaveValue("/media/depth.jpg");
            fireEvent.change(screen.getByLabelText("Speed"), { target: { value: "0" } });
            expect(onChange).toHaveBeenLastCalledWith("block-1", { ...settings, speed: 0 });
        });

        it("preserves zero as a valid counter target", () => {
            const onChange = vi.fn();
            const settings = {
                label: "Projects",
                target_number: 12,
                suffix: "+",
                duration: 600,
                delay: 0,
                easing: "ease-out",
                trigger: "scroll",
            };
            render(
                <BlockInspector
                    block={makeBlock({ block_type: "counter_animation", settings })}
                    onChange={onChange}
                    onDelete={vi.fn()}
                    onClose={vi.fn()}
                />,
            );

            fireEvent.change(screen.getByLabelText("Target Number"), { target: { value: "0" } });
            expect(onChange).toHaveBeenLastCalledWith("block-1", {
                ...settings,
                target_number: 0,
            });
        });

        it("keeps all base animation fields editable", () => {
            const settings = {
                title: "Reveal",
                description: "Description",
                direction: "up",
                duration: 600,
                delay: 0,
                easing: "ease-out",
                trigger: "scroll",
            };
            render(
                <BlockInspector
                    block={makeBlock({ block_type: "scroll_reveal", settings })}
                    onChange={vi.fn()}
                    onDelete={vi.fn()}
                    onClose={vi.fn()}
                />,
            );

            expect(screen.getByLabelText("Description")).toHaveValue("Description");
            expect(screen.getByLabelText("Direction")).toHaveValue("up");
            expect(screen.getByLabelText("Duration (ms)")).toHaveValue(600);
            expect(screen.getByLabelText("Delay (ms)")).toHaveValue(0);
            expect(screen.getByLabelText("Easing")).toHaveValue("ease-out");
            expect(screen.getByLabelText("Trigger")).toHaveValue("scroll");
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
