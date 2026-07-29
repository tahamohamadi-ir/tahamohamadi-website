"use client";

import React from "react";
import type { BlockComponentProps, TextStaggerSettings } from "../types";

export function TextStaggerBlock({ data }: BlockComponentProps<TextStaggerSettings>) {
    const { content, stagger_delay = 50, duration = 300 } = data;
    const words = content.split(" ");

    return (
        <section
            className="py-12 px-4 text-center max-w-4xl mx-auto"
            data-testid="text-stagger-block"
        >
            <div className="text-2xl font-semibold leading-relaxed sm:text-3xl text-foreground flex flex-wrap justify-center gap-x-2 gap-y-1">
                {words.map((word, idx) => (
                    <span
                        key={idx}
                        className="inline-block transition-opacity duration-300 motion-reduce:transition-none motion-reduce:opacity-100"
                        style={{
                            transitionDelay: `${idx * stagger_delay}ms`,
                            transitionDuration: `${duration}ms`,
                        }}
                    >
                        {word}
                    </span>
                ))}
            </div>
        </section>
    );
}
