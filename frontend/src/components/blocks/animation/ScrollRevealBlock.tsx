"use client";

import React from "react";
import { motion } from "framer-motion";
import type { BlockComponentProps, ScrollRevealSettings } from "../types";

export function ScrollRevealBlock({ data, locale }: BlockComponentProps<ScrollRevealSettings>) {
    const {
        title,
        description,
        duration = 500,
        delay = 0,
        direction = "up",
        easing = "ease-out",
        trigger = "scroll",
    } = data;

    const translateValue = 40;
    const initialY = direction === "up" ? translateValue : direction === "down" ? -translateValue : 0;
    const initialX = direction === "left" ? translateValue : direction === "right" ? -translateValue : 0;

    const animationProps = trigger === "scroll"
        ? { initial: { opacity: 0, y: initialY, x: initialX }, whileInView: { opacity: 1, y: 0, x: 0 }, viewport: { once: true, amount: 0.3 } }
        : { initial: { opacity: 0, y: initialY, x: initialX }, animate: { opacity: 1, y: 0, x: 0 } };

    return (
        <section className="py-12 px-4" data-testid="scroll-reveal-block">
            <motion.div
                className="mx-auto max-w-4xl"
                {...animationProps}
                transition={{
                    duration: duration / 1000,
                    delay: delay / 1000,
                    ease: (easing === "ease-in-out" ? "easeInOut" : easing === "linear" ? "linear" : easing === "ease-in" ? "easeIn" : "easeOut") as import("framer-motion").Easing
                }}
            >
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {title}
                </h2>
                {description && (
                    <p className="mt-4 text-lg text-muted-foreground">
                        {description}
                    </p>
                )}
            </motion.div>
        </section>
    );
}
