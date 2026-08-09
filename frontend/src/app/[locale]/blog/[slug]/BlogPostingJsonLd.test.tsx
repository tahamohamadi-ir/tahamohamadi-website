import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BlogPostingJsonLd } from "./BlogPostingJsonLd";

describe("BlogPostingJsonLd", () => {
    it("escapes less-than characters so CMS strings cannot close the JSON-LD script", () => {
        const hostileTitle = '</script><script data-injected="true">alert(1)</script>';
        const html = renderToStaticMarkup(
            <BlogPostingJsonLd
                article={{
                    id: "article-1",
                    slug_fa: "article-fa",
                    slug_en: "article-en",
                    title_fa: hostileTitle,
                    title_en: hostileTitle,
                    excerpt_fa: "",
                    excerpt_en: "",
                    featured_image: null,
                    topics: [],
                    status: "published",
                    published_at: "2026-08-01T12:00:00Z",
                    reading_time_fa: 1,
                    reading_time_en: 1,
                }}
                locale="en"
                slug="article-en"
                wordCount={10}
            />
        );

        expect(html.match(/<script/g)).toHaveLength(1);
        expect(html).not.toContain('<script data-injected="true">');
        expect(html).toContain("\\u003c/script>\\u003cscript");
    });
});
