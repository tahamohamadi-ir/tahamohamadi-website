"use client";

import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";

interface GlowingBentoCardProps {
    className?: string;
    children: React.ReactNode;
    glowColor?: string;
}

export function GlowingBentoCard({
    className,
    children,
    glowColor = "rgba(139, 92, 246, 0.5)", // default to purple-500
}: GlowingBentoCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        const updateMousePosition = (ev: MouseEvent) => {
            if (!cardRef.current) return;
            const { clientX, clientY } = ev;
            const { left, top } = cardRef.current.getBoundingClientRect();
            setMousePosition({
                x: clientX - left,
                y: clientY - top,
            });
        };

        const currentRef = cardRef.current;
        if (currentRef && !prefersReducedMotion) {
            currentRef.addEventListener("mousemove", updateMousePosition);
            return () => {
                currentRef.removeEventListener("mousemove", updateMousePosition);
            };
        }
    }, [prefersReducedMotion]);

    return (
        <motion.div
            ref={cardRef}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
                "group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-colors hover:bg-white/10 dark:border-white/10 dark:bg-black/20 dark:hover:bg-white/5",
                className
            )}
        >
            {/* Glow Effect */}
            {!prefersReducedMotion && (
                <div
                    className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
                    style={{
                        background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, ${glowColor}, transparent 40%)`,
                        zIndex: -1,
                    }}
                />
            )}
            {/* Inner gradient border simulation */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_1px_1px_rgba(255,255,255,0.05)]" />
            
            <div className="relative z-10 flex h-full flex-col">
                {children}
            </div>
        </motion.div>
    );
}
