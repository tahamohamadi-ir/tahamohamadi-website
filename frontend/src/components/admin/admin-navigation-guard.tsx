"use client";

import {
    createContext,
    useCallback,
    useContext,
    useRef,
    type ReactNode,
} from "react";

type NavigationGuard = () => boolean;

interface AdminNavigationGuardValue {
    registerGuard: (guard: NavigationGuard) => () => void;
    confirmNavigation: () => boolean;
}

const allowNavigation = () => true;
const defaultValue: AdminNavigationGuardValue = {
    registerGuard: () => () => undefined,
    confirmNavigation: allowNavigation,
};

const AdminNavigationGuardContext = createContext<AdminNavigationGuardValue>(defaultValue);

export function AdminNavigationGuardProvider({ children }: { children: ReactNode }) {
    const guardRef = useRef<NavigationGuard>(allowNavigation);

    const registerGuard = useCallback((guard: NavigationGuard) => {
        guardRef.current = guard;
        return () => {
            if (guardRef.current === guard) guardRef.current = allowNavigation;
        };
    }, []);

    const confirmNavigation = useCallback(() => guardRef.current(), []);

    return (
        <AdminNavigationGuardContext.Provider value={{ registerGuard, confirmNavigation }}>
            {children}
        </AdminNavigationGuardContext.Provider>
    );
}

export function useAdminNavigationGuard(): AdminNavigationGuardValue {
    return useContext(AdminNavigationGuardContext);
}
