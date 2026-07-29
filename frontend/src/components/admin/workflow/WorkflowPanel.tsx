"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Types ───────────────────────────────────────────────────────────────────

export type WorkflowStatus =
    | "draft"
    | "in_review"
    | "scheduled"
    | "published"
    | "archived";

export interface Revision {
    id: string;
    content_type_label: string;
    object_id: string;
    snapshot: Record<string, unknown>;
    label: string;
    created_at: string;
    created_by: string | null;
}

export interface ScheduledPublish {
    id: string;
    object_id: string;
    scheduled_at: string;
    timezone: string;
    status: string;
    attempts: number;
    last_error: string | null;
}

export interface RevisionDiff {
    revision_a: string;
    revision_b: string;
    fields: Record<string, { a: unknown; b: unknown }>;
}

export interface WorkflowPanelProps {
    contentType: string; // e.g. "cms.page"
    objectId: string;
    currentStatus: WorkflowStatus;
    onStatusChange?: (newStatus: WorkflowStatus) => void;
    onRestore?: (newEntityId: string) => void;
}

// ─── State Machine ───────────────────────────────────────────────────────────

const ALLOWED_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
    draft: ["in_review", "published"],
    in_review: ["draft", "scheduled", "published"],
    scheduled: ["draft", "published"],
    published: ["draft", "archived"],
    archived: ["draft"],
};

const STATUS_LABELS: Record<WorkflowStatus, string> = {
    draft: "Draft",
    in_review: "In Review",
    scheduled: "Scheduled",
    published: "Published",
    archived: "Archived",
};

const STATUS_COLORS: Record<WorkflowStatus, string> = {
    draft: "bg-gray-100 text-gray-700 border-gray-200",
    in_review: "bg-yellow-50 text-yellow-800 border-yellow-200",
    scheduled: "bg-blue-50 text-blue-800 border-blue-200",
    published: "bg-green-50 text-green-800 border-green-200",
    archived: "bg-red-50 text-red-700 border-red-200",
};

const TRANSITION_BUTTON_STYLES: Record<WorkflowStatus, string> = {
    draft: "bg-gray-600 hover:bg-gray-700 text-white",
    in_review: "bg-yellow-600 hover:bg-yellow-700 text-white",
    scheduled: "bg-blue-600 hover:bg-blue-700 text-white",
    published: "bg-green-600 hover:bg-green-700 text-white",
    archived: "bg-red-600 hover:bg-red-700 text-white",
};

// ─── API helpers ─────────────────────────────────────────────────────────────

async function apiPost(url: string, body: unknown): Promise<Response> {
    return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
    });
}

