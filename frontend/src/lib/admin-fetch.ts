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

interface AdminErrorBody {
    detail?: string;
    errors?: unknown;
    title?: string;
    [key: string]: unknown;
}

export class AdminApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly body: AdminErrorBody,
    ) {
        super(body.detail || body.title || `Request failed with status ${status}`);
        this.name = "AdminApiError";
    }
}

function flattenValidationErrors(value: unknown, path: Array<string | number> = []): string[] {
    if (typeof value === "string") {
        return [`${path.join(".")}: ${value.replace(/^\(root\):\s*/, "")}`];
    }
    if (Array.isArray(value)) {
        if (value.every((item) => typeof item === "string")) {
            return value.map((item) => `${path.join(".")}: ${item.replace(/^\(root\):\s*/, "")}`);
        }
        return value.flatMap((item, index) => flattenValidationErrors(item, [...path, index]));
    }
    if (value && typeof value === "object") {
        return Object.entries(value).flatMap(([key, item]) =>
            flattenValidationErrors(item, [...path, key]),
        );
    }
    return [];
}

function humanizeComposerPath(path: string): string {
    const section = path.match(/sections\.(\d+)/)?.[1];
    const block = path.match(/blocks\.(\d+)/)?.[1];
    const faNumber = (value: string) => (Number(value) + 1).toLocaleString("fa-IR", { useGrouping: false });
    if (section !== undefined && block !== undefined) {
        return `بخش ${faNumber(section)}، بلاک ${faNumber(block)}`;
    }
    if (section !== undefined) return `بخش ${faNumber(section)}`;
    return path || "اطلاعات صفحه";
}

export function formatAdminError(error: unknown, action = "عملیات"): string {
    if (error instanceof AdminApiError) {
        if (error.status === 409) {
            return `${action} انجام نشد؛ نسخه جدیدتری از این صفحه ذخیره شده است. صفحه را تازه‌سازی کنید و دوباره تلاش کنید.`;
        }
        const details = flattenValidationErrors(error.body.errors)
            .slice(0, 3)
            .map((entry) => {
                const separator = entry.indexOf(": ");
                const path = separator >= 0 ? entry.slice(0, separator) : "";
                const message = separator >= 0 ? entry.slice(separator + 2) : entry;
                return `${humanizeComposerPath(path)}: ${message}`;
            });
        if (details.length > 0) {
            return `${action} انجام نشد. ${details.join("؛ ")}`;
        }
        return `${action} انجام نشد. ${error.message}`;
    }
    if (error instanceof Error) return `${action} انجام نشد. ${error.message}`;
    return `${action} انجام نشد. دوباره تلاش کنید.`;
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
        let parsedBody: AdminErrorBody = {};
        if (errorBody) {
            try {
                parsedBody = JSON.parse(errorBody) as AdminErrorBody;
            } catch {
                parsedBody = { detail: errorBody };
            }
        }
        if (!parsedBody.detail && response.statusText) parsedBody.detail = response.statusText;
        throw new AdminApiError(response.status, parsedBody);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return undefined as unknown as T;
    }

    return response.json();
}
