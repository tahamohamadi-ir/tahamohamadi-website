"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

interface TOCItem {
    id: string;
    text: string;
    level: number;
}

interface TableOfContentsProps {
    items: TOCItem[];
    locale: Locale;
}

export function TableOfContents({ items, locale }: TableOfContentsProps) {
    const [activeId, setActiveId] = useState<string>("");

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                }
            },
            { rootMargin: "-80px 0px -80% 0px", threshold: 0 }
        );

        const headings = items
            .map((item) => document.getElementById(item.id))
            .filter((el): el is HTMLElement => el !== null);

        for (const heading of headings) {
            observer.observe(heading);
        }

        return () => observer.disconnect();
    }, [items]);

    if (items.length === 0) return null;

    return (
        <nav className="sticky top-24" aria-label={locale === "fa" ? "فهرست مطالب" : "Table of Contents"}>
            <h2 className="mb-3 text-sm font-semibold text-foreground">
                {locale === "fa" ? "فهرست مطالب" : "Table of Contents"}
            </h2>
            <ul className="space-y-1 text-sm">
                {items.map((item) => (
                    <li
                        key={item.id}
                        style={{
                            paddingInlineStart: `${(item.level - 2) * 12}px`,
                        }}
                    >
                        <a
                            href={`#${item.id}`}
                            className={cn(
                                "block rounded px-2 py-1 text-muted-foreground transition-colors hover:text-foreground",
                                activeId === item.id &&
                                "bg-accent text-accent-foreground font-medium"
                            )}
                        >
                            {item.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
