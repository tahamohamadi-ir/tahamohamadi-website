import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./Header";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en",
}));

describe("Header", () => {
  it("renders the published brand and a usable mobile navigation control", () => {
    render(<Header locale="en" brandName="Published Identity" />);

    expect(screen.getByRole("link", { name: "Published Identity" })).toHaveAttribute("href", "/en");
    expect(screen.getByText("Menu")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Home" })[0]).toHaveAttribute("aria-current", "page");
  });
});
