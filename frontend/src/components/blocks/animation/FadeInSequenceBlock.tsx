"use client";

import React from "react";
import type { BlockComponentProps, FadeInSequenceSettings } from "../types";

export function FadeInSequenceBlock({ data }: BlockComponentProps<FadeInSequenceSettings>) {
    const { items = [], duration = 400, delay = 0 } = data;

    return (
        <section
            className="py-12 px-4 max-w-4xl mx-auto"
            data-testid="fade-in-sequence-block"
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm transition-all motion-reduce:transition-none"
                        style={{
                            transitionDuration: `${duration}ms`,
                            transitionDelay: `${delay + idx * 150}ms`,
                        }}
                    >
                        <p className="text-base font-medium">{item}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
