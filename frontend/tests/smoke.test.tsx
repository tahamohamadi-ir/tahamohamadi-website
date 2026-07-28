import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}

describe("Smoke test", () => {
  it("renders a component and asserts it is in the document", () => {
    render(<Greeting name="World" />);
    expect(screen.getByRole("heading")).toHaveTextContent("Hello, World!");
    expect(screen.getByRole("heading")).toBeInTheDocument();
  });
});
