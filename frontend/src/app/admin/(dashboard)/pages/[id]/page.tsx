"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
    ConflictDialog,
    extractComposerValidationIssues,
    type ComposerValidationIssue,
} from "@/components/admin/composer";

const ComposerCanvas = dynamic(() => import("@/components/admin/composer").then((mod) => mod.ComposerCanvas), { ssr: false, loading: () => <Skeleton className="h-[600px] w-full" /> });
const PreviewPanel = dynamic(() => import("@/components/admin/composer").then((mod) => mod.PreviewPanel), { ssr: false, loading: () => <Skeleton className="h-[600px] w-full" /> });
import {
    clearDraftRecoveryMarker,
    consumeDraftRecoveryMarker,
    writeDraftRecoveryMarker,
} from "@/components/admin/composer/draft-recovery";
import { useAdminNavigationGuard } from "@/components/admin/admin-navigation-guard";
import { AdminApiError, adminFetch, formatAdminError } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ComposerSection } from "@/components/admin/composer/types";
import { VariantSelector } from "@/components/admin/cms/variant-selector";
import { useAutosave, useCommandStack, useDirtyGuard } from "@/hooks";
import { useAuth } from "@/components/admin/auth-context";

interface PageData {
    id: string;
    title_fa: string;
    title_en: string;
    slug_fa: string;
    slug_en: string;
    page_type: string;
    template_variant: string;
    status: string;
    version: number;
    sections: ComposerSection[];
}

type PageSavePayload = Pick<PageData, "slug_fa" | "slug_en" | "title_fa" | "title_en" | "page_type" | "template_variant" | "status"> & {
    sections: ComposerSection[];
};

function pageSavePayload(page: PageData, sections: ComposerSection[]): PageSavePayload {
    return {
        slug_fa: page.slug_fa,
        slug_en: page.slug_en,
        title_fa: page.title_fa,
        title_en: page.title_en,
        page_type: page.page_type,
        template_variant: page.template_variant,
        status: page.status,
        sections,
    };
}

