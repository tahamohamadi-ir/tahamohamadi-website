import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("public document ownership", () => {
  it("keeps the only public main landmark in PublicLayout", () => {
    const layout = readSource("src/components/layout/PublicLayout.tsx");
    const publicRoutes = [
      "src/app/[locale]/page.tsx",
      "src/app/[locale]/about/page.tsx",
      "src/app/[locale]/contact/page.tsx",
      "src/app/[locale]/resume/page.tsx",
    ];

    expect(layout.match(/<main\b/g)).toHaveLength(1);
    expect(layout).toContain('id="main-content"');
    for (const route of publicRoutes) {
      expect(readSource(route)).not.toMatch(/<main\b/);
    }
  });

  it("does not restore a hardcoded Home identity fallback", () => {
    const home = readSource("src/app/[locale]/page.tsx");

    expect(home).toContain("if (!page) notFound();");
    expect(home).not.toContain("Content is loading");
  });
});
