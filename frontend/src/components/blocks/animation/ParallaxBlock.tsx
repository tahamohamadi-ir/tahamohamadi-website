"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import type { BlockComponentProps, ParallaxSettings } from "../types";
import { safeMediaUrl } from "../safe-media-url";

export function ParallaxBlock({ data }: BlockComponentProps<ParallaxSettings>) {
    const { title, subtitle, media_url, speed = 0.5, duration = 800, delay = 0 } = data;
    const mediaUrl = safeMediaUrl(media_url);

    const ref = useRef(null);
    const prefersReducedMotion = useReducedMotion();

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    // Parallax speed translation based on speed value
    const yTransform = useTransform(scrollYProgress, [0, 1], ["-10%", `${speed * 100}%`]);

    return (
        <section
            ref={ref}
            className="relative overflow-hidden py-32 text-center text-foreground bg-muted/30"
            data-testid="parallax-block"
        >
            {mediaUrl && (
                <motion.div
                    className="absolute inset-0 z-0 bg-cover bg-center opacity-30"
                    style={{
                        backgroundImage: `url(${mediaUrl})`,
                        y: prefersReducedMotion ? 0 : yTransform
                    }}
                    aria-hidden="true"
                />
            )}
            <motion.div
                className="relative z-10 mx-auto max-w-3xl px-4"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: duration / 1000, delay: delay / 1000, ease: "easeOut" }}
            >
                <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                    {title}
                </h2>
                {subtitle && (
                    <p className="mt-6 text-xl text-muted-foreground font-medium">
                        {subtitle}
                    </p>
                )}
            </motion.div>
        </section>
    );
}
