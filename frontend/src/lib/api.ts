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
} from "@/lib/types";

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
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Fetch the public portfolio case study list with optional filtering and pagination.
 * Endpoint: GET /api/public/portfolio/?page=N&technologies=tag&featured=true
 */
export async function fetchPortfolioList(
  params: PortfolioListParams = {}
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
 * Returns null if the page is not found or not published.
 *
 * @param slug - The page slug (e.g., "home")
 * @param locale - The locale to fetch content for ("fa" | "en")
 */
export async function getPublicPage(
  slug: string,
  locale: string
): Promise<PageDTO | null> {
  try {
    // Always look up by English slug (URL routing uses slug_en).
    // The locale param is passed for potential content filtering but
    // the view matches slug against slug_en by default.
    const page = await fetchPublicAPI<PageDTO>(
      `/public/pages/${slug}/?locale=en`
    );
    return page;
  } catch {
    return null;
  }
}


// ─── Blog API ──────────────────────────────────────────────────────────────────

export interface FetchArticlesParams {
  locale: string;
  page?: number;
  topic?: string;
  pageSize?: number;
}

/**
 * Fetch paginated articles from the public blog API.
 * Endpoint: GET /api/public/blog/articles?locale={locale}&page={n}&topic={slug}
 */
export async function fetchArticles(
  params: FetchArticlesParams
): Promise<PaginatedArticlesResponse> {
  const { locale, page = 1, topic, pageSize = 9 } = params;
  const searchParams = new URLSearchParams({
    locale,
    page: String(page),
    page_size: String(pageSize),
  });

  if (topic) {
    searchParams.set("topic", topic);
  }

  return fetchPublicAPI<PaginatedArticlesResponse>(
    `/public/blog/articles?${searchParams.toString()}`
  );
}

/**
 * Fetch all available blog topics.
 * Endpoint: GET /api/public/blog/topics
 */
export async function fetchTopics(): Promise<TopicDTO[]> {
  return fetchPublicAPI<TopicDTO[]>("/public/blog/topics");
}
