/**
 * Verify the testing setup works correctly:
 * - vitest runs with jsdom environment
 * - @testing-library/react renders components
 * - @testing-library/jest-dom matchers are available
 * - Path alias (@/) resolves correctly
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

function Greeting({ name }: { name: string }) {
  return (
    <div>
      <h1 className={cn("text-lg", "font-bold")}>Hello, {name}!</h1>
      <p role="status">Welcome to the site.</p>
    </div>
  );
}

describe("Testing setup verification", () => {
  it("renders a component and queries the DOM", () => {
    render(<Greeting name="Taha" />);
    expect(screen.getByRole("heading")).toHaveTextContent("Hello, Taha!");
  });

  it("jest-dom matchers work (toBeInTheDocument)", () => {
    render(<Greeting name="Test" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("path alias @/ resolves correctly", () => {
    expect(cn("text-lg", "font-bold")).toBe("text-lg font-bold");
  });
});
