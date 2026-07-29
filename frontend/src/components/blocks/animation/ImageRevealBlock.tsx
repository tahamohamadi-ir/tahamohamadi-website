"use client";

import React from "react";
import type { BlockComponentProps, ImageRevealSettings } from "../types";

export function ImageRevealBlock({ data }: BlockComponentProps<ImageRevealSettings>) {
    const { media_url, alt = "", reveal_direction = "left", duration = 600 } = data;

    const transformClass = {
        left: "translate-x-0",
        right: "translate-x-0",
        top: "translate-y-0",
        bottom: "translate-y-0",
        center: "scale-100",
    }[reveal_direction] || "translate-x-0";

    return (
        <section
            className="py-8 px-4 max-w-3xl mx-auto overflow-hidden"
            data-testid="image-reveal-block"
        >
            <div
                className={`relative rounded-lg overflow-hidden shadow-lg transition-all motion-reduce:transform-none motion-reduce:transition-none ${transformClass}`}
                style={{ transitionDuration: `${duration}ms` }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={media_url}
                    alt={alt || "Revealed image"}
                    className="w-full h-auto object-cover rounded-lg"
                    loading="lazy"
                />
            </div>
        </section>
    );
}
