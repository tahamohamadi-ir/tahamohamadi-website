"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import {
    checkAdminSession,
    adminLogin,
    adminLogout,
    type AdminUser,
    type LoginCredentials,
} from "@/lib/admin-api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthState {
    user: AdminUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export interface AuthContextValue extends AuthState {
    login: (
        credentials: LoginCredentials
    ) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    refreshSession: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface AuthProviderProps {
    children: ReactNode;
}

/**
 * AuthProvider manages admin session state.
 * On mount it checks the Django backend session via /api/admin/auth/session/.
 * Provides login, logout, and refreshSession actions to all children.
 */
export function AuthProvider({ children }: AuthProviderProps) {
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
    });

    const refreshSession = useCallback(async () => {
        setState((prev) => ({ ...prev, isLoading: true }));
        try {
            const result = await checkAdminSession();
            setState({
                user: result.user || null,
                isAuthenticated: result.authenticated,
                isLoading: false,
            });
        } catch {
            setState({ user: null, isAuthenticated: false, isLoading: false });
        }
    }, []);

    // Check session on mount
    useEffect(() => {
        refreshSession();
    }, [refreshSession]);

    const login = useCallback(
        async (credentials: LoginCredentials) => {
            const result = await adminLogin(credentials);
            if (result.success && result.user) {
                setState({
                    user: result.user,
                    isAuthenticated: true,
                    isLoading: false,
                });
                return { success: true };
            }
            return { success: false, error: result.error };
        },
        []
    );

    const logout = useCallback(async () => {
        await adminLogout();
        setState({ user: null, isAuthenticated: false, isLoading: false });
    }, []);

    return (
        <AuthContext.Provider
            value={{
                ...state,
                login,
                logout,
                refreshSession,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook to access admin authentication state and actions.
 * Must be used within an AuthProvider.
 */
export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
