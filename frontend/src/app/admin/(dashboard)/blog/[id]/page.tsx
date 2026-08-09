"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArticleEditor } from "@/components/admin/editor";
import { adminFetch } from "@/lib/admin-fetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import type { EditorArticle, ArticleBlock } from "@/components/admin/editor/types";
import type { MediaAssetDTO } from "@/lib/types/media";

export default function ArticleEditorPage() {
    const params = useParams();
    const router = useRouter();
    const articleId = params.id as string;

    const [article, setArticle] = useState<EditorArticle | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [locale, setLocale] = useState<"fa" | "en">("fa");
    const [previewBlocks, setPreviewBlocks] = useState<ArticleBlock[]>([]);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [editorWarnings, setEditorWarnings] = useState<string[]>([]);

    useEffect(() => {
        if (articleId === "new") {
            setArticle({
                blocks: [],
                title_fa: "",
                title_en: "",
                slug_fa: "",
                slug_en: "",
                excerpt_fa: "",
                excerpt_en: "",
                status: "draft",
            });
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

    useEffect(() => {
        if (editorWarnings.length === 0) return;
        const preventUnsafeNavigation = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", preventUnsafeNavigation);
        return () => window.removeEventListener("beforeunload", preventUnsafeNavigation);
    }, [editorWarnings]);

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

                const payload = {
                    title_fa: article.title_fa ?? "",
                    title_en: article.title_en ?? "",
                    slug_fa: article.slug_fa ?? "",
                    slug_en: article.slug_en ?? "",
                    excerpt_fa: article.excerpt_fa ?? "",
                    excerpt_en: article.excerpt_en ?? "",
                    status: article.status ?? "draft",
                    ...(articleId === "new" ? {} : { version: article.version }),
                    blocks,
                };
                const saved = await adminFetch<EditorArticle>(endpoint, {
                    method,
                    body: JSON.stringify(payload),
                });
                if (articleId === "new") {
                    router.push("/admin/blog");
                } else {
                    setArticle(saved);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Save failed");
            } finally {
                setSaving(false);
            }
        },
        [article, articleId, router]
    );

    const handlePreview = useCallback(
        async (blocks: ArticleBlock[]) => {
            setPreviewError(null);
            const mediaIds = Array.from(
                new Set(
                    blocks.flatMap((block) => {
                        if (block.block_type === "image") {
                            return typeof block.content.media_id === "string"
                                ? [block.content.media_id]
                                : [];
                        }
                        if (block.block_type === "gallery") {
                            return Array.isArray(block.content.media_ids)
                                ? block.content.media_ids.filter(
                                    (mediaId): mediaId is string => typeof mediaId === "string"
                                )
                                : [];
                        }
                        return [];
                    })
                )
            );

            try {
                const assets = await Promise.all(
                    mediaIds.map((mediaId) =>
                        adminFetch<MediaAssetDTO>(`/api/admin/media/${mediaId}/`)
                    )
                );
                const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
                setPreviewBlocks(
                    blocks.flatMap((block) => {
                        const projected = projectPreviewBlock(block, locale, assetsById);
                        return projected ? [projected] : [];
                    })
                );
            } catch (err) {
                setPreviewBlocks([]);
                setPreviewError(err instanceof Error ? err.message : "Preview media could not be loaded");
            }
        },
        [locale]
    );

    const updateField = (field: keyof EditorArticle, value: string) => {
        setArticle((current) => current ? { ...current, [field]: value } : current);
    };

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
                        aria-label="Editing locale"
                        disabled={editorWarnings.length > 0}
                        value={locale}
                        onChange={(e) => setLocale(e.target.value as "fa" | "en")}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                    >
                        <option value="fa">فارسی</option>
                        <option value="en">English</option>
                    </select>
                    <Button
                        aria-label="Back to articles"
                        variant="outline"
                        disabled={editorWarnings.length > 0}
                        onClick={() => router.push("/admin/blog")}
                    >
                        بازگشت
                    </Button>
                </div>
            </div>

            {article && (
                <section aria-label="Article metadata" className="grid gap-4 rounded-lg border bg-white p-4 md:grid-cols-2">
                    <label className="space-y-1 text-sm">
                        <span>Persian title</span>
                        <Input value={article.title_fa ?? ""} onChange={(event) => updateField("title_fa", event.target.value)} />
                    </label>
                    <label className="space-y-1 text-sm">
                        <span>English title</span>
                        <Input value={article.title_en ?? ""} onChange={(event) => updateField("title_en", event.target.value)} />
                    </label>
                    <label className="space-y-1 text-sm">
                        <span>Persian slug</span>
                        <Input value={article.slug_fa ?? ""} onChange={(event) => updateField("slug_fa", event.target.value)} />
                    </label>
                    <label className="space-y-1 text-sm">
                        <span>English slug</span>
                        <Input value={article.slug_en ?? ""} onChange={(event) => updateField("slug_en", event.target.value)} />
                    </label>
                    <label className="space-y-1 text-sm md:col-span-2">
                        <span>Article status</span>
                        <select
                            value={article.status ?? "draft"}
                            onChange={(event) => updateField("status", event.target.value)}
                            className="block w-full rounded-md border border-input bg-background px-3 py-2"
                        >
                            <option value="draft">Draft</option>
                            <option value="in_review">In review</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="published">Published</option>
                            <option value="archived">Archived</option>
                        </select>
                    </label>
                </section>
            )}

            <div className="rounded-lg border bg-white p-4">
                <ArticleEditor
                    article={article}
                    locale={locale}
                    onSave={handleSave}
                    onPreview={handlePreview}
                    onWarningsChange={setEditorWarnings}
                />
            </div>

            {previewError && <p role="alert" className="text-sm text-red-700">{previewError}</p>}

            {previewBlocks.length > 0 && (
                <section role="region" aria-label="Article preview" className="space-y-6 rounded-lg border bg-white p-6">
                    {previewBlocks.map((block) => (
                        <BlockRenderer
                            key={block.id ?? `${block.locale}-${block.ordering}`}
                            block={{
                                id: block.id ?? `${block.locale}-${block.ordering}`,
                                block_type: block.block_type,
                                content: block.content,
                                ordering: block.ordering,
                            }}
                            locale={locale}
                            context="article"
                        />
                    ))}
                </section>
            )}
        </div>
    );
}

