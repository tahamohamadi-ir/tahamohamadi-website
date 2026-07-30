import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CollectionBlock } from "./CollectionBlock";

describe("CollectionBlock", () => {
    it("renders the locale-specific portfolio title and route", () => {
        render(
            <CollectionBlock
                locale="en"
                data={{
                    source: "portfolio",
                    items: [{ slug_en: "case-study", title_en: "Published case study", outcome_en: "A public outcome" }],
                }}
            />,
        );

        expect(screen.getByRole("link", { name: "Published case study" })).toHaveAttribute(
            "href",
            "/en/portfolio/case-study",
        );
        expect(screen.getByText("A public outcome")).toBeInTheDocument();
    });

    it("uses the public blog route for the posts source", () => {
        render(
            <CollectionBlock
                locale="fa"
                data={{
                    source: "posts",
                    items: [{ slug_fa: "مقاله-نمونه", title_fa: "مقالهٔ منتشرشده" }],
                }}
            />,
        );

        expect(screen.getByRole("link", { name: "مقالهٔ منتشرشده" })).toHaveAttribute(
            "href",
            "/fa/blog/%D9%85%D9%82%D8%A7%D9%84%D9%87-%D9%86%D9%85%D9%88%D9%86%D9%87",
        );
    });

    it("suppresses an empty collection", () => {
        const { container } = render(<CollectionBlock locale="en" data={{ source: "blog", items: [] }} />);

        expect(container).toBeEmptyDOMElement();
    });
});
