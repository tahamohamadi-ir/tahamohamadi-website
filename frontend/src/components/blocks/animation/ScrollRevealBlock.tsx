"use client";

import React from "react";
import type { BlockComponentProps, ScrollRevealSettings } from "../types";

export function ScrollRevealBlock({ data, locale }: BlockComponentProps<ScrollRevealSettings>) {
    const {
        title,
        description,
        duration = 500,
        delay = 0,
        direction = "up",
    } = data;

    const translateClass = {
        up: "translate-y-8",
        down: "-translate-y-8",
        left: "translate-x-8",
        right: "-translate-x-8",
    }[direction] || "translate-y-8";

    return (
        <section
            className="py-12 px-4 transition-all motion-reduce:transition-none motion-reduce:transform-none"
            style={{
                transitionDuration: `${duration}ms`,
                transitionDelay: `${delay}ms`,
            }}
            data-testid="scroll-reveal-block"
        >
            <div className={`mx-auto max-w-4xl transform ${translateClass}`}>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {title}
                </h2>
                {description && (
                    <p className="mt-4 text-lg text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
        </section>
    );
}
