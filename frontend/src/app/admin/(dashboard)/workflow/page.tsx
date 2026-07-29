"use client";

import { useState, useEffect } from "react";
import { TranslationQueue } from "@/components/admin/workflow/TranslationQueue";
import { adminFetch } from "@/lib/admin-fetch";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ScheduledItem {
    id: string;
    object_id: string;
    scheduled_at: string;
    status: string;
}

export default function AdminWorkflowPage() {
    const [activeTab, setActiveTab] = useState<"scheduled" | "translations">("translations");
    const [scheduledItems, setScheduledItems] = useState<ScheduledItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchScheduled() {
            try {
                const data = await adminFetch<ScheduledItem[]>(
                    "/api/admin/workflow/scheduled/"
                );
                setScheduledItems(Array.isArray(data) ? data : []);
            } catch {
                setScheduledItems([]);
            } finally {
                setLoading(false);
            }
        }
        fetchScheduled();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">گردش‌کار و ترجمه</h1>
                <p className="text-sm text-gray-500 mt-1">
                    مدیریت وضعیت محتوا، زمان‌بندی انتشار، و صف ترجمه
                </p>
            </div>

            <div className="border-b">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab("translations")}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "translations"
                                ? "border-gray-900 text-gray-900"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        صف ترجمه
                    </button>
                    <button
                        onClick={() => setActiveTab("scheduled")}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "scheduled"
                                ? "border-gray-900 text-gray-900"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        زمان‌بندی انتشار
                    </button>
                </div>
            </div>

            <div>
                {activeTab === "translations" && <TranslationQueue />}
                {activeTab === "scheduled" && (
                    <div className="space-y-4">
                        {loading ? (
                            <Skeleton className="h-32 w-full" />
                        ) : scheduledItems.length === 0 ? (
                            <Card>
                                <CardContent className="pt-6 text-center text-gray-500">
                                    هیچ محتوایی برای انتشار زمان‌بندی نشده است
                                </CardContent>
                            </Card>
                        ) : (
                            scheduledItems.map((item) => (
                                <Card key={item.id}>
                                    <CardContent className="pt-4 flex items-center justify-between">
                                        <span className="text-sm font-medium">{item.object_id}</span>
                                        <span className="text-sm text-gray-500">
                                            {new Date(item.scheduled_at).toLocaleString("fa-IR")}
                                        </span>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
