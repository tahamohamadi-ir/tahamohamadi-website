"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArticleEditor } from "@/components/admin/editor";
import { adminFetch } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { EditorArticle, ArticleBlock } from "@/components/admin/editor/types";

export default function ArticleEditorPage() {
    const params = useParams();
    const router = useRouter();
    const articleId = params.id as string;

    const [article, setArticle] = useState<EditorArticle | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [locale, setLocale] = useState<"fa" | "en">("fa");

    useEffect(() => {
        if (articleId === "new") {
            setArticle({ blocks: [], title_fa: "", title_en: "" });
            setLoading(false);
            return;
        }
        async function fetchArticle() {
            try {
                const data = await adminFetch<EditorArticle>(
                    `/api/admin/blog/articles/${articleId}/`
                );
                setArticle(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load article");
            } finally {
                setLoading(false);
            }
        }
        fetchArticle();
    }, [articleId]);

    const handleSave = useCallback(
        async (blocks: ArticleBlock[]) => {
            if (!article) return;
            setSaving(true);
            try {
                const endpoint =
                    articleId === "new"
                        ? "/api/admin/blog/articles/"
                        : `/api/admin/blog/articles/${articleId}/`;
                const method = articleId === "new" ? "POST" : "PUT";

                await adminFetch(endpoint, {
                    method,
                    body: JSON.stringify({
                        ...article,
                        blocks,
                    }),
                });
                if (articleId === "new") {
                    router.push("/admin/blog");
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Save failed");
            } finally {
                setSaving(false);
            }
        },
        [article, articleId, router]
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
                <Button className="mt-2" onClick={() => router.push("/admin/blog")}>
                    بازگشت به لیست مقالات
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {articleId === "new"
                            ? "ایجاد مقاله جدید"
                            : `ویرایش: ${article?.title_fa || article?.title_en || ""}`}
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
                    <Button variant="outline" onClick={() => router.push("/admin/blog")}>
                        بازگشت
                    </Button>
                </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
                <ArticleEditor
                    article={article}
                    locale={locale}
                    onSave={handleSave}
                />
            </div>
        </div>
    );
}
