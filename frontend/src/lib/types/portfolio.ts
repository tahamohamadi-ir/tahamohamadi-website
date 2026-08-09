/**
 * TypeScript interfaces for portfolio list DTOs.
 * Maps to the Django PublicCaseStudyListSerializer response shape.
 *
 * Requirements: 7.5
 */

/** A single case study item in the portfolio list (metadata only, no narrative blocks). */
export interface CaseStudyListItem {
    id: string;
    slug_fa: string;
    slug_en: string;
    title_fa: string;
    title_en: string;
    role_fa: string;
    role_en: string;
    client_fa: string | null;
    client_en: string | null;
    date_start: string; // ISO date
    date_end: string | null; // ISO date or null (ongoing)
    technologies: string[];
    statement_fa: string;
    statement_en: string;
    problem_fa: string;
    problem_en: string;
    outcome_fa: string;
    outcome_en: string;
    limitations_fa: string;
    limitations_en: string;
    gallery: import("./media").MediaAssetDTO[];
    featured: boolean;
    status: string;
    published_at: string | null; // ISO datetime
}

/** Paginated response from Django DRF (DefaultPageNumberPagination). */
export interface PaginatedResponse<T> {
    count: number;
    page: number;
    page_size: number;
    total_pages: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

/** Query parameters for the portfolio list API. */
export interface PortfolioListParams {
    page?: number;
    page_size?: number;
    technologies?: string;
    featured?: string;
    role?: string;
}