function projectPreviewBlock(
    block: ArticleBlock,
    locale: "fa" | "en",
    assetsById: Map<string, MediaAssetDTO>
): ArticleBlock | null {
    if (block.block_type === "image" && typeof block.content.media_id === "string") {
        const asset = assetsById.get(block.content.media_id);
        if (!asset || asset.status !== "active") return null;
        return {
            ...block,
            content: {
                ...block.content,
                url: asset.file ?? "",
                alt: locale === "fa" ? asset.alt_text_fa : asset.alt_text_en,
                caption: locale === "fa" ? asset.caption_fa : asset.caption_en,
                width: asset.width ?? undefined,
                height: asset.height ?? undefined,
            },
        };
    }
    if (block.block_type === "gallery" && Array.isArray(block.content.media_ids)) {
        const mediaIds = block.content.media_ids.filter(
            (mediaId): mediaId is string => typeof mediaId === "string"
        );
        const assets = mediaIds.map((mediaId) => assetsById.get(mediaId));
        const activeAssets = assets.filter(
            (asset): asset is MediaAssetDTO => Boolean(asset && asset.status === "active")
        );
        if (activeAssets.length !== mediaIds.length) return null;
        return {
            ...block,
            content: {
                ...block.content,
                items: activeAssets.map((asset) => ({
                    media_id: asset.id,
                    url: asset.file ?? "",
                    alt: locale === "fa" ? asset.alt_text_fa : asset.alt_text_en,
                    caption: locale === "fa" ? asset.caption_fa : asset.caption_en,
                })),
            },
        };
    }
    return block;
}
