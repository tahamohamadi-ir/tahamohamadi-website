"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch, type PaginatedResponse } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface CaseStudyItem {
    id: string;
    title_fa: string;
    title_en: string;
    slug_fa: string;
    slug_en: string;
    status: string;
    featured: boolean;
    updated_at: string;
}

export default function AdminPortfolioListPage() {
    const [caseStudies, setCaseStudies] = useState<CaseStudyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCaseStudies() {
            try {
                const data = await adminFetch<PaginatedResponse<CaseStudyItem> | CaseStudyItem[]>(
                    "/api/admin/portfolio/"
                );
                const results = Array.isArray(data) ? data : data.results;
                setCaseStudies(results);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load case studies");
            } finally {
                setLoading(false);
            }
        }
        fetchCaseStudies();
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
                <h1 className="text-2xl font-bold text-gray-900">نمونه‌کارها</h1>
                <Link href="/admin/portfolio/new">
                    <Button>ایجاد نمونه‌کار جدید</Button>
                </Link>
            </div>

            {caseStudies.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                    <p className="text-gray-500">هیچ نمونه‌کاری وجود ندارد</p>
                    <Link href="/admin/portfolio/new">
                        <Button className="mt-4" variant="outline">
                            اولین نمونه‌کار را اضافه کنید
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
                                    ویژه
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    آخرین ویرایش
                                </th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {caseStudies.map((cs) => (
                                <tr key={cs.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {cs.title_fa || cs.title_en}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {cs.slug_fa || cs.slug_en}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={cs.status} />
                                    </td>
                                    <td className="px-6 py-4">
                                        {cs.featured ? (
                                            <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                                                ویژه
                                            </span>
                                        ) : (
                                            <span className="text-sm text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(cs.updated_at).toLocaleDateString("fa-IR")}
                                    </td>
                                    <td className="px-6 py-4 text-left">
                                        <Link href={`/admin/portfolio/${cs.id}`}>
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
