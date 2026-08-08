import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OptimizedImage } from "@/components/ui/optimized-image";

describe("Accessibility Standards (WCAG 2.2 AA)", () => {
    it("associates labels correctly with form inputs via htmlFor and id", () => {
        render(
            <div>
                <Label htmlFor="user-email">Email Address</Label>
                <Input id="user-email" type="email" placeholder="user@example.com" />
            </div>
        );

        const inputEl = screen.getByLabelText("Email Address");
        expect(inputEl).toBeDefined();
        expect(inputEl.getAttribute("id")).toBe("user-email");
    });

    it("ensures images have appropriate alt attributes", () => {
        render(
            <div>
                <OptimizedImage
                    src="/test.jpg"
                    alt="Descriptive photo of author"
                    width={100}
                    height={100}
                />
            </div>
        );

        const imgEl = screen.getByAltText("Descriptive photo of author");
        expect(imgEl).toBeDefined();
    });

    it("ensures button elements have accessible names and aria-disabled support", () => {
        render(
            <Button disabled aria-disabled="true">
                Submit Form
            </Button>
        );

        const btnEl = screen.getByRole("button", { name: "Submit Form" });
        expect(btnEl).toBeDefined();
        expect(btnEl.getAttribute("aria-disabled")).toBe("true");
    });
});
