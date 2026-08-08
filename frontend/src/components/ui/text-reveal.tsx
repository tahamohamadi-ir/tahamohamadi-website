"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

interface TextRevealProps {
    text: string;
    className?: string;
}

export function TextReveal({ text, className }: TextRevealProps) {
    const targetRef = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();

    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start 80%", "end 50%"],
    });

    const words = text.split(" ");

    return (
        <div ref={targetRef} className={cn("relative flex flex-wrap gap-x-3 gap-y-1", className)}>
            {words.map((word, i) => {
                const start = i / words.length;
                const end = start + (1 / words.length);
                
                return (
                    <Word 
                        key={i} 
                        progress={scrollYProgress} 
                        range={[start, end]}
                        prefersReducedMotion={prefersReducedMotion}
                    >
                        {word}
                    </Word>
                );
            })}
        </div>
    );
}

const Word = ({
    children,
    progress,
    range,
    prefersReducedMotion
}: {
    children: string;
    progress: MotionValue<number>;
    range: [number, number];
    prefersReducedMotion: boolean | null;
}) => {
    const opacity = useTransform(progress, range, [0.2, 1]);
    
    if (prefersReducedMotion) {
        return <span className="relative">{children}</span>;
    }

    return (
        <span className="relative">
            <span className="absolute opacity-20">{children}</span>
            <motion.span style={{ opacity }} className="text-foreground">
                {children}
            </motion.span>
        </span>
    );
};
