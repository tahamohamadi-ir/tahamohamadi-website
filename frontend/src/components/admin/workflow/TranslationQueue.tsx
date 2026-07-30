"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { adminFetch } from "@/lib/admin-fetch";

// ─── Types ───────────────────────────────────────────────────────────────────

export type TranslationStatus = "missing" | "incomplete" | "complete" | "outdated";

export interface TranslationField {
    key: string;
    label: string;
    en: string;
    fa: string;
}

export interface TranslationItem {
    id: string;
    content_type: string;
    title_en: string;
    title_fa: string;
    status_en: TranslationStatus;
    status_fa: TranslationStatus;
    last_updated: string;
    action_path: string;
    fields: TranslationField[];
}

interface TranslationQueueProps {
    /** Base URL for the translation status API. Defaults to /api/admin/workflow/translation-status/ */
    apiUrl?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TranslationStatus, { label: string; color: string; className: string }> = {
    missing: {
        label: "Missing",
        color: "red",
        className: "bg-red-100 text-red-800 border-red-200",
    },
    incomplete: {
        label: "Incomplete",
        color: "yellow",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    complete: {
        label: "Complete",
        color: "green",
        className: "bg-green-100 text-green-800 border-green-200",
    },
    outdated: {
        label: "Outdated",
        color: "orange",
        className: "bg-orange-100 text-orange-800 border-orange-200",
    },
};

const STATUS_FILTER_OPTIONS = [
    { value: "all", label: "All Statuses" },
    { value: "missing", label: "Missing" },
    { value: "incomplete", label: "Incomplete" },
    { value: "complete", label: "Complete" },
    { value: "outdated", label: "Outdated" },
];

const LOCALE_OPTIONS = [
    { value: "all", label: "All Locales" },
    { value: "en", label: "English" },
    { value: "fa", label: "فارسی (Persian)" },
];

const SORT_OPTIONS = [
    { value: "last_updated_desc", label: "Last Updated (newest)" },
    { value: "last_updated_asc", label: "Last Updated (oldest)" },
    { value: "title_asc", label: "Title (A-Z)" },
    { value: "title_desc", label: "Title (Z-A)" },
];

// ─── Status Badge Component ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: TranslationStatus }) {
    const config = STATUS_CONFIG[status];
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${config.className}`}
        >
            {config.label}
        </span>
    );
}

// ─── Side-by-Side Compare Panel ──────────────────────────────────────────────

function SideBySideCompare({
    item,
    onClose,
}: {
    item: TranslationItem;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 flex h-[80vh] w-full max-w-5xl flex-col rounded-lg border border-border bg-background shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <div>
                        <h3 className="text-lg font-semibold">
                            Side-by-Side Compare
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {item.title_en || item.title_fa || "Untitled"}
                            <span className="ml-2 text-xs uppercase text-muted-foreground">
                                ({item.content_type})
                            </span>
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close compare panel">
                        ✕
                    </Button>
                </div>

                {/* Content */}
                <div className="grid flex-1 grid-cols-2 divide-x divide-border overflow-hidden">
                    {/* English (Source) */}
                    <div className="flex flex-col overflow-hidden">
                        <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2">
                            <span className="text-sm font-medium">English</span>
                            <StatusBadge status={item.status_en} />
                        </div>
                        <div className="flex-1 space-y-5 overflow-y-auto p-4">
                            {item.fields.map((field) => (
                                <section key={field.key}>
                                    <h4 className="mb-1 text-sm font-semibold text-muted-foreground">{field.label}</h4>
                                    <div className="whitespace-pre-wrap text-sm text-foreground/80">
                                        {field.en || <span className="italic text-muted-foreground">No content available</span>}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </div>

                    {/* Persian (Target) */}
                    <div className="flex flex-col overflow-hidden" dir="rtl">
                        <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2">
                            <span className="text-sm font-medium">فارسی</span>
                            <StatusBadge status={item.status_fa} />
                        </div>
                        <div className="flex-1 space-y-5 overflow-y-auto p-4">
                            {item.fields.map((field) => (
                                <section key={field.key}>
                                    <h4 className="mb-1 text-sm font-semibold text-muted-foreground">{field.label}</h4>
                                    <div className="whitespace-pre-wrap text-sm text-foreground/80">
                                        {field.fa || <span className="italic text-muted-foreground">محتوایی موجود نیست</span>}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end border-t border-border px-6 py-3">
                    <Button variant="outline" size="sm" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function TranslationQueue({
    apiUrl = "/api/admin/workflow/translation-status/",
}: TranslationQueueProps) {
    const [items, setItems] = useState<TranslationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState("all");
    const [localeFilter, setLocaleFilter] = useState("all");
    const [sortBy, setSortBy] = useState("last_updated_desc");

    // Compare panel
    const [compareItem, setCompareItem] = useState<TranslationItem | null>(null);

    // ─── Fetch Data ────────────────────────────────────────────────────────────

    const fetchTranslationStatus = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setItems(await adminFetch<TranslationItem[]>(apiUrl));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, [apiUrl]);

    useEffect(() => {
        fetchTranslationStatus();
    }, [fetchTranslationStatus]);

    // ─── Filter & Sort ─────────────────────────────────────────────────────────

    const filteredItems = useMemo(() => {
        let result = [...items];

        // Status filter
        if (statusFilter !== "all") {
            result = result.filter((item) => {
                if (localeFilter === "en") return item.status_en === statusFilter;
                if (localeFilter === "fa") return item.status_fa === statusFilter;
                return item.status_en === statusFilter || item.status_fa === statusFilter;
            });
        }

        // With no explicit status, a locale filter is an actionable queue.
        if (localeFilter !== "all" && statusFilter === "all") {
            result = result.filter((item) => (
                localeFilter === "en" ? item.status_en : item.status_fa
            ) !== "complete");
        }

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case "last_updated_desc":
                    return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime();
                case "last_updated_asc":
                    return new Date(a.last_updated).getTime() - new Date(b.last_updated).getTime();
                case "title_asc":
                    return (a.title_en || a.title_fa).localeCompare(b.title_en || b.title_fa);
                case "title_desc":
                    return (b.title_en || b.title_fa).localeCompare(a.title_en || a.title_fa);
                default:
                    return 0;
            }
        });

        return result;
    }, [items, statusFilter, localeFilter, sortBy]);

    // ─── Summary Counts ────────────────────────────────────────────────────────

    const statusCounts = useMemo(() => {
        const counts: Record<TranslationStatus, number> = {
            missing: 0,
            incomplete: 0,
            complete: 0,
            outdated: 0,
        };
        for (const item of items) {
            counts[item.status_en]++;
            counts[item.status_fa]++;
        }
        return counts;
    }, [items]);

    // ─── Loading State ─────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-8 w-48 animate-pulse rounded bg-muted" />
                <div className="grid grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                    ))}
                </div>
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-14 animate-pulse rounded bg-muted" />
                    ))}
                </div>
            </div>
        );
    }

    // ─── Error State ───────────────────────────────────────────────────────────

    if (error) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-800">Error loading translation status</p>
                <p className="mt-1 text-sm text-red-600">{error}</p>
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={fetchTranslationStatus}
                >
                    Retry
                </Button>
            </div>
        );
    }

    // ─── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Translation Queue</h2>
                <Button variant="outline" size="sm" onClick={fetchTranslationStatus}>
                    Refresh
                </Button>
            </div>

            {/* Status Summary Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(Object.entries(STATUS_CONFIG) as [TranslationStatus, typeof STATUS_CONFIG[TranslationStatus]][]).map(
                    ([status, config]) => (
                        <button
                            key={status}
                            type="button"
                            onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
                            className={`rounded-lg border p-3 text-left transition-all hover:shadow-sm ${statusFilter === status
                                    ? "border-primary ring-1 ring-primary"
                                    : "border-border"
                                }`}
                        >
                            <div className="text-2xl font-bold">{statusCounts[status]}</div>
                            <div className="flex items-center gap-1.5">
                                <span
                                    className={`inline-block h-2 w-2 rounded-full ${status === "missing"
                                            ? "bg-red-500"
                                            : status === "incomplete"
                                                ? "bg-yellow-500"
                                                : status === "complete"
                                                    ? "bg-green-500"
                                                    : "bg-orange-500"
                                        }`}
                                />
                                <span className="text-xs text-muted-foreground">{config.label}</span>
                            </div>
                        </button>
                    )
                )}
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-3">
                <Select
                    options={STATUS_FILTER_OPTIONS}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-40"
                    aria-label="Filter by status"
                />
                <Select
                    options={LOCALE_OPTIONS}
                    value={localeFilter}
                    onChange={(e) => setLocaleFilter(e.target.value)}
                    className="w-44"
                    aria-label="Filter by locale"
                />
                <Select
                    options={SORT_OPTIONS}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-52"
                    aria-label="Sort items"
                />
                <span className="ml-auto text-sm text-muted-foreground">
                    {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Content Table */}
            {filteredItems.length === 0 ? (
                <div className="rounded-lg border border-border p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        No items match the current filter.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Content
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Type
                                </th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                                    English
                                </th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                                    فارسی
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Last Updated
                                </th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredItems.map((item) => (
                                <tr
                                    key={item.id}
                                    className="transition-colors hover:bg-muted/30"
                                >
                                    <td className="px-4 py-3">
                                        <span className="font-medium">
                                            {item.title_en || item.title_fa || "Untitled"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="secondary" className="text-xs capitalize">
                                            {item.content_type}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <StatusBadge status={item.status_en} />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <StatusBadge status={item.status_fa} />
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {formatDate(item.last_updated)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setCompareItem(item)}
                                        >
                                            Compare
                                        </Button>
                                        <Link
                                            href={item.action_path}
                                            className="ml-2 text-xs font-medium text-primary underline-offset-4 hover:underline"
                                        >
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Side-by-Side Compare Modal */}
            {compareItem && (
                <SideBySideCompare
                    item={compareItem}
                    onClose={() => setCompareItem(null)}
                />
            )}
        </div>
    );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return dateStr;
    }
}
