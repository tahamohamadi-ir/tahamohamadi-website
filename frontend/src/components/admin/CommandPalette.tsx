"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Search, FileText, Settings, LayoutTemplate, Palette, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const { theme, setTheme } = useTheme();
    const router = useRouter();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)}>
            <div className="relative w-full max-w-lg shadow-2xl rounded-xl border bg-card text-card-foreground overflow-hidden" onClick={e => e.stopPropagation()}>
                <Command className="w-full flex flex-col">
                    <div className="flex items-center border-b px-3">
                        <Search className="w-5 h-5 text-muted-foreground mr-2" />
                        <Command.Input 
                            placeholder="Type a command or search..." 
                            className="w-full bg-transparent p-3 outline-none placeholder:text-muted-foreground"
                            autoFocus
                        />
                    </div>
                    
                    <Command.List className="max-h-[300px] overflow-y-auto p-2">
                        <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                            No results found.
                        </Command.Empty>

                        <Command.Group heading="Navigation">
                            <Command.Item 
                                onSelect={() => runCommand(() => router.push("/admin/blog/new"))}
                                className="flex items-center px-2 py-2 rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer"
                            >
                                <FileText className="w-4 h-4 mr-2" /> Create New Post
                            </Command.Item>
                            <Command.Item 
                                onSelect={() => runCommand(() => router.push("/admin/composer"))}
                                className="flex items-center px-2 py-2 rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer"
                            >
                                <LayoutTemplate className="w-4 h-4 mr-2" /> Composer Canvas
                            </Command.Item>
                            <Command.Item 
                                onSelect={() => runCommand(() => router.push("/admin/settings"))}
                                className="flex items-center px-2 py-2 rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer"
                            >
                                <Settings className="w-4 h-4 mr-2" /> Settings
                            </Command.Item>
                        </Command.Group>

                        <Command.Group heading="Theme">
                            <Command.Item 
                                onSelect={() => runCommand(() => setTheme("light"))}
                                className="flex items-center px-2 py-2 rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer"
                            >
                                <Sun className="w-4 h-4 mr-2" /> Light Mode
                            </Command.Item>
                            <Command.Item 
                                onSelect={() => runCommand(() => setTheme("dark"))}
                                className="flex items-center px-2 py-2 rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer"
                            >
                                <Moon className="w-4 h-4 mr-2" /> Dark Mode
                            </Command.Item>
                            <Command.Item 
                                onSelect={() => runCommand(() => setTheme("system"))}
                                className="flex items-center px-2 py-2 rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer"
                            >
                                <Palette className="w-4 h-4 mr-2" /> System Theme
                            </Command.Item>
                        </Command.Group>
                    </Command.List>
                </Command>
            </div>
        </div>
    );
}
