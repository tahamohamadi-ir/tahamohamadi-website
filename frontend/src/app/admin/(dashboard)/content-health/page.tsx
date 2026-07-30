"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface HealthItem {
  title?: string;
  content_type?: string;
  locales?: string[];
  missing_locales?: string[];
  action_path: string;
}

interface HealthSection {
  count: number;
  items: HealthItem[];
  truncated: boolean;
}

interface ContentHealthReport {
  translation_issues: HealthSection;
  missing_media_alt: HealthSection;
  orphan_media: HealthSection;
  failed_schedules: HealthSection;
}

const sections: Array<{ key: keyof ContentHealthReport; title: string; description: string; actionLabel: string }> = [
  { key: "translation_issues", title: "ترجمهٔ ناقص یا قدیمی", description: "localeهایی که در محتوای موجود کامل یا به‌روز نیستند.", actionLabel: "رفع ترجمه" },
  { key: "missing_media_alt", title: "alt متن رسانه", description: "تصاویر فعال با alt ناقص در یکی از localeها.", actionLabel: "ویرایش رسانه" },
  { key: "orphan_media", title: "رسانهٔ بدون مصرف", description: "رسانه‌های فعال که هیچ مرجع محتوایی ندارند.", actionLabel: "بررسی رسانه" },
  { key: "failed_schedules", title: "زمان‌بندی ناموفق", description: "انتشارهای زمان‌بندی‌شده‌ای که آخرین اجرا ناموفق بوده است.", actionLabel: "بررسی زمان‌بندی" },
];

function itemLabel(item: HealthItem) {
  return item.title ?? item.content_type ?? "مورد ناشناس";
}

function itemDetail(item: HealthItem) {
  if (item.locales?.length) return `locale نیازمند پیگیری: ${item.locales.join("، ")}`;
  if (item.missing_locales?.length) return `alt ناقص: ${item.missing_locales.join("، ")}`;
  return null;
}

export default function AdminContentHealthPage() {
  const [report, setReport] = useState<ContentHealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReport(await adminFetch<ContentHealthReport>("/api/admin/content-health/"));
    } catch {
      setReport(null);
      setError("دریافت گزارش سلامت محتوا ممکن نیست.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl space-y-6" dir="rtl">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">سلامت محتوا</h1>
          <p className="mt-1 text-sm text-gray-600">فقط مواردی نمایش داده می‌شوند که از دادهٔ فعلی سامانه به‌دست آمده‌اند.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>بازخوانی</Button>
      </header>

      {loading ? <Skeleton className="h-72 w-full" /> : error ? (
        <Card><CardContent className="p-6 text-sm text-destructive" role="alert">{error}</CardContent></Card>
      ) : report ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {sections.map((section) => {
            const data = report[section.key];
            return (
              <Card key={section.key}>
                <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                  <div className="space-y-1.5"><CardTitle>{section.title}</CardTitle><CardDescription>{section.description}</CardDescription></div>
                  <Badge variant={data.count ? "destructive" : "outline"}>{data.count}</Badge>
                </CardHeader>
                <CardContent>
                  {data.items.length === 0 ? <p className="text-sm text-muted-foreground">موردی یافت نشد.</p> : (
                    <ul className="space-y-3">
                      {data.items.map((item, index) => <li key={`${item.action_path}-${index}`} className="flex items-start justify-between gap-3 rounded-md border p-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{itemLabel(item)}</p>{itemDetail(item) && <p className="mt-1 text-xs text-muted-foreground">{itemDetail(item)}</p>}</div><Link className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline" href={item.action_path}>{section.actionLabel}</Link></li>)}
                    </ul>
                  )}
                  {data.truncated && <p className="mt-4 text-xs text-muted-foreground">فقط ۱۰۰ مورد اول نمایش داده می‌شود؛ فیلتر دقیق‌تر در منبع مربوطه انجام شود.</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
