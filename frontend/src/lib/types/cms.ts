/**
 * TypeScript interfaces for CMS page DTOs.
 * Matches the Django public page API response at /api/public/pages/{slug}
 */

import type { BlockDTO } from "@/components/blocks/types";

export interface SectionDTO {
    id: string;
    ordering: number;
    enabled: boolean;
    layout: string;
    blocks: BlockDTO[];
}

export interface PageDTO {
    id: string;
    slug_fa: string;
    slug_en: string;
    title_fa: string;
    title_en: string;
    page_type: string;
    status: string;
    published_at: string | null;
    sections: SectionDTO[];
}
