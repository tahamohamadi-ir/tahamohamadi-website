/**
 * Generic admin API fetch wrapper.
 * Sends credentials (cookies) and CSRF token with every request.
 * Uses the same base URL logic as admin-api.ts.
 */

function getBaseUrl(): string {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

function getCsrfToken(): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : null;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

/**
 * Fetch wrapper for admin API endpoints.
 * Automatically includes credentials and CSRF token.
 */
export async function adminFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const baseUrl = getBaseUrl();
    const csrfToken = getCsrfToken();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
        ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(`${baseUrl}${path}`, {
        credentials: "include",
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        throw new Error(
            `API error ${response.status}: ${errorBody || response.statusText}`
        );
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return undefined as unknown as T;
    }

    return response.json();
}
