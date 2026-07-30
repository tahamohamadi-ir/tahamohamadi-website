"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type ContactStatus = "new" | "read" | "archived";

interface ContactMessageSummary {
  id: string;
  name: string;
  email: string;
  subject: string;
  status: ContactStatus;
  created_at: string;
}

interface ContactMessageDetail extends ContactMessageSummary {
  message: string;
}

interface ContactTimelineEvent {
  action: "read" | "archived" | string;
  actor: string;
  timestamp: string;
}

interface ContactMessagePage {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  next: string | null;
  previous: string | null;
  results: ContactMessageSummary[];
}

const statusLabels: Record<ContactStatus, string> = {
  new: "جدید",
  read: "خوانده‌شده",
  archived: "بایگانی‌شده",
};

const timelineActionLabels: Record<string, string> = {
  read: "خوانده شد",
  archived: "بایگانی شد",
};

function statusVariant(status: ContactStatus): "default" | "secondary" | "outline" {
  return status === "new" ? "default" : status === "read" ? "secondary" : "outline";
}

export default function AdminContactInboxPage() {
  const [messages, setMessages] = useState<ContactMessageSummary[]>([]);
  const [selected, setSelected] = useState<ContactMessageDetail | null>(null);
  const [timeline, setTimeline] = useState<ContactTimelineEvent[]>([]);
  const [statusFilter, setStatusFilter] = useState<"" | ContactStatus>("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const query = new URLSearchParams();
    if (statusFilter) query.set("status", statusFilter);
    if (searchQuery) query.set("search", searchQuery);
    if (page > 1) query.set("page", String(page));
    const suffix = query.size ? `?${query.toString()}` : "";

    try {
      const response = await adminFetch<ContactMessagePage>(`/api/admin/contact-messages/${suffix}`);
      setMessages(response.results);
      setTotalPages(response.total_pages);
      setSelected(null);
      setTimeline([]);
    } catch {
      setMessages([]);
      setError("دریافت صندوق پیام‌های تماس ممکن نیست.");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function selectMessage(message: ContactMessageSummary) {
    setError(null);
    try {
      const [detail, audit] = await Promise.all([
        adminFetch<ContactMessageDetail>(`/api/admin/contact-messages/${message.id}/`),
        adminFetch<{ events: ContactTimelineEvent[] }>(`/api/admin/contact-messages/${message.id}/timeline/`),
      ]);
      setSelected(detail);
      setTimeline(audit.events);
    } catch {
      setTimeline([]);
      setError("دریافت متن پیام ممکن نیست.");
    }
  }

  async function transition(message: ContactMessageSummary, action: "mark-read" | "archive") {
    setUpdatingId(message.id);
    setError(null);
    try {
      const updated = await adminFetch<Pick<ContactMessageSummary, "id" | "status">>(
        `/api/admin/contact-messages/${message.id}/${action}/`,
        { method: "POST" },
      );
      setMessages((current) => current.map((item) => item.id === updated.id ? { ...item, status: updated.status } : item));
      setSelected((current) => current?.id === updated.id ? { ...current, status: updated.status } : current);
    } catch {
      setError("تغییر وضعیت پیام ممکن نیست.");
    } finally {
      setUpdatingId(null);
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchQuery(searchInput.trim());
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6" dir="rtl">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">صندوق پیام‌های تماس</h1>
          <p className="mt-1 text-sm text-gray-600">پیام‌های جدید را بخوانید و پس از پیگیری بایگانی کنید.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>بازخوانی</Button>
      </header>

      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={submitSearch}>
            <label className="sr-only" htmlFor="contact-search">جست‌وجوی پیام‌ها</label>
            <input
              id="contact-search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="جست‌وجو در نام، ایمیل یا موضوع"
              className="min-h-11 flex-1 rounded-md border border-input bg-background px-3 text-sm"
            />
            <label className="sr-only" htmlFor="contact-status">وضعیت</label>
            <select
              id="contact-status"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as "" | ContactStatus);
                setPage(1);
              }}
              className="min-h-11 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">همهٔ وضعیت‌ها</option>
              <option value="new">جدید</option>
              <option value="read">خوانده‌شده</option>
              <option value="archived">بایگانی‌شده</option>
            </select>
            <Button type="submit">جست‌وجو</Button>
          </form>
        </CardContent>
      </Card>

      {error && <Card><CardContent className="p-6 text-sm text-destructive" role="alert">{error}</CardContent></Card>}

      {loading ? <Skeleton className="h-64 w-full" /> : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)]">
          <Card>
            <CardHeader>
              <CardTitle>پیام‌ها</CardTitle>
              <CardDescription>متن کامل فقط پس از انتخاب یک پیام نمایش داده می‌شود.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              {messages.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">پیامی مطابق این جست‌وجو وجود ندارد.</p> : (
                <table className="w-full min-w-[640px] text-right text-sm">
                  <thead className="border-y bg-muted/30 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">فرستنده</th>
                      <th className="px-4 py-3 font-medium">موضوع</th>
                      <th className="px-4 py-3 font-medium">وضعیت</th>
                      <th className="px-4 py-3 font-medium">زمان</th>
                      <th className="px-4 py-3"><span className="sr-only">عملیات</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map((message) => (
                      <tr key={message.id} className="border-b last:border-0">
                        <td className="px-4 py-3"><button type="button" className="text-right font-medium hover:underline" onClick={() => void selectMessage(message)}>{message.name}<span className="mt-1 block font-normal text-muted-foreground" dir="ltr">{message.email}</span></button></td>
                        <td className="px-4 py-3">{message.subject}</td>
                        <td className="px-4 py-3"><Badge variant={statusVariant(message.status)}>{statusLabels[message.status]}</Badge></td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground"><time dateTime={message.created_at}>{new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(new Date(message.created_at))}</time></td>
                        <td className="px-4 py-3 whitespace-nowrap text-left">
                          {message.status === "new" && <Button type="button" size="sm" variant="outline" onClick={() => void transition(message, "mark-read")} disabled={updatingId === message.id}>خوانده شد</Button>}
                          {message.status === "read" && <Button type="button" size="sm" variant="outline" onClick={() => void transition(message, "archive")} disabled={updatingId === message.id}>بایگانی</Button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-6 py-4 text-sm">
                <span className="text-muted-foreground">صفحه {page} از {totalPages}</span>
                <div className="flex gap-2" dir="rtl">
                  <Button type="button" variant="outline" size="sm" onClick={() => setPage((current) => current - 1)} disabled={page === 1 || loading}>صفحه قبل</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setPage((current) => current + 1)} disabled={page === totalPages || loading}>صفحه بعد</Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="h-fit">
            <CardHeader><CardTitle>متن پیام</CardTitle></CardHeader>
            <CardContent>
              {selected ? <div className="space-y-5 text-sm"><div><p className="font-medium">{selected.subject}</p><p className="mt-1 text-muted-foreground">{selected.name} · <span dir="ltr">{selected.email}</span></p></div><p className="whitespace-pre-wrap leading-7">{selected.message}</p><section className="border-t pt-4" aria-label="رخدادها"><h2 className="font-medium">رخدادها</h2>{timeline.length ? <ol className="mt-3 space-y-2">{timeline.map((event, index) => <li key={`${event.timestamp}-${index}`} className="text-muted-foreground"><span className="text-foreground">{timelineActionLabels[event.action] ?? event.action} توسط {event.actor}</span><time className="mt-1 block text-xs" dateTime={event.timestamp}>{new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(new Date(event.timestamp))}</time></li>)}</ol> : <p className="mt-2 text-muted-foreground">رخدادی برای این پیام ثبت نشده است.</p>}</section></div> : <p className="text-sm text-muted-foreground">برای دیدن متن کامل، فرستنده را از فهرست انتخاب کنید.</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
