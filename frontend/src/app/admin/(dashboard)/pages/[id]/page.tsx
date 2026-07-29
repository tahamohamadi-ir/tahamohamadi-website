"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ComposerCanvas } from "@/components/admin/composer";
import { adminFetch } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ComposerSection } from "@/components/admin/composer/types";

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

export default function PageEditorPage() {
    const params = useParams();
    const router = useRouter();
    const pageId = params.id as string;

    const [page, setPage] = useState<PageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sections, setSections] = useState<ComposerSection[]>([]);

    useEffect(() => {
        if (pageId === "new") {
            setPage(null);
            setSections([]);
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
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load page");
            } finally {
                setLoading(false);
            }
        }
        fetchPage();
    }, [pageId]);

    const handleSave = useCallback(async () => {
        if (!page) return;
        setSaving(true);
        try {
            await adminFetch(`/api/admin/pages/${page.id}/`, {
                method: "PUT",
                body: JSON.stringify({
                    ...page,
                    sections,
                    version: page.version,
                }),
            });
            // Refetch to get new version
            const updated = await adminFetch<PageData>(
                `/api/admin/pages/${page.id}/`
            );
            setPage(updated);
            setSections(updated.sections || []);
        } catch (err) {
            if (err instanceof Error && err.message.includes("409")) {
                alert("تداخل نسخه! یک نفر دیگر این صفحه را ویرایش کرده. لطفاً صفحه را مجدداً بارگذاری کنید.");
            } else {
                setError(err instanceof Error ? err.message : "Save failed");
            }
        } finally {
            setSaving(false);
        }
    }, [page, sections]);

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-[600px] w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-red-800">{error}</p>
                <Button className="mt-2" onClick={() => router.push("/admin/pages")}>
                    بازگشت به لیست صفحات
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {pageId === "new"
                            ? "ایجاد صفحه جدید"
                            : `ویرایش: ${page?.title_fa || page?.title_en || ""}`}
                    </h1>
                    {page && (
                        <p className="text-sm text-gray-500 mt-1">
                            نوع: {page.page_type} | وضعیت: {page.status} | نسخه: {page.version}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => router.push("/admin/pages")}>
                        بازگشت
                    </Button>
                    {page && (
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "در حال ذخیره..." : "ذخیره"}
                        </Button>
                    )}
                </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
                <ComposerCanvas
                    initialSections={sections}
                    onChange={setSections}
                />
            </div>
        </div>
    );
}
