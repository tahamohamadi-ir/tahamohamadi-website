/**
 * TypeScript interfaces for Media Library DTOs.
 * Used by the MediaPicker component and Media Library page.
 */

export interface MediaAssetDTO {
    id: string;
    file_url: string;
    filename: string;
    mime_type: string;
    size: number;
    width: number | null;
    height: number | null;
    alt_fa: string;
    alt_en: string;
    caption_fa: string;
    caption_en: string;
    created_at: string;
    updated_at: string;
}

export interface PaginatedMediaResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: MediaAssetDTO[];
}

export type MediaMimeFilter = "all" | "image" | "video" | "document";
