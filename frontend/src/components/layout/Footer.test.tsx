import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("renders only CMS-provided footer text and navigation", () => {
    render(
      <Footer
        locale="en"
        siteConfig={{
          settings: {
            site_title: "Site title",
            default_title: "",
            default_description: "",
            public_email: "",
            primary_cta_label: "",
            primary_cta_url: "",
            footer_text: "CMS footer text",
          },
          navigation: {
            header: [],
            footer: [
              { label: "About", href: "/en/about" },
              { label: "GitHub", href: "https://github.com/example" },
            ],
          },
        }}
      />,
    );

    expect(screen.getByText("CMS footer text")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/en/about");
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute("target", "_blank");
  });

  it("suppresses itself when no published CMS configuration is available", () => {
    const { container } = render(
      <Footer locale="fa" siteConfig={{ settings: null, navigation: { header: [], footer: [] } }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
