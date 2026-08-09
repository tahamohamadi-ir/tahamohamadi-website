"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAutosave, useDirtyGuard } from "@/hooks";
import { Select } from "@/components/ui/select";

interface SiteSettings {
  id: string;
  version: number;
  site_title_fa: string;
  site_title_en: string;
  default_title_fa: string;
  default_title_en: string;
  default_description_fa: string;
  default_description_en: string;
  public_email: string;
  primary_cta_label_fa: string;
  primary_cta_label_en: string;
  primary_cta_url: string;
  footer_text_fa: string;
  footer_text_en: string;
  default_og_image: string | null;
  theme_preset: string;
  density: string;
  design_tokens: Record<string, unknown>;
  status: string;
}

interface SiteSettingsResponse {
  results: SiteSettings[];
}

export default function SiteConfigPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Design tokens specific state
  const [primaryColorFa, setPrimaryColorFa] = useState("#000000");
  const [primaryColorEn, setPrimaryColorEn] = useState("#000000");

  const loadSettings = useCallback(async () => {
    try {
      const response = await adminFetch<SiteSettingsResponse>("/api/admin/site/settings/");
      if (response.results.length > 0) {
        const loaded = response.results[0];
        setSettings(loaded);
        setPrimaryColorFa(loaded.design_tokens?.colors?.fa?.primary || "#000000");
        setPrimaryColorEn(loaded.design_tokens?.colors?.en?.primary || "#000000");
      }
    } catch {
      setError("دریافت تنظیمات سایت با خطا مواجه شد.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const saveSettings = async () => {
    if (!settings) return;
    try {
      // Assemble tokens
      const updatedTokens = {
        ...settings.design_tokens,
        colors: {
          fa: { primary: primaryColorFa },
          en: { primary: primaryColorEn }
        }
      };

      const payload = { ...settings, design_tokens: updatedTokens };
      const response = await adminFetch<SiteSettings>(`/api/admin/site/settings/${settings.id}/`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setSettings(response);
      setError(null);
      return response;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError("خطا در ذخیره تنظیمات: " + msg);
      throw e;
    }
  };

  const { isDirty, markDirty, saving, saveError } = useAutosave({
    onSave: saveSettings,
    debounceMs: 2000,
  });
  useDirtyGuard(isDirty);

  const updateField = (field: keyof SiteSettings, value: string | Record<string, unknown>) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
    markDirty();
  };

  if (loading) {
    return <div className="p-8 space-y-4"><Skeleton className="h-8 w-1/4" /><Skeleton className="h-64" /></div>;
  }

  if (error && !settings) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  if (!settings) {
    return <div className="p-8">تنظیمات سایت هنوز ایجاد نشده است.</div>;
  }

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">تنظیمات عمومی سایت (Site Settings)</h1>
          <p className="text-muted-foreground">مدیریت پیکربندی‌های کلی و رنگ‌بندی (Design Tokens).</p>
        </div>
        <div className="flex items-center gap-4">
          {saving && <span className="text-sm text-muted-foreground">در حال ذخیره...</span>}
          {saveError && <span className="text-sm text-red-500">خطا در ذخیره</span>}
          {!saving && !saveError && !isDirty && <span className="text-sm text-green-600">ذخیره شد</span>}
          <Button onClick={() => void saveSettings()} disabled={saving || !isDirty}>ذخیره تغییرات</Button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Core Settings */}
        <div className="space-y-6">
          <div className="space-y-4 border rounded-xl p-6 bg-card text-card-foreground shadow-sm">
            <h2 className="text-lg font-semibold">اطلاعات پایه (فارسی)</h2>
            <div className="space-y-2">
              <Label>عنوان سایت</Label>
              <Input value={settings.site_title_fa} onChange={(e) => updateField("site_title_fa", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>عنوان پیش‌فرض صفحات</Label>
              <Input value={settings.default_title_fa} onChange={(e) => updateField("default_title_fa", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>توضیحات پیش‌فرض (SEO)</Label>
              <Textarea value={settings.default_description_fa} onChange={(e) => updateField("default_description_fa", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>رنگ اصلی (Primary Color)</Label>
              <div className="flex gap-2 items-center">
                <Input type="color" className="w-16 h-10 p-1" value={primaryColorFa} onChange={(e) => { setPrimaryColorFa(e.target.value); markDirty(); }} />
                <Input value={primaryColorFa} onChange={(e) => { setPrimaryColorFa(e.target.value); markDirty(); }} className="flex-1" dir="ltr" />
              </div>
            </div>
          </div>

          <div className="space-y-4 border rounded-xl p-6 bg-card text-card-foreground shadow-sm" dir="ltr">
            <h2 className="text-lg font-semibold text-right" dir="rtl">اطلاعات پایه (انگلیسی)</h2>
            <div className="space-y-2">
              <Label>Site Title</Label>
              <Input value={settings.site_title_en} onChange={(e) => updateField("site_title_en", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Default Title</Label>
              <Input value={settings.default_title_en} onChange={(e) => updateField("default_title_en", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Default Description (SEO)</Label>
              <Textarea value={settings.default_description_en} onChange={(e) => updateField("default_description_en", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex gap-2 items-center">
                <Input type="color" className="w-16 h-10 p-1" value={primaryColorEn} onChange={(e) => { setPrimaryColorEn(e.target.value); markDirty(); }} />
                <Input value={primaryColorEn} onChange={(e) => { setPrimaryColorEn(e.target.value); markDirty(); }} className="flex-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Global Tokens & Extras */}
        <div className="space-y-6">
          <div className="space-y-4 border rounded-xl p-6 bg-card text-card-foreground shadow-sm">
            <h2 className="text-lg font-semibold">توکن‌های طراحی (Design Tokens)</h2>
            <div className="space-y-2">
              <Label>قالب پیش‌فرض (Theme Preset)</Label>
              <Select 
                value={settings.theme_preset} 
                onChange={(e) => updateField("theme_preset", e.target.value)}
                options={[
                  { value: "default", label: "Default" },
                  { value: "minimal", label: "Minimal" },
                  { value: "dark", label: "Dark" }
                ]}
              />
            </div>
            <div className="space-y-2">
              <Label>تراکم (Density)</Label>
              <Select 
                value={settings.density} 
                onChange={(e) => updateField("density", e.target.value)}
                options={[
                  { value: "comfortable", label: "Comfortable" },
                  { value: "compact", label: "Compact" }
                ]}
              />
            </div>
          </div>

          <div className="space-y-4 border rounded-xl p-6 bg-card text-card-foreground shadow-sm">
            <h2 className="text-lg font-semibold">تماس و سایر اطلاعات</h2>
            <div className="space-y-2">
              <Label>ایمیل عمومی (Public Email)</Label>
              <Input type="email" dir="ltr" value={settings.public_email} onChange={(e) => updateField("public_email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>لینک اقدام اصلی (CTA URL)</Label>
              <Input dir="ltr" value={settings.primary_cta_url} onChange={(e) => updateField("primary_cta_url", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>متن پاورقی (فارسی)</Label>
              <Textarea value={settings.footer_text_fa} onChange={(e) => updateField("footer_text_fa", e.target.value)} />
            </div>
            <div className="space-y-2" dir="ltr">
              <Label className="text-right block" dir="rtl">متن پاورقی (انگلیسی)</Label>
              <Textarea value={settings.footer_text_en} onChange={(e) => updateField("footer_text_en", e.target.value)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
