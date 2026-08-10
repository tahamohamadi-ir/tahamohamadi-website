"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/admin/auth-context";
import { adminFetch } from "@/lib/admin-fetch";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContentStats {
    pages: number;
    articles: number;
    case_studies: number;
    media_assets: number;
}

interface WorkflowStatus {
    draft: number;
    in_review: number;
    scheduled: number;
    published: number;
}

interface RecentActivityItem {
    id: string;
    content_type: string;
    object_id: string;
    from_status: string;
    to_status: string;
    user: string;
    timestamp: string;
    reason: string;
}

interface TranslationIssueItem {
    title: string;
    locales: string[];
    statuses: Record<string, string>;
    action_path: string;
}

interface ActionableWidgets {
    translation_issues: {
        count: number;
        items: TranslationIssueItem[];
        action_path: string;
    };
    unread_messages: {
        count: number;
        action_path: string;
    };
}

interface DashboardData {
    content_stats: ContentStats;
    workflow_status: WorkflowStatus;
    recent_activity: RecentActivityItem[];
    actionable_widgets?: ActionableWidgets;
}

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------

export default function AdminDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        adminFetch<DashboardData>("/api/admin/dashboard/")
            .then(setData)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">داشبورد</h1>
                <p className="mt-1 text-sm text-gray-600">
                    {user ? `خوش آمدید، ${user.username}` : "خوش آمدید"}
                </p>
            </div>

            {error && (
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-red-600">خطا در بارگذاری: {error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Stats */}
            <section aria-label="آمار محتوا">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <Card key={i}>
                                <CardHeader className="pb-2">
                                    <Skeleton className="h-4 w-20" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-8 w-12" />
                                </CardContent>
                            </Card>
                        ))
                    ) : data ? (
                        <>
                            <StatCard title="صفحات" value={data.content_stats.pages} href="/admin/pages" />
                            <StatCard title="مقالات" value={data.content_stats.articles} href="/admin/blog" />
                            <StatCard title="نمونه‌کارها" value={data.content_stats.case_studies} href="/admin/portfolio" />
                            <StatCard title="رسانه‌ها" value={data.content_stats.media_assets} href="/admin/media" />
                        </>
                    ) : null}
                </div>
            </section>

            {/* Bottom Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Activity */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>فعالیت‌های اخیر</CardTitle>
                        <CardDescription>آخرین تغییرات محتوا</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <Skeleton className="h-9 w-9 rounded-full" />
                                        <Skeleton className="h-4 w-48" />
                                    </div>
                                ))}
                            </div>
                        ) : data && data.recent_activity.length > 0 ? (
                            <div className="space-y-4">
                                {data.recent_activity.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                                            <span className="text-xs font-medium text-gray-500">
                                                {item.user.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm">
                                                <span className="font-medium">{item.user}</span>{" "}
                                                تغییر {formatContentType(item.content_type)} از{" "}
                                                <Badge variant="outline" className="text-xs">
                                                    {item.from_status}
                                                </Badge>{" "}
                                                به{" "}
                                                <Badge variant="secondary" className="text-xs">
                                                    {item.to_status}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {formatRelativeTime(item.timestamp)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">فعالیت اخیری نیست</p>
                        )}
                    </CardContent>
                </Card>

                {/* Workflow Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>وضعیت گردش‌کار</CardTitle>
                        <CardDescription>توزیع محتوا بر اساس وضعیت</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="flex justify-between">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-5 w-8" />
                                    </div>
                                ))}
                            </div>
                        ) : data ? (
                            <div className="space-y-3">
                                <WorkflowRow label="پیش‌نویس" count={data.workflow_status.draft} />
                                <WorkflowRow label="در بررسی" count={data.workflow_status.in_review} />
                                <WorkflowRow label="زمان‌بندی" count={data.workflow_status.scheduled} />
                                <WorkflowRow label="منتشرشده" count={data.workflow_status.published} />
                            </div>
                        ) : null}
                    </CardContent>
                </Card>
            </div>

            {/* Actionable Widgets */}
            {data?.actionable_widgets && (
                <section aria-label="هشدارهای عملیاتی">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">نیاز به اقدام</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Translation Issues */}
                        <Link href={data.actionable_widgets.translation_issues.action_path}>
                            <Card
                                className={`cursor-pointer hover:shadow-md transition-shadow h-full ${
                                    data.actionable_widgets.translation_issues.count > 0
                                        ? "border-amber-300 bg-amber-50"
                                        : "border-green-200 bg-green-50"
                                }`}
                            >
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <span>{data.actionable_widgets.translation_issues.count > 0 ? "⚠️" : "✅"}</span>
                                        مشکلات ترجمه
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold">
                                        {data.actionable_widgets.translation_issues.count}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {data.actionable_widgets.translation_issues.count > 0
                                            ? "محتوا با ترجمه ناقص یا قدیمی"
                                            : "همه محتواها ترجمه دارند"}
                                    </p>
                                    {data.actionable_widgets.translation_issues.items.length > 0 && (
                                        <ul className="mt-2 space-y-1">
                                            {data.actionable_widgets.translation_issues.items.slice(0, 3).map((item, i) => (
                                                <li key={i} className="text-xs text-gray-600 truncate">
                                                    • {item.title}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>

                        {/* Unread Messages */}
                        <Link href={data.actionable_widgets.unread_messages.action_path}>
                            <Card
                                className={`cursor-pointer hover:shadow-md transition-shadow h-full ${
                                    data.actionable_widgets.unread_messages.count > 0
                                        ? "border-blue-300 bg-blue-50"
                                        : "border-green-200 bg-green-50"
                                }`}
                            >
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <span>{data.actionable_widgets.unread_messages.count > 0 ? "📬" : "📭"}</span>
                                        پیام‌های خوانده‌نشده
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold">
                                        {data.actionable_widgets.unread_messages.count}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {data.actionable_widgets.unread_messages.count > 0
                                            ? "پیام جدید در صندوق ورودی"
                                            : "صندوق ورودی خالی است"}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>

                        {/* SEO Health — links to content-health page */}
                        <Link href="/admin/content-health">
                            <Card className="cursor-pointer hover:shadow-md transition-shadow h-full border-gray-200">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <span>🔍</span>
                                        سلامت محتوا
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600">
                                        بررسی تصاویر بدون alt، رسانه‌های بی‌استفاده و زمان‌بندی‌های ناموفق
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                </section>
            )}

            {/* Quick Links */}
            <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">دسترسی سریع</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <QuickLink href="/admin/pages" title="Page Builder" description="ساخت و ویرایش صفحات با Composer" />
                    <QuickLink href="/admin/blog" title="ادیتور مقالات" description="نوشتن و انتشار مطالب بلاگ" />
                    <QuickLink href="/admin/portfolio" title="نمونه‌کارها" description="مدیریت پروژه‌ها و کیس‌استادی" />
                    <QuickLink href="/admin/media" title="کتابخانه رسانه" description="آپلود و مدیریت فایل‌ها" />
                    <QuickLink href="/admin/workflow" title="گردش‌کار و ترجمه" description="وضعیت انتشار و صف ترجمه" />
                </div>
            </section>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function StatCard({ title, value, href }: { title: string; value: number; href: string }) {
    return (
        <Link href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{value}</p>
                </CardContent>
            </Card>
        </Link>
    );
}

function WorkflowRow({ label, count }: { label: string; count: number }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{label}</span>
            <Badge variant={count > 0 ? "default" : "secondary"}>{count}</Badge>
        </div>
    );
}

function QuickLink({ href, title, description }: { href: string; title: string; description: string }) {
    return (
        <Link href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500">{description}</p>
                </CardContent>
            </Card>
        </Link>
    );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatContentType(ct: string): string {
    const map: Record<string, string> = {
        "cms.page": "صفحه",
        "blog.article": "مقاله",
        "portfolio.casestudy": "نمونه‌کار",
    };
    return map[ct] || ct.split(".").pop() || ct;
}

function formatRelativeTime(isoTimestamp: string): string {
    const date = new Date(isoTimestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "الان";
    if (diffMinutes < 60) return `${diffMinutes} دقیقه پیش`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} ساعت پیش`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} روز پیش`;

    return date.toLocaleDateString("fa-IR");
}
