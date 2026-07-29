"use client";

import React from "react";
import type { BlockComponentProps, ParallaxSettings } from "../types";

export function ParallaxBlock({ data }: BlockComponentProps<ParallaxSettings>) {
    const { title, subtitle, media_url, duration = 800, delay = 0 } = data;

    return (
        <section
            className="relative overflow-hidden py-24 text-center text-foreground bg-muted/30 transition-all motion-reduce:transition-none"
            style={{
                transitionDuration: `${duration}ms`,
                transitionDelay: `${delay}ms`,
            }}
            data-testid="parallax-block"
        >
            {media_url && (
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center opacity-20 motion-reduce:transform-none"
                    style={{ backgroundImage: `url(${media_url})` }}
                    aria-hidden="true"
                />
            )}
            <div className="relative z-10 mx-auto max-w-3xl px-4">
                <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                    {title}
                </h2>
                {subtitle && (
                    <p className="mt-4 text-xl text-muted-foreground">
                        {subtitle}
                    </p>
                )}
            </div>
        </section>
    );
}
