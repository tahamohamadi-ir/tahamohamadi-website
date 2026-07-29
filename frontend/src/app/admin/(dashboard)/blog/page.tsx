"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch, type PaginatedResponse } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ArticleItem {
    id: string;
    title_fa: string;
    title_en: string;
    slug_fa: string;
    slug_en: string;
    status: string;
    published_at: string | null;
    updated_at: string;
    reading_time_fa: number;
    reading_time_en: number;
}

export default function AdminBlogListPage() {
    const [articles, setArticles] = useState<ArticleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchArticles() {
            try {
                const data = await adminFetch<PaginatedResponse<ArticleItem> | ArticleItem[]>(
                    "/api/admin/blog/articles/"
                );
                const results = Array.isArray(data) ? data : data.results;
                setArticles(results);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load articles");
            } finally {
                setLoading(false);
            }
        }
        fetchArticles();
    }, []);

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-red-800">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">مقالات</h1>
                <Link href="/admin/blog/new">
                    <Button>ایجاد مقاله جدید</Button>
                </Link>
            </div>

            {articles.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                    <p className="text-gray-500">هیچ مقاله‌ای وجود ندارد</p>
                    <Link href="/admin/blog/new">
                        <Button className="mt-4" variant="outline">
                            اولین مقاله را بنویسید
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    عنوان
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    وضعیت
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    تاریخ انتشار
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    آخرین ویرایش
                                </th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {articles.map((article) => (
                                <tr key={article.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {article.title_fa || article.title_en}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {article.slug_fa || article.slug_en}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={article.status} />
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {article.published_at
                                            ? new Date(article.published_at).toLocaleDateString("fa-IR")
                                            : "—"}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(article.updated_at).toLocaleDateString("fa-IR")}
                                    </td>
                                    <td className="px-6 py-4 text-left">
                                        <Link href={`/admin/blog/${article.id}`}>
                                            <Button variant="outline" size="sm">
                                                ویرایش
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        draft: "bg-gray-100 text-gray-700",
        in_review: "bg-yellow-100 text-yellow-800",
        published: "bg-green-100 text-green-800",
        scheduled: "bg-blue-100 text-blue-800",
        archived: "bg-red-100 text-red-700",
    };
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-700"}`}
        >
            {status === "draft" ? "پیش‌نویس" : status === "published" ? "منتشرشده" : status === "in_review" ? "در بررسی" : status === "scheduled" ? "زمان‌بندی" : status === "archived" ? "آرشیو" : status}
        </span>
    );
}
