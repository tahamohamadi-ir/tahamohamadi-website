"use client";

import * as React from "react";
import { useState, useCallback, useEffect, useRef } from "react";
import {
    Search,
    Upload,
    X,
    Image as ImageIcon,
    FileVideo,
    File,
    RefreshCw,
    AlertCircle,
    Check,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
    MediaAssetDTO,
    PaginatedMediaResponse,
    MediaMimeFilter,
} from "@/lib/types/media";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MediaPickerProps {
    /** Restrict selectable MIME types */
    allowedTypes?: MediaMimeFilter[];
    /** Callback when asset is selected */
    onSelect?: (asset: MediaAssetDTO) => void;
    /** Callback when selection is cleared */
    onClear?: () => void;
    /** Currently selected asset */
    value?: MediaAssetDTO | null;
    /** Locale for alt text display */
    locale?: "fa" | "en";
    /** Additional class names */
    className?: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getAdminApiBaseUrl(): string {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

function getCsrfToken(): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : null;
}

function isImageMime(mime: string): boolean {
    return mime.startsWith("image/");
}

function isVideoMime(mime: string): boolean {
    return mime.startsWith("video/");
}

function getMimeIcon(mime: string) {
    if (isImageMime(mime)) return <ImageIcon className="h-5 w-5" />;
    if (isVideoMime(mime)) return <FileVideo className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const FILTER_OPTIONS: { value: MediaMimeFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "image", label: "Images" },
    { value: "video", label: "Videos" },
    { value: "document", label: "Documents" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MediaPicker({
    allowedTypes,
    onSelect,
    onClear,
    value = null,
    locale = "en",
    className,
}: MediaPickerProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [assets, setAssets] = useState<MediaAssetDTO[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<MediaMimeFilter>("all");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Upload state
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const pageSize = 12;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Determine effective filter options based on allowedTypes prop
    const effectiveFilters = allowedTypes
        ? FILTER_OPTIONS.filter(
            (f) => f.value === "all" || allowedTypes.includes(f.value)
        )
        : FILTER_OPTIONS;

    // -------------------------------------------------------------------------
    // Fetch media assets
    // -------------------------------------------------------------------------

    const fetchMedia = useCallback(async () => {
        setLoading(true);
        setError(null);
        const baseUrl = getAdminApiBaseUrl();

        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("page_size", String(pageSize));
        if (search.trim()) params.set("search", search.trim());
        if (filter !== "all") params.set("mime_type_category", filter);

        try {
            const response = await fetch(
                `${baseUrl}/api/admin/media/?${params.toString()}`,
                {
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch media: ${response.status}`);
            }

            const data: PaginatedMediaResponse = await response.json();
            setAssets(data.results);
            setTotalCount(data.count);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load media");
        } finally {
            setLoading(false);
        }
    }, [page, search, filter]);

    // Fetch when dialog opens or search/filter/page changes
    useEffect(() => {
        if (dialogOpen) {
            fetchMedia();
        }
    }, [dialogOpen, fetchMedia]);

    // Reset page when search or filter changes
    useEffect(() => {
        setPage(1);
    }, [search, filter]);

    // -------------------------------------------------------------------------
    // Upload handler
    // -------------------------------------------------------------------------

    const handleUpload = useCallback(
        async (file: globalThis.File) => {
            setUploading(true);
            setUploadProgress(0);
            setUploadError(null);

            const baseUrl = getAdminApiBaseUrl();
            const csrfToken = getCsrfToken();

            const formData = new FormData();
            formData.append("file", file);

            try {
                const xhr = new XMLHttpRequest();

                await new Promise<void>((resolve, reject) => {
                    xhr.upload.addEventListener("progress", (e) => {
                        if (e.lengthComputable) {
                            setUploadProgress(Math.round((e.loaded / e.total) * 100));
                        }
                    });

                    xhr.addEventListener("load", () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            resolve();
                        } else {
                            let msg = "Upload failed";
                            try {
                                const errData = JSON.parse(xhr.responseText);
                                msg =
                                    errData.detail ||
                                    errData.file?.[0] ||
                                    errData.message ||
                                    msg;
                            } catch {
                                // ignore parse error
                            }
                            reject(new Error(msg));
                        }
                    });

                    xhr.addEventListener("error", () => reject(new Error("Network error")));
                    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

                    xhr.open("POST", `${baseUrl}/api/admin/media/upload/`);
                    xhr.withCredentials = true;
                    if (csrfToken) xhr.setRequestHeader("X-CSRFToken", csrfToken);
                    xhr.send(formData);
                });

                // Refresh asset list after successful upload
                await fetchMedia();
            } catch (err) {
                setUploadError(
                    err instanceof Error ? err.message : "Upload failed"
                );
            } finally {
                setUploading(false);
                setUploadProgress(0);
            }
        },
        [fetchMedia]
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleUpload(file);
        }
        // Reset input so same file can be re-selected
        e.target.value = "";
    };

    // -------------------------------------------------------------------------
    // Selection handlers
    // -------------------------------------------------------------------------

    const handleSelect = (asset: MediaAssetDTO) => {
        onSelect?.(asset);
        setDialogOpen(false);
    };

    const handleClear = () => {
        onClear?.();
    };

    const handleReplace = () => {
        setDialogOpen(true);
    };

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    const altText = value
        ? locale === "fa"
            ? value.alt_fa
            : value.alt_en
        : "";

    return (
        <div className={cn("space-y-2", className)}>
            {/* Preview / Selection area */}
            {value ? (
                <div className="relative rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-start gap-3">
                        {/* Thumbnail */}
                        {isImageMime(value.mime_type) ? (
                            <img
                                src={value.file_url}
                                alt={altText || value.filename}
                                className="h-16 w-16 rounded-md object-cover border border-border"
                            />
                        ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-md border border-border bg-muted">
                                {getMimeIcon(value.mime_type)}
                            </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{value.filename}</p>
                            <p className="text-xs text-muted-foreground">
                                {formatFileSize(value.size)}
                                {value.width && value.height
                                    ? ` · ${value.width}×${value.height}`
                                    : ""}
                            </p>
                            {altText && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    {altText}
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={handleReplace}
                                aria-label="Replace media"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={handleClear}
                                aria-label="Clear selection"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start gap-2 text-muted-foreground"
                    onClick={() => setDialogOpen(true)}
                >
                    <ImageIcon className="h-4 w-4" />
                    Choose media...
                </Button>
            )}

            {/* Dialog (modal media browser) */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Media Library</DialogTitle>
                        <DialogDescription>
                            Browse, search, or upload media assets
                        </DialogDescription>
                    </DialogHeader>

                    {/* Toolbar: Search + Filter + Upload */}
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by filename or alt text..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as MediaMimeFilter)}
                            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            aria-label="Filter by type"
                        >
                            {effectiveFilters.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                        >
                            <Upload className="h-4 w-4" />
                            Upload
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            accept={
                                allowedTypes?.includes("image")
                                    ? "image/*"
                                    : allowedTypes?.includes("video")
                                        ? "video/*"
                                        : undefined
                            }
                        />
                    </div>

                    {/* Upload progress indicator */}
                    {uploading && (
                        <div className="space-y-1">
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-200"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Uploading... {uploadProgress}%
                            </p>
                        </div>
                    )}

                    {/* Upload error */}
                    {uploadError && (
                        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{uploadError}</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="ml-auto h-6 px-2 text-xs"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Retry
                            </Button>
                        </div>
                    )}

                    {/* Grid content */}
                    <div className="flex-1 overflow-y-auto min-h-0">
                        {loading ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-1">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="aspect-square rounded-md bg-muted animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                                <p className="text-sm text-destructive">{error}</p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="mt-3"
                                    onClick={fetchMedia}
                                >
                                    Retry
                                </Button>
                            </div>
                        ) : assets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    No media found
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-1">
                                {assets.map((asset) => {
                                    const isSelected = value?.id === asset.id;
                                    return (
                                        <button
                                            key={asset.id}
                                            type="button"
                                            onClick={() => handleSelect(asset)}
                                            className={cn(
                                                "group relative aspect-square rounded-md border overflow-hidden transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                                isSelected
                                                    ? "border-primary ring-2 ring-primary/30"
                                                    : "border-border hover:border-primary/50"
                                            )}
                                            aria-label={`Select ${asset.filename}`}
                                        >
                                            {isImageMime(asset.mime_type) ? (
                                                <img
                                                    src={asset.file_url}
                                                    alt={
                                                        locale === "fa"
                                                            ? asset.alt_fa || asset.filename
                                                            : asset.alt_en || asset.filename
                                                    }
                                                    className="h-full w-full object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-muted p-2">
                                                    {getMimeIcon(asset.mime_type)}
                                                    <span className="text-[10px] text-muted-foreground text-center leading-tight truncate w-full px-1">
                                                        {asset.filename}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Hover overlay */}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

                                            {/* Selected check */}
                                            {isSelected && (
                                                <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                                    <Check className="h-3 w-3 text-primary-foreground" />
                                                </div>
                                            )}

                                            {/* File size badge */}
                                            <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                {formatFileSize(asset.size)}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t pt-3">
                            <p className="text-xs text-muted-foreground">
                                {totalCount} asset{totalCount !== 1 ? "s" : ""}
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => p - 1)}
                                >
                                    Previous
                                </Button>
                                <span className="px-2 text-xs text-muted-foreground">
                                    {page} / {totalPages}
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
