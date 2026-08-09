import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps extends React.ComponentPropsWithoutRef<"nav"> {
    items: BreadcrumbItem[];
    locale: "fa" | "en";
}

export function Breadcrumb({ items, locale, className, ...props }: BreadcrumbProps) {
    const Chevron = locale === "fa" ? ChevronLeft : ChevronRight;

    return (
        <nav
            aria-label={locale === "fa" ? "راهنما" : "Breadcrumb"}
            className={cn("flex items-center text-sm text-muted-foreground", className)}
            {...props}
        >
            <ol className="flex items-center space-x-2 rtl:space-x-reverse">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <li key={index} className="flex items-center">
                            {item.href && !isLast ? (
                                <Link
                                    href={item.href}
                                    className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span
                                    aria-current={isLast ? "page" : undefined}
                                    className={cn(isLast ? "font-medium text-foreground" : "")}
                                >
                                    {item.label}
                                </span>
                            )}

                            {!isLast && (
                                <Chevron className="mx-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
