/**
 * API client for Django DRF backend communication.
 * Provides typed fetch wrappers for public and admin APIs.
 */

import type {
  CaseStudyListItem,
  PaginatedResponse,
  PortfolioListParams,
  PageDTO,
  PaginatedArticlesResponse,
  TopicDTO,
  PaginatedResearchProjectsResponse,
  PaginatedPublicationsResponse,
  ResearchProjectDTO,
  PublicationDTO,
  FetchIdentityResourceParams,
  FetchPublicationsParams,
  PaginatedResumeVariantsResponse,
  ResumeVariantDTO,
  PublicSiteConfigDTO,
  PublicSiteAggregateDTO,
} from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import type { BlockDTO } from "@/components/blocks";

/**
 * Error returned by a non-successful public API response.
 *
 * Keeping the status on the error lets callers distinguish a missing public
 * resource from an unavailable backend instead of treating both as `null`.
 */
export class PublicApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
  ) {
    super(`Public API request failed with ${status}: ${path}`);
    this.name = "PublicApiError";
  }
}

/**
 * Resolve the base URL for API calls.
 * Server-side rendering uses INTERNAL_API_URL (Docker internal network).
 * Client-side or fallback uses NEXT_PUBLIC_API_URL.
 */
function getApiBaseUrl(): string {
  if (typeof window === "undefined" && process.env.INTERNAL_API_URL) {
    return process.env.INTERNAL_API_URL;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

export async function fetchPublicAPI<T>(path: string): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new PublicApiError(response.status, path);
  }

  return response.json() as Promise<T>;
}

/**
 * Fetch the public portfolio case study list with optional filtering and pagination.
 * Endpoint: GET /api/public/portfolio/?page=N&technologies=tag&featured=true
 */
export async function fetchPortfolioList(
  params: PortfolioListParams = {},
): Promise<PaginatedResponse<CaseStudyListItem>> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", String(params.page));
  if (params.page_size) searchParams.set("page_size", String(params.page_size));
  if (params.technologies) searchParams.set("technologies", params.technologies);
  if (params.featured) searchParams.set("featured", params.featured);

  const query = searchParams.toString();
  const path = `/public/portfolio/${query ? `?${query}` : ""}`;

  return fetchPublicAPI<PaginatedResponse<CaseStudyListItem>>(path);
}

/**
 * Fetch a published page by slug with composed sections and blocks.
 * Returns null only when the page is not found or not published. Network and
 * server failures remain errors so the route can render an explicit failure
 * state instead of confusing an unavailable backend with a missing page.
 *
 * @param slug - The page slug (e.g., "home")
 * @param locale - The locale to fetch content for ("fa" | "en")
 */
