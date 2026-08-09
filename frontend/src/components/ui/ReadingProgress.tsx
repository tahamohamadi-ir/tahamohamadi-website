"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ReadingProgressProps {
    className?: string;
}

export function ReadingProgress({ className }: ReadingProgressProps) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const updateProgress = () => {
            const currentProgress = window.scrollY;
            const scrollHeight = document.body.scrollHeight - window.innerHeight;
            
            if (scrollHeight > 0) {
                const percentage = (currentProgress / scrollHeight) * 100;
                setProgress(Math.min(Math.max(percentage, 0), 100));
            }
        };

        window.addEventListener("scroll", updateProgress, { passive: true });
        
        // Initial calculation
        updateProgress();

        return () => window.removeEventListener("scroll", updateProgress);
    }, []);

    return (
        <div 
            className={cn("fixed top-0 left-0 right-0 z-[100] h-1.5 bg-transparent", className)}
            aria-hidden="true"
        >
            <div 
                className="h-full bg-primary transition-all duration-150 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}
