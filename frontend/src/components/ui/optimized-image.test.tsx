import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { OptimizedImage } from "./optimized-image";

describe("OptimizedImage", () => {
    it("renders an img element with the correct alt text", () => {
        const { getByAltText } = render(
            <OptimizedImage
                src="/media/test.jpg"
                alt="Test image"
                width={400}
                height={300}
            />
        );
        const img = getByAltText("Test image");
        expect(img).toBeInTheDocument();
        expect(img.tagName).toBe("IMG");
    });

    it("applies default lazy loading", () => {
        const { getByAltText } = render(
            <OptimizedImage
                src="/media/test.jpg"
                alt="Lazy image"
                width={400}
                height={300}
            />
        );
        const img = getByAltText("Lazy image");
        expect(img).toHaveAttribute("loading", "lazy");
    });

    it("does not set loading when priority is true", () => {
        const { getByAltText } = render(
            <OptimizedImage
                src="/media/hero.jpg"
                alt="Priority image"
                width={1200}
                height={600}
                priority
            />
        );
        const img = getByAltText("Priority image");
        // When priority is set, Next.js handles preloading — loading attr should not be "lazy"
        expect(img.getAttribute("loading")).not.toBe("lazy");
    });

    it("applies custom className", () => {
        const { getByAltText } = render(
            <OptimizedImage
                src="/media/styled.jpg"
                alt="Styled image"
                width={200}
                height={200}
                className="rounded-lg object-cover"
            />
        );
        const img = getByAltText("Styled image");
        expect(img.className).toContain("rounded-lg");
        expect(img.className).toContain("object-cover");
    });

    it("uses default responsive sizes when none provided", () => {
        const { getByAltText } = render(
            <OptimizedImage
                src="/media/responsive.jpg"
                alt="Responsive image"
                width={800}
                height={600}
            />
        );
        const img = getByAltText("Responsive image");
        expect(img).toHaveAttribute("sizes");
        expect(img.getAttribute("sizes")).toContain("100vw");
    });

    it("allows custom sizes override", () => {
        const customSizes = "(max-width: 768px) 100vw, 50vw";
        const { getByAltText } = render(
            <OptimizedImage
                src="/media/custom-sizes.jpg"
                alt="Custom sizes"
                width={800}
                height={600}
                sizes={customSizes}
            />
        );
        const img = getByAltText("Custom sizes");
        expect(img.getAttribute("sizes")).toBe(customSizes);
    });
});
