/**
 * Admin API client for Django backend communication.
 * Handles session-based authentication with CSRF tokens.
 */

/**
 * Resolve the base URL for admin API calls (client-side only).
 * Admin API calls always originate from the browser (CSR).
 */
function getAdminApiBaseUrl(): string {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

/**
 * Get the CSRF token from cookies.
 * Django sets a `csrftoken` cookie that we read and send as X-CSRFToken header.
 */
function getCsrfToken(): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : null;
}

export interface AdminUser {
    id: number;
    username: string;
    email: string;
    is_staff: boolean;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface AuthCheckResponse {
    authenticated: boolean;
    user?: AdminUser;
}

/**
 * Check if the current session is authenticated.
 * Calls the Django admin health/session endpoint.
 */
export async function checkAdminSession(): Promise<AuthCheckResponse> {
    const baseUrl = getAdminApiBaseUrl();
    try {
        const response = await fetch(`${baseUrl}/api/admin/health/`, {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            const data = await response.json();
            return { authenticated: true, user: data.user || data };
        }

        return { authenticated: false };
    } catch {
        return { authenticated: false };
    }
}

/**
 * Log in with username and password.
 * Uses Django session authentication with CSRF protection.
 */
export async function adminLogin(
    credentials: LoginCredentials
): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    const baseUrl = getAdminApiBaseUrl();

    const response = await fetch(`${baseUrl}/api/admin/login/`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
    });

    if (response.ok) {
        const data = await response.json();
        return { success: true, user: data.user || data };
    }

    const errorData = await response.json().catch(() => null);
    return {
        success: false,
        error:
            errorData?.detail || errorData?.message || "Invalid credentials",
    };
}

/**
 * Log out the current admin session.
 */
export async function adminLogout(): Promise<void> {
    const baseUrl = getAdminApiBaseUrl();
    const csrfToken = getCsrfToken();

    await fetch(`${baseUrl}/api/admin/logout/`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
        },
    });
}
