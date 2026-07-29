"use client";

import React, { useEffect, useState } from "react";
import type { BlockComponentProps, CounterAnimationSettings } from "../types";

export function CounterAnimationBlock({ data }: BlockComponentProps<CounterAnimationSettings>) {
    const { label, target_number = 100, suffix = "", duration = 1500 } = data;
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = target_number;
        if (start === end) return;

        const totalMs = Math.max(duration, 300);
        const incrementTime = Math.max(Math.floor(totalMs / Math.abs(end)), 16);

        const timer = setInterval(() => {
            start += Math.ceil(end / (totalMs / incrementTime));
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(start);
            }
        }, incrementTime);

        return () => clearInterval(timer);
    }, [target_number, duration]);

    return (
        <section
            className="py-12 px-4 text-center max-w-sm mx-auto border rounded-xl bg-card shadow-sm"
            data-testid="counter-animation-block"
        >
            <div className="text-5xl font-black text-primary tracking-tight">
                {count}
                {suffix}
            </div>
            <p className="mt-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {label}
            </p>
        </section>
    );
}
