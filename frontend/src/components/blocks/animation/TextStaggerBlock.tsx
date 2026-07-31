"use client";

import React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { BlockComponentProps, TextStaggerSettings } from "../types";

export function TextStaggerBlock({ data }: BlockComponentProps<TextStaggerSettings>) {
    const { content, stagger_delay = 50, duration = 300, delay = 0 } = data;
    const words = content.split(" ");
    const prefersReducedMotion = useReducedMotion();

    const containerVariants: Variants = {
        hidden: { opacity: prefersReducedMotion ? 1 : 0 },
        visible: {
            opacity: 1,
            transition: {
                delayChildren: delay / 1000,
                staggerChildren: prefersReducedMotion ? 0 : stagger_delay / 1000,
            },
        },
    };

    const wordVariants: Variants = {
        hidden: { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: duration / 1000, ease: "easeOut" },
        },
    };

    return (
        <section
            className="py-12 px-4 text-center max-w-4xl mx-auto"
            data-testid="text-stagger-block"
        >
            <motion.div
                className="text-2xl font-semibold leading-relaxed sm:text-3xl text-foreground flex flex-wrap justify-center gap-x-2 gap-y-1"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
            >
                {words.map((word, idx) => (
                    <motion.span
                        key={idx}
                        variants={wordVariants}
                        className="inline-block"
                    >
                        {word}
                    </motion.span>
                ))}
            </motion.div>
        </section>
    );
}
