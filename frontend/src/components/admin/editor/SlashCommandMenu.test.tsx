import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SlashCommandMenu } from "./SlashCommandMenu";

describe("SlashCommandMenu", () => {
    it("offers only commands with real editor conversions", () => {
        render(
            <SlashCommandMenu
                query=""
                position={{ top: 0, left: 0 }}
                onSelect={vi.fn()}
                onClose={vi.fn()}
            />
        );

        expect(screen.getByRole("option", { name: /Image/ })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: /Gallery/ })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: /Callout/ })).toBeInTheDocument();
    });
});
