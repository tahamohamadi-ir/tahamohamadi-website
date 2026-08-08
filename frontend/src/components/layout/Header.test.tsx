import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./Header";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en",
}));

describe("Header", () => {
  it("renders the published brand and a usable mobile navigation control", () => {
    render(
      <Header
        locale="en"
        brandName="Published Identity"
        navigationItems={[{ label: "Published Home", href: "/en" }]}
      />,
    );

    expect(screen.getByRole("link", { name: "Published Identity" })).toHaveAttribute("href", "/en");
    expect(screen.getByText("Menu")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Published Home" })[0]).toHaveAttribute("aria-current", "page");
  });

  it("does not render an empty navigation or fallback links", () => {
    render(<Header locale="en" brandName="Published Identity" navigationItems={[]} />);

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByText("Menu")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Home" })).not.toBeInTheDocument();
  });

  it("renders a published CTA only for a safe CMS destination", () => {
    const { rerender } = render(
      <Header
        locale="en"
        brandName="Published Identity"
        navigationItems={[]}
        primaryCta={{ label: "Request a consultation", href: "/en/contact" }}
      />,
    );

    expect(screen.getByRole("link", { name: "Request a consultation" })).toHaveAttribute(
      "href",
      "/en/contact",
    );

    rerender(
      <Header
        locale="en"
        brandName="Published Identity"
        navigationItems={[]}
        primaryCta={{ label: "Unsafe CTA", href: "javascript:alert(1)" }}
      />,
    );

    expect(screen.queryByRole("link", { name: "Unsafe CTA" })).not.toBeInTheDocument();
  });
});
