"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Grid3X3,
    List,
    Search,
    Upload,
    Archive,
    RotateCcw,
    FileImage,
    FileText,
    Film,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MediaAsset {
    id: string;
    file: string | null;
    original_filename: string;
    mime_type: string;
    file_size: number;
    width: number | null;
    height: number | null;
    alt_text_fa: string;
    alt_text_en: string;
    caption_fa: string;
    caption_en: string;
    status: string;
    checksum: string;
    created_at: string;
    updated_at: string;
}

interface UsageRecord {
    type: string;
    id: string;
    title: string;
}

interface PaginatedResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: MediaAsset[];
}

type ViewMode = "grid" | "list";
type SortField = "created_at" | "original_filename" | "file_size";
type SortDir = "asc" | "desc";

// ---------------------------------------------------------------------------
// API Helpers
// ---------------------------------------------------------------------------

function getApiBaseUrl(): string {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

async function fetchMedia(params: {
    search?: string;
    mime_type?: string;
    status?: string;
    ordering?: string;
    page?: number;
}): Promise<PaginatedResponse> {
    const baseUrl = getApiBaseUrl();
    const url = new URL(`${baseUrl}/api/admin/media/`);
    if (params.search) url.searchParams.set("search", params.search);
    if (params.mime_type) url.searchParams.set("mime_type", params.mime_type);
    if (params.status) url.searchParams.set("status", params.status);
    if (params.ordering) url.searchParams.set("ordering", params.ordering);
    if (params.page && params.page > 1) url.searchParams.set("page", String(params.page));

    const res = await fetch(url.toString(), {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`Failed to fetch media: ${res.status}`);
    return res.json();
}

async function fetchMediaUsage(id: string): Promise<UsageRecord[]> {
    const baseUrl = getApiBaseUrl();
    try {
        const res = await fetch(`${baseUrl}/api/admin/media/${id}/usage/`, {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });
        if (res.ok) return res.json();
        return [];
    } catch {
        return [];
    }
}

async function updateMediaMetadata(
    id: string,
    data: { alt_text_fa: string; alt_text_en: string; caption_fa: string; caption_en: string },
): Promise<MediaAsset> {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/admin/media/${id}/`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to update metadata: ${res.status}`);
    return res.json();
}

async function uploadMediaFile(file: File): Promise<MediaAsset> {
    const baseUrl = getApiBaseUrl();
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${baseUrl}/api/admin/media/upload/`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
}

async function archiveMedia(id: string): Promise<MediaAsset> {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/admin/media/${id}/archive/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`Archive failed: ${res.status}`);
    return res.json();
}

async function unarchiveMedia(id: string): Promise<MediaAsset> {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/admin/media/${id}/unarchive/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`Unarchive failed: ${res.status}`);
    return res.json();
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getMimeIcon(mime: string) {
    if (mime.startsWith("image/")) return <FileImage className="h-4 w-4" />;
    if (mime.startsWith("video/")) return <Film className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
}

function isImageMime(mime: string): boolean {
    return mime.startsWith("image/") && !mime.includes("svg");
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function MediaLibraryPage() {
    const [assets, setAssets] = useState<MediaAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrev, setHasPrev] = useState(false);

    // Filters & view state
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [mimeFilter, setMimeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [sortField, setSortField] = useState<SortField>("created_at");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    // Detail dialog
    const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [usage, setUsage] = useState<UsageRecord[]>([]);
    const [saving, setSaving] = useState(false);

    // Upload state
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Debounced search
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const loadMedia = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const ordering = sortDir === "desc" ? `-${sortField}` : sortField;
            const data = await fetchMedia({
                search: searchQuery || undefined,
                mime_type: mimeFilter || undefined,
                status: statusFilter || undefined,
                ordering,
                page: currentPage,
            });
            setAssets(data.results);
            setTotalCount(data.count);
            setHasNext(!!data.next);
            setHasPrev(!!data.previous);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load media");
        } finally {
            setLoading(false);
        }
    }, [searchQuery, mimeFilter, statusFilter, sortField, sortDir, currentPage]);

    useEffect(() => {
        loadMedia();
    }, [loadMedia]);

    function handleSearchChange(value: string) {
        setSearchQuery(value);
        setCurrentPage(1);
    }

    function handleSearchInput(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => handleSearchChange(value), 300);
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            await uploadMediaFile(file);
            await loadMedia();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    async function handleAssetClick(asset: MediaAsset) {
        setSelectedAsset(asset);
        setDetailOpen(true);
        const usageData = await fetchMediaUsage(asset.id);
        setUsage(usageData);
    }

    async function handleSaveMetadata(data: {
        alt_text_fa: string;
        alt_text_en: string;
        caption_fa: string;
        caption_en: string;
    }) {
        if (!selectedAsset) return;
        setSaving(true);
        try {
            const updated = await updateMediaMetadata(selectedAsset.id, data);
            setSelectedAsset(updated);
            setAssets((prev) =>
                prev.map((a) => (a.id === updated.id ? updated : a)),
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Save failed");
        } finally {
            setSaving(false);
        }
    }

    async function handleArchive(asset: MediaAsset) {
        const usageData = await fetchMediaUsage(asset.id);
        if (usageData.length > 0) {
            const confirmed = window.confirm(
                `This asset is used in ${usageData.length} place(s). Are you sure you want to archive it?`,
            );
            if (!confirmed) return;
        }
        try {
            const updated = await archiveMedia(asset.id);
            setAssets((prev) =>
                prev.map((a) => (a.id === updated.id ? updated : a)),
            );
            if (selectedAsset?.id === updated.id) setSelectedAsset(updated);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Archive failed");
        }
    }

    async function handleUnarchive(asset: MediaAsset) {
        try {
            const updated = await unarchiveMedia(asset.id);
            setAssets((prev) =>
                prev.map((a) => (a.id === updated.id ? updated : a)),
            );
            if (selectedAsset?.id === updated.id) setSelectedAsset(updated);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unarchive failed");
        }
    }

    const pageSize = 20;
    const totalPages = Math.ceil(totalCount / pageSize);

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Media Library</h1>
                <div className="flex items-center gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*,video/mp4,application/pdf"
                        onChange={handleUpload}
                        aria-label="Upload media file"
                    />
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        {uploading ? "Uploading..." : "Upload"}
                    </Button>
                </div>
            </div>

            {/* Toolbar: Search, Filters, Sort, View Toggle */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                        <Input
                            placeholder="Search by filename..."
                            className="pl-9"
                            defaultValue={searchQuery}
                            onChange={handleSearchInput}
                            aria-label="Search media"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* MIME Filter */}
                    <Select
                        value={mimeFilter}
                        onChange={(e) => {
                            setMimeFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-[140px]"
                        aria-label="Filter by type"
                        options={[
                            { value: "", label: "All types" },
                            { value: "image/jpeg", label: "JPEG" },
                            { value: "image/png", label: "PNG" },
                            { value: "image/webp", label: "WebP" },
                            { value: "image/gif", label: "GIF" },
                            { value: "image/svg+xml", label: "SVG" },
                            { value: "application/pdf", label: "PDF" },
                            { value: "video/mp4", label: "Video" },
                        ]}
                    />

                    {/* Status Filter */}
                    <Select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-[130px]"
                        aria-label="Filter by status"
                        options={[
                            { value: "", label: "All status" },
                            { value: "active", label: "Active" },
                            { value: "archived", label: "Archived" },
                        ]}
                    />

                    {/* Sort */}
                    <Select
                        value={`${sortField}-${sortDir}`}
                        onChange={(e) => {
                            const [field, dir] = e.target.value.split("-") as [SortField, SortDir];
                            setSortField(field);
                            setSortDir(dir);
                            setCurrentPage(1);
                        }}
                        className="w-[160px]"
                        aria-label="Sort by"
                        options={[
                            { value: "created_at-desc", label: "Newest first" },
                            { value: "created_at-asc", label: "Oldest first" },
                            { value: "original_filename-asc", label: "Name A-Z" },
                            { value: "original_filename-desc", label: "Name Z-A" },
                            { value: "file_size-desc", label: "Largest first" },
                            { value: "file_size-asc", label: "Smallest first" },
                        ]}
                    />

                    {/* View Toggle */}
                    <div className="flex rounded-md border">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 ${viewMode === "grid" ? "bg-[hsl(var(--accent))]" : ""}`}
                            aria-label="Grid view"
                            aria-pressed={viewMode === "grid"}
                        >
                            <Grid3X3 className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 ${viewMode === "list" ? "bg-[hsl(var(--accent))]" : ""}`}
                            aria-label="List view"
                            aria-pressed={viewMode === "list"}
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Loading Skeleton */}
            {loading && (
                <div className={viewMode === "grid"
                    ? "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                    : "space-y-2"
                }>
                    {Array.from({ length: 10 }).map((_, i) => (
                        viewMode === "grid" ? (
                            <div key={i} className="space-y-2">
                                <Skeleton className="aspect-square w-full rounded-lg" />
                                <Skeleton className="h-3 w-3/4" />
                            </div>
                        ) : (
                            <Skeleton key={i} className="h-16 w-full rounded-lg" />
                        )
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && assets.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <FileImage className="h-12 w-12 text-[hsl(var(--muted-foreground))]" />
                        <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
                            No media assets found. Upload your first file to get started.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Grid View */}
            {!loading && assets.length > 0 && viewMode === "grid" && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {assets.map((asset) => (
                        <button
                            key={asset.id}
                            onClick={() => handleAssetClick(asset)}
                            className="group relative overflow-hidden rounded-lg border bg-[hsl(var(--card))] text-left transition-shadow motion-reduce:transition-none hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2"
                        >
                            <div className="aspect-square bg-[hsl(var(--muted))] flex items-center justify-center overflow-hidden">
                                {asset.file && isImageMime(asset.mime_type) ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={asset.file}
                                        alt={asset.alt_text_en || asset.original_filename}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-1 text-[hsl(var(--muted-foreground))]">
                                        {getMimeIcon(asset.mime_type)}
                                        <span className="text-xs">{asset.mime_type.split("/")[1]?.toUpperCase()}</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-2">
                                <p className="truncate text-xs font-medium">
                                    {asset.original_filename}
                                </p>
                                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                    {formatFileSize(asset.file_size)}
                                </p>
                            </div>
                            {asset.status === "archived" && (
                                <Badge variant="secondary" className="absolute right-1 top-1 text-[10px]">
                                    Archived
                                </Badge>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* List View */}
            {!loading && assets.length > 0 && viewMode === "list" && (
                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-[hsl(var(--muted))]">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Preview</th>
                                <th className="px-4 py-3 text-left font-medium">Filename</th>
                                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Type</th>
                                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Size</th>
                                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Dimensions</th>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                <th className="px-4 py-3 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {assets.map((asset) => (
                                <tr key={asset.id} className="hover:bg-[hsl(var(--muted))/0.5] transition-colors">
                                    <td className="px-4 py-2">
                                        <button
                                            onClick={() => handleAssetClick(asset)}
                                            className="h-10 w-10 overflow-hidden rounded bg-[hsl(var(--muted))] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                                            aria-label={`View ${asset.original_filename}`}
                                        >
                                            {asset.file && isImageMime(asset.mime_type) ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={asset.file} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                getMimeIcon(asset.mime_type)
                                            )}
                                        </button>
                                    </td>

                                    <td className="px-4 py-2">
                                        <button
                                            onClick={() => handleAssetClick(asset)}
                                            className="truncate max-w-[200px] text-left font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                                        >
                                            {asset.original_filename}
                                        </button>
                                    </td>
                                    <td className="px-4 py-2 hidden sm:table-cell text-[hsl(var(--muted-foreground))]">
                                        {asset.mime_type.split("/")[1]?.toUpperCase()}
                                    </td>
                                    <td className="px-4 py-2 hidden md:table-cell text-[hsl(var(--muted-foreground))]">
                                        {formatFileSize(asset.file_size)}
                                    </td>
                                    <td className="px-4 py-2 hidden lg:table-cell text-[hsl(var(--muted-foreground))]">
                                        {asset.width && asset.height
                                            ? `${asset.width}×${asset.height}`
                                            : "—"}
                                    </td>
                                    <td className="px-4 py-2">
                                        <Badge variant={asset.status === "active" ? "default" : "secondary"}>
                                            {asset.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        {asset.status === "active" ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleArchive(asset)}
                                                aria-label="Archive"
                                            >
                                                <Archive className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleUnarchive(asset)}
                                                aria-label="Unarchive"
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {!loading && totalCount > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        {totalCount} asset{totalCount !== 1 ? "s" : ""} total
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!hasPrev}
                            onClick={() => setCurrentPage((p) => p - 1)}
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">
                            Page {currentPage} of {totalPages || 1}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!hasNext}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            aria-label="Next page"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Detail / Edit Dialog */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {selectedAsset && (
                        <MediaDetailPanel
                            asset={selectedAsset}
                            usage={usage}
                            saving={saving}
                            onSave={handleSaveMetadata}
                            onArchive={() => handleArchive(selectedAsset)}
                            onUnarchive={() => handleUnarchive(selectedAsset)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Detail Panel (inside Dialog)
// ---------------------------------------------------------------------------

function MediaDetailPanel({
    asset,
    usage,
    saving,
    onSave,
    onArchive,
    onUnarchive,
}: {
    asset: MediaAsset;
    usage: UsageRecord[];
    saving: boolean;
    onSave: (data: { alt_text_fa: string; alt_text_en: string; caption_fa: string; caption_en: string }) => void;
    onArchive: () => void;
    onUnarchive: () => void;
}) {
    const [altFa, setAltFa] = useState(asset.alt_text_fa);
    const [altEn, setAltEn] = useState(asset.alt_text_en);
    const [captionFa, setCaptionFa] = useState(asset.caption_fa);
    const [captionEn, setCaptionEn] = useState(asset.caption_en);

    // Sync form when asset changes
    useEffect(() => {
        setAltFa(asset.alt_text_fa);
        setAltEn(asset.alt_text_en);
        setCaptionFa(asset.caption_fa);
        setCaptionEn(asset.caption_en);
    }, [asset]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        onSave({
            alt_text_fa: altFa,
            alt_text_en: altEn,
            caption_fa: captionFa,
            caption_en: captionEn,
        });
    }

    return (
        <div className="space-y-6">
            <DialogHeader>
                <DialogTitle className="truncate">{asset.original_filename}</DialogTitle>
            </DialogHeader>

            {/* Preview */}
            <div className="flex justify-center rounded-lg bg-[hsl(var(--muted))] p-4">
                {asset.file && isImageMime(asset.mime_type) ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={asset.file}
                        alt={asset.alt_text_en || asset.original_filename}
                        className="max-h-64 rounded object-contain"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-2 py-8 text-[hsl(var(--muted-foreground))]">
                        {getMimeIcon(asset.mime_type)}
                        <span className="text-sm">{asset.mime_type}</span>
                    </div>
                )}
            </div>

            {/* File Info */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">File Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-[hsl(var(--muted-foreground))]">Type</span>
                    <span>{asset.mime_type}</span>
                    <span className="text-[hsl(var(--muted-foreground))]">Size</span>
                    <span>{formatFileSize(asset.file_size)}</span>
                    {asset.width && asset.height && (
                        <>
                            <span className="text-[hsl(var(--muted-foreground))]">Dimensions</span>
                            <span>{asset.width}×{asset.height}px</span>
                        </>
                    )}
                    <span className="text-[hsl(var(--muted-foreground))]">Status</span>
                    <span>
                        <Badge variant={asset.status === "active" ? "default" : "secondary"}>
                            {asset.status}
                        </Badge>
                    </span>
                    <span className="text-[hsl(var(--muted-foreground))]">Uploaded</span>
                    <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                </CardContent>
            </Card>

            {/* Metadata Edit Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-sm font-semibold">Metadata</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="alt-en">Alt Text (EN)</Label>
                        <Input
                            id="alt-en"
                            value={altEn}
                            onChange={(e) => setAltEn(e.target.value)}
                            placeholder="English alt text"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="alt-fa">Alt Text (FA)</Label>
                        <Input
                            id="alt-fa"
                            value={altFa}
                            onChange={(e) => setAltFa(e.target.value)}
                            placeholder="متن جایگزین فارسی"
                            dir="rtl"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="caption-en">Caption (EN)</Label>
                        <Textarea
                            id="caption-en"
                            value={captionEn}
                            onChange={(e) => setCaptionEn(e.target.value)}
                            placeholder="English caption"
                            rows={2}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="caption-fa">Caption (FA)</Label>
                        <Textarea
                            id="caption-fa"
                            value={captionFa}
                            onChange={(e) => setCaptionFa(e.target.value)}
                            placeholder="کپشن فارسی"
                            dir="rtl"
                            rows={2}
                        />
                    </div>
                </div>
                <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Metadata"}
                </Button>
            </form>

            {/* Usage Information */}
            <div className="space-y-2">
                <h3 className="text-sm font-semibold">Usage</h3>
                {usage.length === 0 ? (
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        This asset is not referenced anywhere.
                    </p>
                ) : (
                    <ul className="space-y-1">
                        {usage.map((u) => (
                            <li key={`${u.type}-${u.id}`} className="flex items-center gap-2 text-sm">
                                <Badge variant="outline" className="text-xs">
                                    {u.type}
                                </Badge>
                                <span>{u.title}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Archive / Unarchive Action */}
            <div className="border-t pt-4">
                {asset.status === "active" ? (
                    <Button variant="destructive" onClick={onArchive}>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive Asset
                    </Button>
                ) : (
                    <Button variant="outline" onClick={onUnarchive}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Restore Asset
                    </Button>
                )}
            </div>
        </div>
    );
}
