"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SlashCommandItem } from "./types";

// ─── Slash Command Items ─────────────────────────────────────────────────────

const SLASH_COMMANDS: SlashCommandItem[] = [
    {
        id: "heading1",
        label: "Heading 1",
        description: "Large section heading",
        icon: "H1",
        command: "heading1",
    },
    {
        id: "heading2",
        label: "Heading 2",
        description: "Medium section heading",
        icon: "H2",
        command: "heading2",
    },
    {
        id: "heading3",
        label: "Heading 3",
        description: "Small section heading",
        icon: "H3",
        command: "heading3",
    },
    {
        id: "bulletList",
        label: "Bullet List",
        description: "Unordered list",
        icon: "•",
        command: "bulletList",
    },
    {
        id: "orderedList",
        label: "Numbered List",
        description: "Ordered list",
        icon: "1.",
        command: "orderedList",
    },
    {
        id: "blockquote",
        label: "Quote",
        description: "Block quotation",
        icon: "❝",
        command: "blockquote",
    },
    {
        id: "codeBlock",
        label: "Code Block",
        description: "Syntax-highlighted code",
        icon: "<>",
        command: "codeBlock",
    },
    {
        id: "divider",
        label: "Divider",
        description: "Horizontal rule separator",
        icon: "—",
        command: "divider",
    },
    {
        id: "image",
        label: "Image",
        description: "Insert image from Media Library",
        icon: "🖼",
        command: "image",
    },
    {
        id: "gallery",
        label: "Gallery",
        description: "Insert image gallery",
        icon: "▦",
        command: "gallery",
    },
    {
        id: "callout",
        label: "Callout",
        description: "Highlighted info box",
        icon: "ℹ",
        command: "callout",
    },
];

// ─── Props ───────────────────────────────────────────────────────────────────

interface SlashCommandMenuProps {
    query: string;
    position: { top: number; left: number };
    onSelect: (command: string) => void;
    onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SlashCommandMenu({
    query,
    position,
    onSelect,
    onClose,
}: SlashCommandMenuProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

    // Filter commands by query
    const filteredCommands = useMemo(() => {
        if (!query) return SLASH_COMMANDS;
        const lower = query.toLowerCase();
        return SLASH_COMMANDS.filter(
            (cmd) =>
                cmd.label.toLowerCase().includes(lower) ||
                cmd.description.toLowerCase().includes(lower)
        );
    }, [query]);

    // Reset selection when filtered list changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [filteredCommands.length]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < filteredCommands.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredCommands.length - 1
                );
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    onSelect(filteredCommands[selectedIndex].command);
                }
            } else if (e.key === "Escape") {
                e.preventDefault();
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [filteredCommands, selectedIndex, onSelect, onClose]);

    // Scroll selected item into view
    useEffect(() => {
        const menu = menuRef.current;
        if (!menu) return;
        const item = menu.children[selectedIndex] as HTMLElement | undefined;
        item?.scrollIntoView({ block: "nearest" });
    }, [selectedIndex]);

    if (filteredCommands.length === 0) {
        return null;
    }

    return (
        <div
            ref={menuRef}
            role="listbox"
            aria-label="Slash commands"
            className="absolute z-50 w-64 max-h-72 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg"
            style={{ top: position.top, left: position.left }}
        >
            {filteredCommands.map((cmd, index) => (
                <button
                    key={cmd.id}
                    role="option"
                    aria-selected={index === selectedIndex}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${index === selectedIndex
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50"
                        }`}
                    onClick={() => onSelect(cmd.command)}
                    onMouseEnter={() => setSelectedIndex(index)}
                >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-xs font-medium">
                        {cmd.icon}
                    </span>
                    <div className="flex flex-col">
                        <span className="font-medium">{cmd.label}</span>
                        <span className="text-xs text-muted-foreground">
                            {cmd.description}
                        </span>
                    </div>
                </button>
            ))}
        </div>
    );
}
