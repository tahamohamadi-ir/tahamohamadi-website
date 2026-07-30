"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SeedRecord {
  resource: string;
  status: string;
  missing_locales: string[];
  requires_manual_review: boolean;
}

interface SeedReviewIssue extends SeedRecord {
  reason: string;
}

interface SeedReviewReport {
  automatic_publish_allowed: false;
  seed_record_count: number;
  records: SeedRecord[];
  issues: SeedReviewIssue[];
}

const resourceLabels: Record<string, string> = {
  site_profiles: "پروفایل سایت",
  social_links: "لینک‌های اجتماعی",
  skills: "مهارت‌ها",
  experience: "تجربه‌ها",
  education: "تحصیلات",
  certifications: "گواهی‌ها",
  affiliations: "وابستگی‌ها",
  languages: "زبان‌ها",
  research_projects: "پروژه‌های پژوهشی",
  research_interests: "علایق پژوهشی",
  publications: "انتشارات",
  resumes: "رزومه‌ها",
  site_settings: "تنظیمات سایت",
  navigation: "ناوبری",
};

function resourceLabel(resource: string): string {
  return resourceLabels[resource] ?? resource;
}

function missingLocaleLabel(fields: string[]): string {
  const locales = new Set(fields.map((field) => field.endsWith("_fa") ? "fa" : field.endsWith("_en") ? "en" : field));
  return [...locales].join("، ");
}

export default function AdminSeedReviewPage() {
  const [report, setReport] = useState<SeedReviewReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReport(await adminFetch<SeedReviewReport>("/api/admin/seed-review/"));
    } catch {
      setReport(null);
      setError("دریافت گزارش بازبینی seed ممکن نیست.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">بازبینی داده‌های seed</h1>
          <p className="mt-1 text-sm text-gray-600">این گزارش فقط برای بازبینی دستی است و انتشار خودکار را مجاز نمی‌کند.</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="min-h-11 rounded-md border border-input px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
        >
          بازخوانی گزارش
        </button>
      </header>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-sm text-destructive" role="alert">{error}</CardContent>
        </Card>
      ) : report ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>گیت انتشار</CardTitle>
              <CardDescription>هر رکورد seed پیش از انتشار باید توسط مدیر بازبینی شود.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Badge variant="destructive">انتشار خودکار: غیرمجاز</Badge>
              <span className="text-sm text-gray-600">{report.seed_record_count} رکورد نیازمند بازبینی است.</span>
            </CardContent>
          </Card>

          {report.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>موارد نیازمند رفع</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  {report.issues.map((issue, index) => (
                    <li key={`${issue.resource}-${issue.reason}-${index}`} className="rounded-md border border-destructive/30 p-3 text-destructive">
                      <span className="font-medium">{resourceLabel(issue.resource)}: </span>{issue.reason}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>رکوردهای seed</CardTitle>
              <CardDescription>برای تکمیل دو locale و وضعیت draft هر مورد را در فرم منبع مربوطه بررسی کنید.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {report.records.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-600">رکورد seed برای بازبینی وجود ندارد.</p>
              ) : (
                <table className="w-full min-w-[560px] text-right text-sm">
                  <thead className="border-b text-gray-600">
                    <tr>
                      <th className="px-3 py-2 font-medium">منبع</th>
                      <th className="px-3 py-2 font-medium">وضعیت</th>
                      <th className="px-3 py-2 font-medium">locale ناقص</th>
                      <th className="px-3 py-2 font-medium">بازبینی دستی</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.records.map((record, index) => (
                      <tr key={`${record.resource}-${index}`} className="border-b last:border-0">
                        <td className="px-3 py-3 font-medium">{resourceLabel(record.resource)}</td>
                        <td className="px-3 py-3"><Badge variant="outline">{record.status}</Badge></td>
                        <td className="px-3 py-3">{record.missing_locales.length ? missingLocaleLabel(record.missing_locales) : "کامل"}</td>
                        <td className="px-3 py-3">{record.requires_manual_review ? "الزامی" : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
