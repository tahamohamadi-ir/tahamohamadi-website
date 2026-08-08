"use client";

import React, { useRef, useState } from "react";
import { motion, useAnimation, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    as?: React.ElementType;
    href?: string;
}

export function ShinyButton({
    children,
    className,
    as: Component = "button",
    href,
    ...props
}: ShinyButtonProps) {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);
    const controls = useAnimation();
    const prefersReducedMotion = useReducedMotion();

    // Magnetic effect calculation
    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!buttonRef.current || prefersReducedMotion) return;
        
        const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
        
        // Calculate distance from center (-0.5 to 0.5)
        const x = (e.clientX - left) / width - 0.5;
        const y = (e.clientY - top) / height - 0.5;
        
        // Magnetic pull factor
        const pull = 15;
        
        controls.start({
            x: x * pull,
            y: y * pull,
            transition: { type: "spring", stiffness: 300, damping: 20, mass: 0.5 }
        });
        
        // Update shine position
        setMousePosition({
            x: e.clientX - left,
            y: e.clientY - top
        });
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        if (prefersReducedMotion) return;
        
        controls.start({
            x: 0,
            y: 0,
            transition: { type: "spring", stiffness: 300, damping: 20, mass: 0.5 }
        });
    };

    const Tag = href ? "a" : Component;
    const optionalProps = href ? { href } : {};

    return (
        <motion.div animate={controls} className="inline-block">
            <Tag
                {...optionalProps}
                {...(props as Record<string, unknown>)}
                ref={buttonRef as React.Ref<HTMLAnchorElement & HTMLButtonElement>}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={handleMouseLeave}
                className={cn(
                    "group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-primary px-8 py-4 text-base font-medium text-primary-foreground shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    className
                )}
            >
                {/* Sweep animation effect */}
                <div className="absolute inset-0 z-0 bg-[linear-gradient(110deg,transparent,45%,rgba(255,255,255,0.2),55%,transparent)] bg-[length:250%_100%] bg-[position:-100%_0] group-hover:animate-sweep motion-reduce:animate-none" />
                
                {/* Dynamic mouse glow overlay */}
                {isHovered && !prefersReducedMotion && (
                    <div 
                        className="pointer-events-none absolute inset-0 z-0 opacity-50 mix-blend-overlay transition-opacity duration-300"
                        style={{
                            background: `radial-gradient(circle 80px at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.8), transparent)`
                        }}
                    />
                )}
                
                <span className="relative z-10">{children}</span>
                
                {/* Outline border glow */}
                <div className="absolute inset-0 rounded-full border border-white/20 transition-colors group-hover:border-white/40" />
            </Tag>
        </motion.div>
    );
}
