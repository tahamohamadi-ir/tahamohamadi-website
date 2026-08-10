import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminNavbar } from "./admin-navbar";
import {
    AdminNavigationGuardProvider,
    useAdminNavigationGuard,
} from "./admin-navigation-guard";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/pages/page-1" }));
vi.mock("./auth-context", () => ({
    useAuth: () => ({ user: { username: "editor" }, hasRole: vi.fn().mockReturnValue(true), logout: vi.fn() }),
}));

function DirtyEditorRegistration() {
    const { registerGuard } = useAdminNavigationGuard();
    React.useEffect(() => registerGuard(() => false), [registerGuard]);
    return null;
}

describe("Admin dashboard navigation guard", () => {
    it("lets the actual dashboard navigation owner intercept a dirty editor exit", () => {
        render(
            <AdminNavigationGuardProvider>
                <DirtyEditorRegistration />
                <AdminNavbar />
            </AdminNavigationGuardProvider>,
        );

        const blogLink = screen.getAllByRole("link", { name: "مقالات" })[0];
        expect(fireEvent.click(blogLink)).toBe(false);
        expect(blogLink).toHaveAttribute("href", "/admin/blog");
    });
});