export default function PageEditorPage() {
    const params = useParams();
    const router = useRouter();
    const pageId = params.id as string;
    const { hasRole } = useAuth();
    const canPublish = hasRole("Admin") || hasRole("Publisher");

    const [page, setPage] = useState<PageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [validationIssues, setValidationIssues] = useState<ComposerValidationIssue[]>([]);
    const [conflictOpen, setConflictOpen] = useState(false);
    const [conflictLoading, setConflictLoading] = useState(false);
    const [recoveryNotice, setRecoveryNotice] = useState(false);
    const [manualSaveState, setManualSaveState] = useState<"idle" | "saved" | "error" | "conflict">("idle");
    const [sections, setSections] = useState<ComposerSection[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const pageRef = useRef<PageData | null>(null);
    const versionRef = useRef(1);
    const sessionMarkerRef = useRef(`editor-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    pageRef.current = page;
    const { isDirty, markDirty, markClean, confirmNavigation } = useDirtyGuard();
    const { registerGuard, confirmNavigation: confirmDashboardNavigation } = useAdminNavigationGuard();
    const commandStack = useCommandStack<ComposerSection[]>([], {
        onUndo: (restored) => {
            setSections(restored);
            markDirty();
        },
        onRedo: (restored) => {
            setSections(restored);
            markDirty();
        },
    });
    const { canUndo, canRedo, push, undo, redo, reset } = commandStack;

    const confirmDiscard = useCallback(() => {
        const confirmed = confirmNavigation();
        const currentPage = pageRef.current;
        if (confirmed && currentPage?.id) clearDraftRecoveryMarker(currentPage.id);
        return confirmed;
    }, [confirmNavigation]);

    useEffect(() => registerGuard(confirmDiscard), [registerGuard, confirmDiscard]);

    const saveExistingPage = useCallback(async (payload: PageSavePayload): Promise<PageData | undefined> => {
        const currentPage = pageRef.current;
        if (!currentPage || pageId === "new") return;
        const updated = await adminFetch<PageData>(`/api/admin/pages/${currentPage.id}/`, {
            method: "PUT",
            body: JSON.stringify({ ...payload, version: versionRef.current }),
        });
        versionRef.current = updated.version;
        setPage((current) => current ? { ...current, version: updated.version } : current);
        return updated;
    }, [pageId]);

    const applySaveFailure = useCallback((error: unknown) => {
        if (error instanceof AdminApiError && error.status === 409) {
            setConflictOpen(true);
            setManualSaveState("conflict");
            setSaveError(null);
            return;
        }
        const issues = extractComposerValidationIssues(error);
        const fieldCount = issues.reduce((count, issue) => count + Object.keys(issue.fields).length, 0);
        setValidationIssues(issues);
        setManualSaveState("error");
        setSaveError(fieldCount > 0
            ? `Review ${fieldCount} highlighted Composer field${fieldCount === 1 ? "" : "s"}.`
            : formatAdminError(error, "ذخیره صفحه"));
    }, []);

    const autosaveData = useMemo<PageSavePayload | null>(() => (
        page ? pageSavePayload(page, sections) : null
    ), [
        page?.id,
        page?.slug_fa,
        page?.slug_en,
        page?.title_fa,
        page?.title_en,
        page?.page_type,
        page?.template_variant,
        page?.status,
        sections,
    ]);

    const { autosaveStatus, save: saveNow } = useAutosave({
        data: autosaveData,
        status: page?.status === "draft" && pageId !== "new" && isDirty ? "draft" : "idle",
        debounceMs: 750,
        onSave: async (payload) => {
            if (payload) await saveExistingPage(payload);
        },
        onSuccess: () => {
            reset();
            markClean();
            setManualSaveState("saved");
            clearDraftRecoveryMarker(pageId);
        },
        onError: applySaveFailure,
    });

    useEffect(() => {
        if (pageId === "new") {
            setPage({
                id: "",
                title_fa: "",
                title_en: "",
                slug_fa: "",
                slug_en: "",
                page_type: "standard",
                template_variant: "default",
                status: "draft",
                version: 1,
                sections: [],
            });
            setSections([]);
            versionRef.current = 1;
            reset();
            markClean();
            setLoading(false);
            return;
        }
        async function fetchPage() {
            try {
                const data = await adminFetch<PageData>(
                    `/api/admin/pages/${pageId}/`
                );
                setPage(data);
                setSections(data.sections || []);
                versionRef.current = data.version;
                push(data.sections || []);
                reset();
                markClean();
                if (data.status === "draft" && consumeDraftRecoveryMarker(data.id)) {
                    setRecoveryNotice(true);
                }
            } catch (err) {
                setLoadError(formatAdminError(err, "بارگذاری صفحه"));
            } finally {
                setLoading(false);
            }
        }
        fetchPage();
    }, [pageId, push, reset, markClean]);

    useEffect(() => {
        if (!page || pageId === "new" || page.status !== "draft") return;
        if (isDirty) {
            writeDraftRecoveryMarker({
                pageId: page.id,
                version: versionRef.current,
                session: sessionMarkerRef.current,
            });
        } else {
            clearDraftRecoveryMarker(page.id);
        }
    }, [isDirty, page, pageId]);

    const handleSave = useCallback(async () => {
        if (!page) return;
        setSaving(true);
        setSaveError(null);
        setValidationIssues([]);
        try {
            const payload = pageSavePayload(page, sections);
            if (pageId === "new") {
                const created = await adminFetch<PageData>("/api/admin/pages/", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
                router.push(`/admin/pages/${created.id}`);
                return;
            }
            const saved = await saveNow();
            if (!saved) return;
            reset();
            markClean();
            clearDraftRecoveryMarker(page.id);
            setManualSaveState("saved");
        } catch (err) {
            applySaveFailure(err);
        } finally {
            setSaving(false);
        }
    }, [page, pageId, router, sections, saveNow, reset, markClean, applySaveFailure]);

    const updatePageField = useCallback(
        (field: keyof Pick<PageData, "title_fa" | "title_en" | "slug_fa" | "slug_en" | "page_type" | "status" | "template_variant">, value: string) => {
            setPage((current) => current ? { ...current, [field]: value } : current);
            setValidationIssues([]);
            setManualSaveState("idle");
            markDirty();
        },
        [markDirty],
    );

    const handleSectionsChange = useCallback((next: ComposerSection[]) => {
        const snapshot = structuredClone(next);
        setSections(snapshot);
        setValidationIssues([]);
        setManualSaveState("idle");
        push(snapshot);
        markDirty();
    }, [push, markDirty]);

    const handleBack = useCallback(() => {
        if (confirmDashboardNavigation()) router.push("/admin/pages");
    }, [confirmDashboardNavigation, router]);

    const handleTemplateImported = useCallback((createdPageId: string) => {
        if (confirmDashboardNavigation()) router.push(`/admin/pages/${createdPageId}`);
    }, [confirmDashboardNavigation, router]);

    const handleConflictReload = useCallback(async () => {
        if (pageId === "new") return;
        setConflictLoading(true);
        try {
            const remote = await adminFetch<PageData>(`/api/admin/pages/${pageId}/`);
            setPage(remote);
            setSections(remote.sections || []);
            versionRef.current = remote.version;
            push(remote.sections || []);
            reset();
            markClean();
            clearDraftRecoveryMarker(pageId);
            setValidationIssues([]);
            setSaveError(null);
            setManualSaveState("saved");
            setConflictOpen(false);
        } catch (error) {
            setSaveError(formatAdminError(error, "بارگذاری نسخه سرور"));
            setManualSaveState("error");
        } finally {
            setConflictLoading(false);
        }
    }, [markClean, pageId, push, reset]);

    const editorStatus = conflictOpen || manualSaveState === "conflict"
        ? "conflict"
        : saving || autosaveStatus === "saving"
            ? "saving"
            : manualSaveState === "error" || autosaveStatus === "error"
                ? "error"
                : isDirty
                    ? "pending"
                    : "saved";
    const editorStatusLabel = {
        pending: "Pending changes",
        saving: "Saving changes",
        saved: "Changes saved",
        error: "Save failed",
        conflict: "Save conflict",
    }[editorStatus];

    const canSave = Boolean(
        page?.title_fa.trim()
        && page.title_en.trim()
        && page.slug_fa.trim()
        && page.slug_en.trim(),
    );

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-[600px] w-full" />
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-red-800">{loadError}</p>
                <Button className="mt-2" onClick={handleBack}>
                    بازگشت به لیست صفحات
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <ConflictDialog
                open={conflictOpen}
                onOpenChange={(open) => { if (!conflictLoading) setConflictOpen(open); }}
                onReload={() => { void handleConflictReload(); }}
                onKeepLocal={() => {
                    setConflictOpen(false);
                    setManualSaveState("idle");
                }}
                isLoading={conflictLoading}
            />
            <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                {editorStatusLabel}
            </p>
            {recoveryNotice && (
                <div
                    className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
                    role="status"
                    aria-label="Draft recovery notice"
                >
                    Server Draft restored; unsaved local work was discarded after reload. Only the page/version/session recovery marker was stored.
                </div>
            )}
            {saveError && (
                <div
                    className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
                    role="alert"
                >
                    <p>{saveError}</p>
                    <button
                        type="button"
                        className="shrink-0 font-semibold underline underline-offset-4"
                        onClick={() => setSaveError(null)}
                    >
                        بستن
                    </button>
                </div>
            )}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {pageId === "new"
                            ? "ایجاد صفحه جدید"
                            : `ویرایش: ${page?.title_fa || page?.title_en || ""}`}
                    </h1>
                    {page && pageId !== "new" && (
                        <p className="text-sm text-gray-500 mt-1">
                            نوع: {page.page_type} | وضعیت: {page.status} | نسخه: {page.version}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" aria-label="Undo composition change" onClick={undo} disabled={!canUndo}>
                        Undo
                    </Button>
                    <Button variant="outline" aria-label="Redo composition change" onClick={redo} disabled={!canRedo}>
                        Redo
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowPreview(!showPreview)}
                        title="Toggle Live Preview"
                    >
                        {showPreview ? <><EyeOff className="h-4 w-4 mr-2" /> پنهان کردن پیش‌نمایش</> : <><Eye className="h-4 w-4 mr-2" /> نمایش پیش‌نمایش زنده</>}
                    </Button>
                    <Button variant="outline" onClick={handleBack}>
                        بازگشت
                    </Button>
                    {page && (
                        <Button onClick={handleSave} disabled={saving || autosaveStatus === "saving" || !canSave}>
                            {saving ? "در حال ذخیره..." : pageId === "new" ? "ایجاد صفحه" : "ذخیره"}
                        </Button>
                    )}
                </div>
            </div>

            {page && (
                <section className="rounded-lg border bg-white p-4" aria-label="مشخصات و مسیر صفحه">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="page-title-fa">عنوان فارسی</Label>
                            <Input id="page-title-fa" dir="rtl" value={page.title_fa} onChange={(event) => updatePageField("title_fa", event.target.value)} required />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="page-title-en">عنوان انگلیسی</Label>
                            <Input id="page-title-en" dir="ltr" value={page.title_en} onChange={(event) => updatePageField("title_en", event.target.value)} required />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="page-type">نوع صفحه</Label>
                            <select id="page-type" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={page.page_type} onChange={(event) => updatePageField("page_type", event.target.value)}>
                                <option value="custom">صفحه عادی</option>
                                <option value="home">صفحه اصلی</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="page-slug-fa">مسیر فارسی</Label>
                            <div className="flex items-center gap-2" dir="ltr"><span className="text-sm text-gray-500">/fa/</span><Input id="page-slug-fa" value={page.slug_fa} onChange={(event) => updatePageField("slug_fa", event.target.value)} required /></div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="page-slug-en">مسیر انگلیسی</Label>
                            <div className="flex items-center gap-2" dir="ltr"><span className="text-sm text-gray-500">/en/</span><Input id="page-slug-en" value={page.slug_en} onChange={(event) => updatePageField("slug_en", event.target.value)} required /></div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="page-status">وضعیت انتشار</Label>
                            <select id="page-status" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={page.status} onChange={(event) => updatePageField("status", event.target.value)}>
                                <option value="draft">پیش‌نویس</option>
                                <option value="published" disabled={!canPublish}>منتشرشده</option>
                                <option value="archived" disabled={!canPublish}>آرشیو</option>
                            </select>
                        </div>
                        <VariantSelector 
                            value={page.template_variant || "default"} 
                            onChange={(value) => updatePageField("template_variant", value)} 
                        />
                    </div>
                </section>
            )}

            <div className={`grid gap-4 ${showPreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
                <div className="rounded-lg border bg-white p-4 h-[calc(100vh-360px)] min-h-[560px] overflow-hidden flex flex-col">
                    <ComposerCanvas
                        initialSections={sections}
                        onChange={handleSectionsChange}
                        validationIssues={validationIssues}
                        templatePageIdentity={{
                            slug_fa: page?.slug_fa ?? "",
                            slug_en: page?.slug_en ?? "",
                            title_fa: page?.title_fa ?? "",
                            title_en: page?.title_en ?? "",
                            page_type: page?.page_type ?? "custom",
                        }}
                        onTemplateImported={handleTemplateImported}
                    />
                </div>
                {showPreview && (
                    <div className="h-[calc(100vh-360px)] min-h-[560px] overflow-hidden">
                        <PreviewPanel sections={sections} />
                    </div>
                )}
            </div>
        </div>
    );
}
