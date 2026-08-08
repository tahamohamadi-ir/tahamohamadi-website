"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

export const CustomCursor = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Update mouse position
        const updateMousePosition = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
            if (!isVisible) setIsVisible(true);
        };

        // Handle hover state for interactive elements
        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const isClickable = 
                window.getComputedStyle(target).cursor === "pointer" ||
                target.tagName.toLowerCase() === "a" ||
                target.tagName.toLowerCase() === "button" ||
                target.closest("a") !== null ||
                target.closest("button") !== null;
                
            setIsHovering(isClickable);
        };

        const handleMouseLeave = () => {
            setIsVisible(false);
        };

        window.addEventListener("mousemove", updateMousePosition);
        window.addEventListener("mouseover", handleMouseOver);
        document.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            window.removeEventListener("mousemove", updateMousePosition);
            window.removeEventListener("mouseover", handleMouseOver);
            document.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [isVisible]);

    if (typeof window === "undefined" || window.matchMedia("(pointer: coarse)").matches) {
        return null; // Don't show custom cursor on touch devices
    }

    const variants: Variants = {
        default: {
            x: mousePosition.x - 8,
            y: mousePosition.y - 8,
            scale: 1,
            opacity: isVisible ? 1 : 0,
            transition: {
                type: "spring",
                mass: 0.1,
                stiffness: 800,
                damping: 20
            }
        },
        hover: {
            x: mousePosition.x - 24,
            y: mousePosition.y - 24,
            scale: 3,
            opacity: isVisible ? 0.3 : 0,
            backgroundColor: "hsl(var(--primary))",
            transition: {
                type: "spring",
                mass: 0.1,
                stiffness: 800,
                damping: 20
            }
        }
    };

    return (
        <motion.div
            className={cn(
                "fixed top-0 left-0 w-4 h-4 rounded-full bg-primary pointer-events-none z-[9999] mix-blend-difference hidden md:block",
            )}
            variants={variants}
            animate={isHovering ? "hover" : "default"}
        />
    );
};
