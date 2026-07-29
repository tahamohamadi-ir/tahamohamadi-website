"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch, type PaginatedResponse } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface PageItem {
    id: string;
    title_fa: string;
    title_en: string;
    slug_fa: string;
    slug_en: string;
    page_type: string;
    status: string;
    updated_at: string;
}

export default function AdminPagesListPage() {
    const [pages, setPages] = useState<PageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPages() {
            try {
                const data = await adminFetch<PaginatedResponse<PageItem> | PageItem[]>(
                    "/api/admin/pages/"
                );
                const results = Array.isArray(data) ? data : data.results;
                setPages(results);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load pages");
            } finally {
                setLoading(false);
            }
        }
        fetchPages();
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
                <h1 className="text-2xl font-bold text-gray-900">صفحات</h1>
                <Link href="/admin/pages/new">
                    <Button>ایجاد صفحه جدید</Button>
                </Link>
            </div>

            {pages.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                    <p className="text-gray-500">هیچ صفحه‌ای وجود ندارد</p>
                    <Link href="/admin/pages/new">
                        <Button className="mt-4" variant="outline">
                            اولین صفحه را بسازید
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
                                    نوع
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    وضعیت
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    آخرین بروزرسانی
                                </th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {pages.map((page) => (
                                <tr key={page.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {page.title_fa || page.title_en}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {page.slug_fa || page.slug_en}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {page.page_type}
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={page.status} />
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(page.updated_at).toLocaleDateString("fa-IR")}
                                    </td>
                                    <td className="px-6 py-4 text-left">
                                        <Link href={`/admin/pages/${page.id}`}>
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
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colors[status] || "bg-gray-100 text-gray-700"}`}
        >
            {status === "draft" ? "پیش‌نویس" : status === "published" ? "منتشرشده" : status === "in_review" ? "در بررسی" : status === "scheduled" ? "زمان‌بندی" : status === "archived" ? "آرشیو" : status}
        </span>
    );
}
