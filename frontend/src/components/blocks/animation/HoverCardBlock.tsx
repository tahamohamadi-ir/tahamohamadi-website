"use client";

import React from "react";
import type { BlockComponentProps, HoverCardSettings } from "../types";

export function HoverCardBlock({ data }: BlockComponentProps<HoverCardSettings>) {
    const { title, description, hover_effect = "scale", duration = 300 } = data;

    const effectClass = {
        scale: "hover:scale-105",
        lift: "hover:-translate-y-2",
        glow: "hover:shadow-lg hover:shadow-primary/20",
        flip: "hover:rotate-1",
    }[hover_effect] || "hover:scale-105";

    return (
        <section
            className="py-8 px-4 max-w-xl mx-auto"
            data-testid="hover-card-block"
        >
            <div
                className={`p-6 rounded-xl border bg-card text-card-foreground shadow transition-all cursor-pointer motion-reduce:transform-none motion-reduce:transition-none ${effectClass}`}
                style={{ transitionDuration: `${duration}ms` }}
            >
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="mt-2 text-muted-foreground">{description}</p>
            </div>
        </section>
    );
}