export async function getPublicPage(slug: string, locale: Locale): Promise<PageDTO | null> {
  try {
    return await fetchPublicAPI<PageDTO>(`/public/pages/${slug}/?locale=${locale}`);
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

// ─── Blog API ──────────────────────────────────────────────────────────────────

export interface FetchArticlesParams {
  locale: string;
  page?: number;
  topic?: string;
  q?: string;
  pageSize?: number;
}

export interface PublicMediaAssetDTO {
  id: string;
  file: string | null;
  alt_text_fa: string;
  alt_text_en: string;
  caption_fa: string;
  caption_en: string;
  width: number | null;
  height: number | null;
}

export interface PublicArticleSummaryDTO {
  id: string;
  slug_fa: string;
  slug_en: string;
  title_fa: string;
  title_en: string;
  excerpt_fa: string;
  excerpt_en: string;
  featured_image: PublicMediaAssetDTO | null;
  topics: TopicDTO[];
  status: string;
  published_at: string | null;
  updated_at: string;
  reading_time: number;
}

export interface PublicArticleDetailDTO extends PublicArticleSummaryDTO {
  blocks: BlockDTO[];
  toc: Array<{ id: string; text: string; level: number }>;
  related: PublicArticleSummaryDTO[];
  previous: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}

/**
 * Fetch paginated articles from the public blog API.
 * Endpoint: GET /api/public/blog/articles?locale={locale}&page={n}&topic={slug}
 */
export async function fetchArticles(
  params: FetchArticlesParams,
): Promise<PaginatedArticlesResponse> {
  const { locale, page = 1, topic, q, pageSize = 9 } = params;
  const searchParams = new URLSearchParams({
    locale,
    page: String(page),
    page_size: String(pageSize),
  });

  if (topic) {
    searchParams.set("topic", topic);
  }
  if (q) {
    searchParams.set("q", q);
  }

  return fetchPublicAPI<PaginatedArticlesResponse>(
    `/public/blog/articles/?${searchParams.toString()}`,
  );
}

/**
 * Fetch all available blog topics.
 * Endpoint: GET /api/public/blog/topics/
 */
export async function fetchTopics(): Promise<TopicDTO[]> {
  return fetchPublicAPI<TopicDTO[]>("/public/blog/topics/");
}

export async function getArticle(
  slug: string,
  locale: Locale,
): Promise<PublicArticleDetailDTO | null> {
  const path = `/public/blog/articles/${encodeURIComponent(slug)}/?locale=${locale}`;
  try {
    return await fetchPublicAPI<PublicArticleDetailDTO>(path);
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function fetchResearchProjects(
  params: FetchIdentityResourceParams,
): Promise<PaginatedResearchProjectsResponse> {
  const searchParams = new URLSearchParams({
    locale: params.locale,
    page: String(params.page ?? 1),
    page_size: String(params.pageSize ?? 12),
  });
  return fetchPublicAPI<PaginatedResearchProjectsResponse>(
    `/public/identity/research-projects/?${searchParams.toString()}`,
  );
}

export async function fetchResearchProject(
  slug: string,
  locale: Locale,
): Promise<ResearchProjectDTO> {
  return fetchPublicAPI<ResearchProjectDTO>(
    `/public/identity/research-projects/${encodeURIComponent(slug)}/?locale=${locale}`,
  );
}

export async function fetchPublications(
  params: FetchPublicationsParams,
): Promise<PaginatedPublicationsResponse> {
  const searchParams = new URLSearchParams({
    locale: params.locale,
    page: String(params.page ?? 1),
    page_size: String(params.pageSize ?? 12),
  });
  if (params.type) searchParams.set("type", params.type);
  if (params.year) searchParams.set("year", params.year);
  return fetchPublicAPI<PaginatedPublicationsResponse>(
    `/public/identity/publications/?${searchParams.toString()}`,
  );
}

export async function fetchPublication(
  slug: string,
  locale: Locale,
): Promise<PublicationDTO> {
  return fetchPublicAPI<PublicationDTO>(
    `/public/identity/publications/${encodeURIComponent(slug)}/?locale=${locale}`,
  );
}

export async function fetchResumeVariants(
  params: FetchIdentityResourceParams,
): Promise<PaginatedResumeVariantsResponse> {
  const searchParams = new URLSearchParams({
    locale: params.locale,
    page: String(params.page ?? 1),
    page_size: String(params.pageSize ?? 12),
  });
  return fetchPublicAPI<PaginatedResumeVariantsResponse>(
    `/public/identity/resumes/?${searchParams.toString()}`,
  );
}

export async function fetchResumeVariant(
  slug: string,
  locale: Locale,
): Promise<ResumeVariantDTO> {
  return fetchPublicAPI<ResumeVariantDTO>(
    `/public/identity/resumes/${encodeURIComponent(slug)}/?locale=${locale}`,
  );
}

export async function fetchPublicSiteConfig(locale: Locale): Promise<PublicSiteConfigDTO> {
  return fetchPublicAPI<PublicSiteConfigDTO>(`/public/site/?locale=${locale}`);
}

/**
 * Fetch the cacheable site and identity aggregate for a single locale.
 * Consumers must not substitute data from the other locale when a localized
 * record is absent: the backend intentionally omits incomplete records.
 */
export async function fetchPublicSiteAggregate(locale: Locale): Promise<PublicSiteAggregateDTO> {
  return fetchPublicAPI<PublicSiteAggregateDTO>(`/public/site/aggregate/?locale=${locale}`);
}
