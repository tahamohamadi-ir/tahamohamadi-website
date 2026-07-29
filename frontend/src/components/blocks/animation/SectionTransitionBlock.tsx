"use client";

import React from "react";
import type { BlockComponentProps, SectionTransitionSettings } from "../types";

export function SectionTransitionBlock({ data }: BlockComponentProps<SectionTransitionSettings>) {
    const { transition_type = "fade", duration = 500 } = data;

    const transitionClass = {
        fade: "animate-in fade-in duration-500",
        slide: "animate-in slide-in-from-bottom duration-500",
        zoom: "animate-in zoom-in-95 duration-500",
        clip: "animate-in fade-in duration-300",
    }[transition_type] || "animate-in fade-in duration-500";

    return (
        <div
            className={`w-full py-6 border-t border-b bg-muted/20 motion-reduce:animate-none ${transitionClass}`}
            style={{ animationDuration: `${duration}ms` }}
            data-testid="section-transition-block"
        />
    );
}
