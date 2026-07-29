import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkflowPanel } from "./WorkflowPanel";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("WorkflowPanel", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders current status badge", () => {
        render(
            <WorkflowPanel
                contentType="cms.page"
                objectId="123"
                currentStatus="draft"
            />,
        );
        expect(screen.getByText("Draft")).toBeInTheDocument();
    });

    it("shows allowed transitions for draft status", () => {
        render(
            <WorkflowPanel
                contentType="cms.page"
                objectId="123"
                currentStatus="draft"
            />,
        );
        expect(screen.getByText("→ In Review")).toBeInTheDocument();
        expect(screen.getByText("→ Published")).toBeInTheDocument();
        expect(screen.queryByText("→ Archived")).not.toBeInTheDocument();
    });

    it("shows allowed transitions for published status", () => {
        render(
            <WorkflowPanel
                contentType="cms.page"
                objectId="123"
                currentStatus="published"
            />,
        );
        expect(screen.getByText("→ Draft")).toBeInTheDocument();
        expect(screen.getByText("→ Archived")).toBeInTheDocument();
        expect(screen.queryByText("→ In Review")).not.toBeInTheDocument();
    });

    it("shows allowed transitions for archived status", () => {
        render(
            <WorkflowPanel
                contentType="cms.page"
                objectId="123"
                currentStatus="archived"
            />,
        );
        expect(screen.getByText("→ Draft")).toBeInTheDocument();
        expect(screen.queryByText("→ Published")).not.toBeInTheDocument();
    });

    it("calls transition API on button click", async () => {
        const onStatusChange = vi.fn();
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: "in_review",
                object_id: "123",
                content_type: "cms.page",
            }),
        });

        render(
            <WorkflowPanel
                contentType="cms.page"
                objectId="123"
                currentStatus="draft"
                onStatusChange={onStatusChange}
            />,
        );

        fireEvent.click(screen.getByText("→ In Review"));

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                "/api/admin/workflow/transition/",
                expect.objectContaining({
                    method: "POST",
                    credentials: "include",
                }),
            );
        });

        await waitFor(() => {
            expect(onStatusChange).toHaveBeenCalledWith("in_review");
        });
    });

    it("shows error on transition failure", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ detail: "Invalid transition" }),
        });

        render(
            <WorkflowPanel
                contentType="cms.page"
                objectId="123"
                currentStatus="draft"
            />,
        );

        fireEvent.click(screen.getByText("→ In Review"));

        await waitFor(() => {
            expect(screen.getByText("Invalid transition")).toBeInTheDocument();
        });
    });

    it("renders tab navigation", () => {
        render(
            <WorkflowPanel
                contentType="cms.page"
                objectId="123"
                currentStatus="draft"
            />,
        );
        expect(screen.getByText("Status")).toBeInTheDocument();
        expect(screen.getByText("Revisions")).toBeInTheDocument();
        expect(screen.getByText("Schedule")).toBeInTheDocument();
        expect(screen.getByText("Compare")).toBeInTheDocument();
    });

    it("switches to revisions tab and loads data", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                results: [
                    {
                        id: "rev-1",
                        content_type_label: "cms | page",
                        object_id: "123",
                        snapshot: {},
                        label: "Published v1",
                        created_at: "2024-01-15T10:00:00Z",
                        created_by: "admin",
                    },
                ],
            }),
        });

        render(
            <WorkflowPanel
                contentType="cms.page"
                objectId="123"
                currentStatus="published"
            />,
        );

        fireEvent.click(screen.getByText("Revisions"));

        await waitFor(() => {
            expect(screen.getByText("Published v1")).toBeInTheDocument();
        });
    });

    it("switches to schedule tab and shows datetime picker", () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ results: [] }),
        });

        render(
            <WorkflowPanel
                contentType="cms.page"
                objectId="123"
                currentStatus="in_review"
            />,
        );

        fireEvent.click(screen.getByText("Schedule"));

        expect(screen.getByLabelText("Publish at")).toBeInTheDocument();
        expect(screen.getByLabelText("Timezone")).toBeInTheDocument();
        expect(screen.getByText("Schedule Publish")).toBeInTheDocument();
    });
});
