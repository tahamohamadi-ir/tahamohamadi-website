"use client";

import React from "react";
import { motion } from "framer-motion";
import type { BlockComponentProps, HoverCardSettings } from "../types";

export function HoverCardBlock({ data }: BlockComponentProps<HoverCardSettings>) {
    const { title, description, hover_effect = "scale", duration = 300, easing = "ease-out" } = data;

    const whileHover = {
        scale: { scale: 1.05 },
        lift: { y: -8 },
        glow: { boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.2), 0 4px 6px -4px rgba(59, 130, 246, 0.2)" }, // primary shadow
        flip: { rotateY: 10 },
    }[hover_effect] || { scale: 1.05 };

    return (
        <section
            className="py-8 px-4 max-w-xl mx-auto"
            data-testid="hover-card-block"
        >
            <motion.div
                className="p-6 rounded-xl border bg-card text-card-foreground shadow cursor-pointer"
                whileHover={whileHover}
                transition={{
                    duration: duration / 1000,
                    ease: (easing === "ease-in-out" ? "easeInOut" : easing === "linear" ? "linear" : easing === "ease-in" ? "easeIn" : "easeOut") as import("framer-motion").Easing
                }}
            >
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="mt-2 text-muted-foreground">{description}</p>
            </motion.div>
        </section>
    );
}
