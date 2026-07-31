"use client";

import React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { BlockComponentProps, FadeInSequenceSettings } from "../types";

export function FadeInSequenceBlock({ data }: BlockComponentProps<FadeInSequenceSettings>) {
    const { items = [], duration = 400, delay = 0, easing = "ease-out" } = data;
    const prefersReducedMotion = useReducedMotion();

    const container: Variants = {
        hidden: { opacity: prefersReducedMotion ? 1 : 0 },
        visible: {
            opacity: 1,
            transition: {
                delayChildren: delay / 1000,
                staggerChildren: prefersReducedMotion ? 0 : 0.15,
            },
        },
    };

    const itemVariant: Variants = {
        hidden: { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: duration / 1000,
                ease: easing === "ease-in-out" ? "easeInOut" : easing === "linear" ? "linear" : easing === "ease-in" ? "easeIn" : "easeOut"
            },
        },
    };

    return (
        <section
            className="py-12 px-4 max-w-4xl mx-auto"
            data-testid="fade-in-sequence-block"
        >
            <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                variants={container}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
            >
                {items.map((item, idx) => (
                    <motion.div
                        key={idx}
                        variants={itemVariant}
                        className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm"
                    >
                        <p className="text-base font-medium">{item}</p>
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
}
