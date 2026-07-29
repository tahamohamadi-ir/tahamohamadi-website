/**
 * TypeScript interfaces for Blog article list DTOs.
 * Used by the blog listing page and article detail page.
 */

export interface TopicDTO {
    id: string;
    slug: string;
    name_fa: string;
    name_en: string;
}

export interface ArticleListItemDTO {
    id: string;
    slug_fa: string;
    slug_en: string;
    title_fa: string;
    title_en: string;
    excerpt_fa: string;
    excerpt_en: string;
    featured_image: {
        id: string;
        file_url: string;
        alt_text_fa: string;
        alt_text_en: string;
    } | null;
    topics: TopicDTO[];
    published_at: string | null;
    reading_time_fa: number;
    reading_time_en: number;
    status: string;
}

export interface PaginatedArticlesResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: ArticleListItemDTO[];
}

export interface BlogPageData {
    articles: PaginatedArticlesResponse;
    topics: TopicDTO[];
    featuredArticle: ArticleListItemDTO | null;
}