async function apiGet(url: string): Promise<Response> {
    return fetch(url, {
        method: "GET",
        credentials: "include",
    });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: WorkflowStatus }) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_COLORS[status]}`}
        >
            {STATUS_LABELS[status]}
        </span>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function WorkflowPanel({
    contentType,
    objectId,
    currentStatus,
    onStatusChange,
    onRestore,
}: WorkflowPanelProps) {
    const [activeTab, setActiveTab] = useState<
        "transitions" | "revisions" | "schedule" | "compare"
    >("transitions");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Revisions state
    const [revisions, setRevisions] = useState<Revision[]>([]);
    const [revisionsLoading, setRevisionsLoading] = useState(false);

    // Schedule state
    const [scheduledAt, setScheduledAt] = useState("");
    const [scheduledTimezone, setScheduledTimezone] = useState(
        Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
    const [scheduledItems, setScheduledItems] = useState<ScheduledPublish[]>([]);

    // Compare state
    const [compareA, setCompareA] = useState<string>("");
    const [compareB, setCompareB] = useState<string>("");
    const [diff, setDiff] = useState<RevisionDiff | null>(null);
    const [compareLoading, setCompareLoading] = useState(false);

    // Transition reason
    const [reason, setReason] = useState("");

    const allowedTargets = ALLOWED_TRANSITIONS[currentStatus] ?? [];

    // ─── Load revisions ──────────────────────────────────────────────────────

    const loadRevisions = useCallback(async () => {
        setRevisionsLoading(true);
        try {
            const params = new URLSearchParams({
                content_type: contentType,
                object_id: objectId,
            });
            const res = await apiGet(
                `/api/admin/workflow/revisions/?${params.toString()}`,
            );
            if (res.ok) {
                const data = await res.json();
                setRevisions(data.results ?? data);
            }
        } catch {
            // silent fail
        } finally {
            setRevisionsLoading(false);
        }
    }, [contentType, objectId]);

    // ─── Load scheduled items ────────────────────────────────────────────────

    const loadScheduled = useCallback(async () => {
        try {
            const params = new URLSearchParams({
                content_type: contentType,
                object_id: objectId,
            });
            const res = await apiGet(
                `/api/admin/workflow/schedule/?${params.toString()}`,
            );
            if (res.ok) {
                const data = await res.json();
                setScheduledItems(data.results ?? data);
            }
        } catch {
            // silent fail
        }
    }, [contentType, objectId]);

    useEffect(() => {
        if (activeTab === "revisions" || activeTab === "compare") {
            loadRevisions();
        }
        if (activeTab === "schedule") {
            loadScheduled();
        }
    }, [activeTab, loadRevisions, loadScheduled]);

    // ─── Transition handler ──────────────────────────────────────────────────

    async function handleTransition(targetStatus: WorkflowStatus) {
        setLoading(true);
        setError(null);
        try {
            const body: Record<string, unknown> = {
                content_type: contentType,
                object_id: objectId,
                target_status: targetStatus,
                reason,
            };
            const res = await apiPost("/api/admin/workflow/transition/", body);
            if (res.ok) {
                const data = await res.json();
                onStatusChange?.(data.status as WorkflowStatus);
                setReason("");
            } else {
                const errData = await res.json();
                setError(errData.detail ?? errData.title ?? "Transition failed");
            }
        } catch {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    }

    // ─── Restore handler ─────────────────────────────────────────────────────

    async function handleRestore(revisionId: string) {
        setLoading(true);
        setError(null);
        try {
            const res = await apiPost("/api/admin/workflow/revisions/restore/", {
                revision_id: revisionId,
            });
            if (res.ok) {
                const data = await res.json();
                onRestore?.(data.id);
            } else {
                const errData = await res.json();
                setError(errData.detail ?? "Restore failed");
            }
        } catch {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    }

    // ─── Schedule handler ────────────────────────────────────────────────────

    async function handleSchedule() {
        if (!scheduledAt) return;
        setLoading(true);
        setError(null);
        try {
            const res = await apiPost("/api/admin/workflow/schedule/", {
                content_type: contentType,
                object_id: objectId,
                scheduled_at: new Date(scheduledAt).toISOString(),
            });
            if (res.ok) {
                setScheduledAt("");
                loadScheduled();
            } else {
                const errData = await res.json();
                setError(errData.detail ?? "Schedule failed");
            }
        } catch {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    }

    // ─── Cancel schedule handler ─────────────────────────────────────────────

    async function handleCancelSchedule(scheduleId: string) {
        setLoading(true);
        setError(null);
        try {
            const res = await apiPost("/api/admin/workflow/schedule/cancel/", {
                schedule_id: scheduleId,
            });
            if (res.ok) {
                loadScheduled();
            } else {
                const errData = await res.json();
                setError(errData.detail ?? "Cancel failed");
            }
        } catch {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    }

    // ─── Compare handler ─────────────────────────────────────────────────────

    async function handleCompare() {
        if (!compareA || !compareB) return;
        setCompareLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ a: compareA, b: compareB });
            const res = await apiGet(
                `/api/admin/workflow/revisions/compare/?${params.toString()}`,
            );
            if (res.ok) {
                const data = await res.json();
                setDiff(data);
            } else {
                const errData = await res.json();
                setError(errData.detail ?? "Compare failed");
            }
        } catch {
            setError("Network error");
        } finally {
            setCompareLoading(false);
        }
    }

    // ─── Render ──────────────────────────────────────────────────────────────

    const tabs = [
        { key: "transitions" as const, label: "Status" },
        { key: "revisions" as const, label: "Revisions" },
        { key: "schedule" as const, label: "Schedule" },
        { key: "compare" as const, label: "Compare" },
    ];

    return (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-900">Workflow</h3>
                <StatusBadge status={currentStatus} />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 text-xs font-medium transition-colors ${activeTab === tab.key
                                ? "border-b-2 border-blue-600 text-blue-600"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Error display */}
            {error && (
                <div className="mx-4 mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                </div>
            )}

            {/* Tab Content */}
            <div className="p-4">
                {/* ─── Transitions Tab ──────────────────────────────────────── */}
                {activeTab === "transitions" && (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="transition-reason" className="text-xs">
                                Reason (optional)
                            </Label>
                            <Input
                                id="transition-reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Reason for transition..."
                                className="mt-1 text-sm"
                            />
                        </div>

                        {allowedTargets.length === 0 ? (
                            <p className="text-xs text-gray-500">
                                No transitions available from this state.
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {allowedTargets.map((target) => (
                                    <Button
                                        key={target}
                                        type="button"
                                        size="sm"
                                        disabled={loading}
                                        onClick={() => handleTransition(target)}
                                        className={`text-xs ${TRANSITION_BUTTON_STYLES[target]}`}
                                    >
                                        {loading ? "..." : `→ ${STATUS_LABELS[target]}`}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Revisions Tab ────────────────────────────────────────── */}
                {activeTab === "revisions" && (
                    <div className="space-y-3">
                        {revisionsLoading ? (
                            <p className="text-xs text-gray-500">Loading revisions...</p>
                        ) : revisions.length === 0 ? (
                            <p className="text-xs text-gray-500">No revisions yet.</p>
                        ) : (
                            <ul className="space-y-2">
                                {revisions.map((rev) => (
                                    <li
                                        key={rev.id}
                                        className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-gray-900">
                                                {rev.label || "Unnamed revision"}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(rev.created_at).toLocaleString()}
                                                {rev.created_by && ` · ${rev.created_by}`}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={loading}
                                            onClick={() => handleRestore(rev.id)}
                                            className="ml-2 text-xs"
                                        >
                                            Restore
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* ─── Schedule Tab ─────────────────────────────────────────── */}
                {activeTab === "schedule" && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="schedule-datetime" className="text-xs">
                                Publish at
                            </Label>
                            <Input
                                id="schedule-datetime"
                                type="datetime-local"
                                value={scheduledAt}
                                onChange={(e) => setScheduledAt(e.target.value)}
                                className="text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="schedule-timezone" className="text-xs">
                                Timezone
                            </Label>
                            <Input
                                id="schedule-timezone"
                                value={scheduledTimezone}
                                onChange={(e) => setScheduledTimezone(e.target.value)}
                                className="text-sm"
                                placeholder="e.g. Asia/Tehran"
                            />
                        </div>

                        <Button
                            type="button"
                            size="sm"
                            disabled={loading || !scheduledAt}
                            onClick={handleSchedule}
                            className="w-full bg-blue-600 text-xs text-white hover:bg-blue-700"
                        >
                            {loading ? "Scheduling..." : "Schedule Publish"}
                        </Button>

                        {/* Scheduled items list */}
                        {scheduledItems.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <h4 className="text-xs font-medium text-gray-700">
                                    Scheduled Jobs
                                </h4>
                                <ul className="space-y-2">
                                    {scheduledItems.map((item) => (
                                        <li
                                            key={item.id}
                                            className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium text-gray-900">
                                                    {new Date(item.scheduled_at).toLocaleString()}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Status: {item.status}
                                                    {item.last_error && ` · Error: ${item.last_error}`}
                                                </p>
                                            </div>
                                            {item.status === "pending" && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={loading}
                                                    onClick={() => handleCancelSchedule(item.id)}
                                                    className="ml-2 text-xs text-red-600 hover:text-red-700"
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Compare Tab ──────────────────────────────────────────── */}
                {activeTab === "compare" && (
                    <div className="space-y-4">
                        {revisions.length < 2 ? (
                            <p className="text-xs text-gray-500">
                                Need at least 2 revisions to compare.
                            </p>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label htmlFor="compare-a" className="text-xs">
                                            Revision A
                                        </Label>
                                        <select
                                            id="compare-a"
                                            value={compareA}
                                            onChange={(e) => setCompareA(e.target.value)}
                                            className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs"
                                        >
                                            <option value="">Select...</option>
                                            {revisions.map((rev) => (
                                                <option key={rev.id} value={rev.id}>
                                                    {rev.label ||
                                                        new Date(rev.created_at).toLocaleDateString()}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label htmlFor="compare-b" className="text-xs">
                                            Revision B
                                        </Label>
                                        <select
                                            id="compare-b"
                                            value={compareB}
                                            onChange={(e) => setCompareB(e.target.value)}
                                            className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs"
                                        >
                                            <option value="">Select...</option>
                                            {revisions.map((rev) => (
                                                <option key={rev.id} value={rev.id}>
                                                    {rev.label ||
                                                        new Date(rev.created_at).toLocaleDateString()}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={compareLoading || !compareA || !compareB}
                                    onClick={handleCompare}
                                    className="w-full text-xs"
                                    variant="outline"
                                >
                                    {compareLoading ? "Comparing..." : "Compare Revisions"}
                                </Button>

                                {/* Diff display */}
                                {diff && (
                                    <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-md border border-gray-100 p-3">
                                        <h4 className="text-xs font-medium text-gray-700">
                                            Differences
                                        </h4>
                                        {Object.keys(diff.fields).length === 0 ? (
                                            <p className="text-xs text-gray-500">
                                                No differences found.
                                            </p>
                                        ) : (
                                            <div className="space-y-3">
                                                {Object.entries(diff.fields).map(
                                                    ([field, { a, b }]) => (
                                                        <div
                                                            key={field}
                                                            className="rounded border border-gray-100 p-2"
                                                        >
                                                            <p className="mb-1 text-xs font-semibold text-gray-700">
                                                                {field}
                                                            </p>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="rounded bg-red-50 p-2">
                                                                    <p className="mb-0.5 text-[10px] font-medium text-red-600">
                                                                        A
                                                                    </p>
                                                                    <pre className="max-h-20 overflow-auto whitespace-pre-wrap text-[11px] text-gray-700">
                                                                        {typeof a === "string"
                                                                            ? a
                                                                            : JSON.stringify(a, null, 2)}
                                                                    </pre>
                                                                </div>
                                                                <div className="rounded bg-green-50 p-2">
                                                                    <p className="mb-0.5 text-[10px] font-medium text-green-600">
                                                                        B
                                                                    </p>
                                                                    <pre className="max-h-20 overflow-auto whitespace-pre-wrap text-[11px] text-gray-700">
                                                                        {typeof b === "string"
                                                                            ? b
                                                                            : JSON.stringify(b, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
