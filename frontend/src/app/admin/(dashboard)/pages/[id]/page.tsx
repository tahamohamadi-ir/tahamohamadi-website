"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ComposerCanvas, PreviewPanel } from "@/components/admin/composer";
import { adminFetch, formatAdminError } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ComposerSection } from "@/components/admin/composer/types";
import { useAutosave, useCommandStack, useDirtyGuard } from "@/hooks";

interface PageData {
    id: string;
    title_fa: string;
    title_en: string;
    slug_fa: string;
    slug_en: string;
    page_type: string;
    status: string;
    version: number;
    sections: ComposerSection[];
}

type PageSavePayload = Pick<PageData, "slug_fa" | "slug_en" | "title_fa" | "title_en" | "page_type" | "status"> & {
    sections: ComposerSection[];
};

function pageSavePayload(page: PageData, sections: ComposerSection[]): PageSavePayload {
    return {
        slug_fa: page.slug_fa,
        slug_en: page.slug_en,
        title_fa: page.title_fa,
        title_en: page.title_en,
        page_type: page.page_type,
        status: page.status,
        sections,
    };
}

export default function PageEditorPage() {
    const params = useParams();
    const router = useRouter();
    const pageId = params.id as string;

    const [page, setPage] = useState<PageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [sections, setSections] = useState<ComposerSection[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const pageRef = useRef<PageData | null>(null);
    const versionRef = useRef(1);
    pageRef.current = page;
    const { isDirty, markDirty, markClean, confirmNavigation } = useDirtyGuard();
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

    const saveExistingPage = useCallback(async (payload: PageSavePayload) => {
        const currentPage = pageRef.current;
        if (!currentPage || pageId === "new") return;
        const updated = await adminFetch<PageData>(`/api/admin/pages/${currentPage.id}/`, {
            method: "PUT",
            body: JSON.stringify({ ...payload, version: versionRef.current }),
        });
        versionRef.current = updated.version;
        setPage((current) => current ? { ...current, version: updated.version } : current);
    }, [pageId]);

    const autosaveData = useMemo<PageSavePayload | null>(() => (
        page ? pageSavePayload(page, sections) : null
    ), [
        page?.slug_fa,
        page?.slug_en,
        page?.title_fa,
        page?.title_en,
        page?.page_type,
        page?.status,
        sections,
    ]);

    useAutosave({
        data: autosaveData,
        status: page?.status === "draft" && pageId !== "new" && isDirty ? "draft" : "idle",
        debounceMs: 750,
        onSave: async (payload) => {
            if (payload) await saveExistingPage(payload);
        },
        onSuccess: markClean,
        onError: (error) => setSaveError(formatAdminError(error, "Ø°Ø®ÛŒØ±Ù‡ ØµÙØ­Ù‡")),
    });

    useEffect(() => {
        if (pageId === "new") {
            setPage({
                id: "",
                title_fa: "",
                title_en: "",
                slug_fa: "",
                slug_en: "",
                page_type: "custom",
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
            } catch (err) {
                setLoadError(formatAdminError(err, "بارگذاری صفحه"));
            } finally {
                setLoading(false);
            }
        }
        fetchPage();
    }, [pageId, push, reset, markClean]);

    const handleSave = useCallback(async () => {
        if (!page) return;
        setSaving(true);
        setSaveError(null);
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
            await saveExistingPage(payload);
            reset();
            markClean();
        } catch (err) {
            setSaveError(formatAdminError(err, "ذخیره صفحه"));
        } finally {
            setSaving(false);
        }
    }, [page, pageId, router, sections, saveExistingPage, reset, markClean]);

    const updatePageField = useCallback(
        (field: keyof Pick<PageData, "title_fa" | "title_en" | "slug_fa" | "slug_en" | "page_type" | "status">, value: string) => {
            setPage((current) => current ? { ...current, [field]: value } : current);
            markDirty();
        },
        [markDirty],
    );

    const handleSectionsChange = useCallback((next: ComposerSection[]) => {
        const snapshot = structuredClone(next);
        setSections(snapshot);
        push(snapshot);
        markDirty();
    }, [push, markDirty]);

    const handleBack = useCallback(() => {
        if (confirmNavigation()) router.push("/admin/pages");
    }, [confirmNavigation, router]);

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
                        <Button onClick={handleSave} disabled={saving || !canSave}>
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
                                <option value="published">منتشرشده</option>
                                <option value="archived">آرشیو</option>
                            </select>
                        </div>
                    </div>
                </section>
            )}

            <div className={`grid gap-4 ${showPreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
                <div className="rounded-lg border bg-white p-4 h-[calc(100vh-360px)] min-h-[560px] overflow-hidden flex flex-col">
                    <ComposerCanvas
                        initialSections={sections}
                        onChange={handleSectionsChange}
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
