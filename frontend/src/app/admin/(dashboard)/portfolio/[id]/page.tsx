"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { CaseStudyEditor, type CaseStudyData } from "@/components/admin/portfolio";
import { adminFetch } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function CaseStudyEditorPage() {
    const params = useParams();
    const router = useRouter();
    const caseStudyId = params.id as string;

    const [caseStudy, setCaseStudy] = useState<CaseStudyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [locale, setLocale] = useState<"fa" | "en">("fa");

    useEffect(() => {
        if (caseStudyId === "new") {
            setCaseStudy({
                title_fa: "",
                title_en: "",
                slug_fa: "",
                slug_en: "",
                role_fa: "",
                role_en: "",
                client_fa: "",
                client_en: "",
                technologies: [],
                statement_fa: "",
                statement_en: "",
                problem_fa: "",
                problem_en: "",
                outcome_fa: "",
                outcome_en: "",
                limitations_fa: "",
                limitations_en: "",
                date_start: "",
                date_end: "",
                narrative_blocks: [],
                gallery: [],
                featured: false,
                status: "draft",
            });
            setLoading(false);
            return;
        }
        async function fetchCaseStudy() {
            try {
                const data = await adminFetch<CaseStudyData>(
                    `/api/admin/portfolio/${caseStudyId}/`
                );
                setCaseStudy(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load case study");
            } finally {
                setLoading(false);
            }
        }
        fetchCaseStudy();
    }, [caseStudyId]);

    const handleSave = useCallback(
        async (data: CaseStudyData) => {
            setSaving(true);
            try {
                const endpoint =
                    caseStudyId === "new"
                        ? "/api/admin/portfolio/"
                        : `/api/admin/portfolio/${caseStudyId}/`;
                const method = caseStudyId === "new" ? "POST" : "PUT";

                await adminFetch(endpoint, {
                    method,
                    body: JSON.stringify(data),
                });
                if (caseStudyId === "new") {
                    router.push("/admin/portfolio");
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Save failed");
            } finally {
                setSaving(false);
            }
        },
        [caseStudyId, router]
    );

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
                <Button className="mt-2" onClick={() => router.push("/admin/portfolio")}>
                    بازگشت به لیست نمونه‌کارها
                </Button>
            </div>
        );
    }

    if (!caseStudy) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {caseStudyId === "new"
                            ? "ایجاد نمونه‌کار جدید"
                            : `ویرایش: ${caseStudy.title_fa || caseStudy.title_en}`}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={locale}
                        onChange={(e) => setLocale(e.target.value as "fa" | "en")}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                    >
                        <option value="fa">فارسی</option>
                        <option value="en">English</option>
                    </select>
                    <Button variant="outline" onClick={() => router.push("/admin/portfolio")}>
                        بازگشت
                    </Button>
                </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
                <CaseStudyEditor
                    caseStudy={caseStudy}
                    locale={locale}
                    onSave={handleSave}
                />
            </div>
        </div>
    );
}
