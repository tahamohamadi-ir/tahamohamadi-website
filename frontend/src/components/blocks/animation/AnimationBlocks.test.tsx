import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScrollRevealBlock } from "./ScrollRevealBlock";
import { ParallaxBlock } from "./ParallaxBlock";
import { TextStaggerBlock } from "./TextStaggerBlock";
import { FadeInSequenceBlock } from "./FadeInSequenceBlock";
import { HoverCardBlock } from "./HoverCardBlock";
import { CounterAnimationBlock } from "./CounterAnimationBlock";
import { ImageRevealBlock } from "./ImageRevealBlock";
import { SectionTransitionBlock } from "./SectionTransitionBlock";

describe("Animation Block Components", () => {
    it("renders ScrollRevealBlock with title and description", () => {
        render(
            <ScrollRevealBlock
                data={{
                    title: "Scroll Title",
                    description: "Scroll Description",
                    duration: 500,
                    delay: 0,
                    easing: "ease-in-out",
                    trigger: "scroll",
                    direction: "up",
                }}
                locale="fa"
            />
        );
        expect(screen.getByTestId("scroll-reveal-block")).toBeInTheDocument();
        expect(screen.getByText("Scroll Title")).toBeInTheDocument();
        expect(screen.getByText("Scroll Description")).toBeInTheDocument();
    });

    it("renders ParallaxBlock with title and subtitle", () => {
        render(
            <ParallaxBlock
                data={{
                    title: "Parallax Title",
                    subtitle: "Parallax Subtitle",
                    duration: 800,
                    delay: 0,
                    easing: "spring",
                    trigger: "scroll",
                }}
                locale="en"
            />
        );
        expect(screen.getByTestId("parallax-block")).toBeInTheDocument();
        expect(screen.getByText("Parallax Title")).toBeInTheDocument();
        expect(screen.getByText("Parallax Subtitle")).toBeInTheDocument();
    });

    it("renders TextStaggerBlock with staggered words", () => {
        render(
            <TextStaggerBlock
                data={{
                    content: "Hello World Animation",
                    stagger_delay: 50,
                    duration: 300,
                    delay: 0,
                    easing: "ease-out",
                    trigger: "load",
                }}
                locale="en"
            />
        );
        expect(screen.getByTestId("text-stagger-block")).toBeInTheDocument();
        expect(screen.getByText("Hello")).toBeInTheDocument();
        expect(screen.getByText("World")).toBeInTheDocument();
    });

    it("renders FadeInSequenceBlock with items", () => {
        render(
            <FadeInSequenceBlock
                data={{
                    items: ["Item 1", "Item 2", "Item 3"],
                    duration: 400,
                    delay: 100,
                    easing: "ease-in",
                    trigger: "scroll",
                }}
                locale="en"
            />
        );
        expect(screen.getByTestId("fade-in-sequence-block")).toBeInTheDocument();
        expect(screen.getByText("Item 1")).toBeInTheDocument();
        expect(screen.getByText("Item 2")).toBeInTheDocument();
    });

    it("renders HoverCardBlock with title and description", () => {
        render(
            <HoverCardBlock
                data={{
                    title: "Hover Card Title",
                    description: "Hover Card Desc",
                    hover_effect: "scale",
                    duration: 300,
                    delay: 0,
                    easing: "ease-out",
                    trigger: "hover",
                }}
                locale="fa"
            />
        );
        expect(screen.getByTestId("hover-card-block")).toBeInTheDocument();
        expect(screen.getByText("Hover Card Title")).toBeInTheDocument();
    });

    it("renders CounterAnimationBlock with label", () => {
        render(
            <CounterAnimationBlock
                data={{
                    label: "Projects Completed",
                    target_number: 50,
                    suffix: "+",
                    duration: 500,
                    delay: 0,
                    easing: "ease-out",
                    trigger: "scroll",
                }}
                locale="en"
            />
        );
        expect(screen.getByTestId("counter-animation-block")).toBeInTheDocument();
        expect(screen.getByText("Projects Completed")).toBeInTheDocument();
    });

    it("renders ImageRevealBlock with media_url", () => {
        render(
            <ImageRevealBlock
                data={{
                    media_url: "/media/test.jpg",
                    alt: "Test Image",
                    reveal_direction: "left",
                    duration: 600,
                    delay: 0,
                    easing: "ease-in-out",
                    trigger: "scroll",
                }}
                locale="en"
            />
        );
        expect(screen.getByTestId("image-reveal-block")).toBeInTheDocument();
        expect(screen.getByAltText("Test Image")).toBeInTheDocument();
    });

    it("suppresses unsafe animation media URLs", () => {
        const { container, rerender } = render(
            <ImageRevealBlock
                data={{
                    media_url: "javascript:alert(1)",
                    duration: 600,
                    delay: 0,
                    easing: "ease-out",
                    trigger: "scroll",
                }}
                locale="en"
            />,
        );
        expect(container).toBeEmptyDOMElement();

        rerender(
            <ParallaxBlock
                data={{
                    title: "Safe text",
                    media_url: "javascript:alert(1)",
                    duration: 600,
                    delay: 0,
                    easing: "ease-out",
                    trigger: "scroll",
                }}
                locale="en"
            />,
        );
        expect(screen.getByText("Safe text")).toBeInTheDocument();
        expect(container.querySelector('[style*="background-image"]')).not.toBeInTheDocument();
    });

    it("renders SectionTransitionBlock", () => {
        render(
            <SectionTransitionBlock
                data={{
                    transition_type: "fade",
                    duration: 500,
                    delay: 0,
                    easing: "linear",
                    trigger: "scroll",
                }}
                locale="fa"
            />
        );
        expect(screen.getByTestId("section-transition-block")).toBeInTheDocument();
    });
});
