"use client";

import { useEffect, useMemo, useState } from "react";

import { adminFetch, formatAdminError } from "@/lib/admin-fetch";
import type { ComposerSection } from "./types";
import { createTemplateManifest, type TemplateManifest } from "./template-store";

const IMPORT_URL = "/api/admin/pages/templates/import/";
const UUID_PATTERN = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;

export interface TemplatePageIdentity {
    slug_fa: string;
    slug_en: string;
    title_fa: string;
    title_en: string;
    page_type: string;
}

interface TemplateImportResponse {
    valid: true;
    manifest: TemplateManifest;
    page?: { id: string; status: string };
}

export interface TemplatePanelProps {
    sections: ComposerSection[];
    initialIdentity: TemplatePageIdentity;
    onImported: (pageId: string) => void;
}

function safeTemplateError(error: unknown, action: string): string {
    return formatAdminError(error, action).replace(UUID_PATTERN, "media reference");
}

export function TemplatePanel({ sections, initialIdentity, onImported }: TemplatePanelProps) {
    const [manifestText, setManifestText] = useState("");
    const [identity, setIdentity] = useState(initialIdentity);
    const [validatedManifest, setValidatedManifest] = useState<TemplateManifest | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => setIdentity(initialIdentity), [initialIdentity]);

    const identityComplete = useMemo(
        () => Object.values(identity).every((value) => value.trim().length > 0),
        [identity],
    );

    function invalidateDryRun(): void {
        setValidatedManifest(null);
        setMessage(null);
        setError(null);
    }

    function exportManifest(): void {
        const text = JSON.stringify(createTemplateManifest(sections), null, 2);
        setManifestText(text);
        invalidateDryRun();
    }

    function updateIdentity(field: keyof TemplatePageIdentity, value: string): void {
        setIdentity((current) => ({ ...current, [field]: value }));
        invalidateDryRun();
    }

    async function uploadManifest(file: File | undefined): Promise<void> {
        if (!file) return;
        setManifestText(await file.text());
        invalidateDryRun();
    }

    function parseManifest(): Record<string, unknown> | null {
        try {
            const parsed: unknown = JSON.parse(manifestText);
            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                throw new Error("Manifest must be a JSON object.");
            }
            return parsed as Record<string, unknown>;
        } catch (parseError) {
            setError(safeTemplateError(parseError, "Manifest parsing"));
            return null;
        }
    }

    async function validateImport(): Promise<void> {
        const manifest = parseManifest();
        if (!manifest) return;
        setBusy(true);
        setError(null);
        setMessage(null);
        setValidatedManifest(null);
        try {
            const response = await adminFetch<TemplateImportResponse>(IMPORT_URL, {
                method: "POST",
                body: JSON.stringify({ manifest, dry_run: true, ...identity }),
            });
            setValidatedManifest(response.manifest);
            setMessage("Server validation passed. No content was created.");
        } catch (requestError) {
            setError(safeTemplateError(requestError, "Template validation"));
        } finally {
            setBusy(false);
        }
    }

    async function confirmImport(): Promise<void> {
        if (!validatedManifest) return;
        setBusy(true);
        setError(null);
        try {
            const response = await adminFetch<TemplateImportResponse>(IMPORT_URL, {
                method: "POST",
                body: JSON.stringify({ manifest: validatedManifest, dry_run: false, ...identity }),
            });
            if (!response.page || response.page.status !== "draft") {
                throw new Error("The server did not return a new Draft page.");
            }
            onImported(response.page.id);
        } catch (requestError) {
            setError(safeTemplateError(requestError, "Draft import"));
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="space-y-3" aria-label="Portable templates">
            <div>
                <h2 className="text-sm font-semibold text-gray-900">Portable template</h2>
                <p className="mt-1 text-xs text-gray-600">Imports always create a separate Draft page.</p>
            </div>
            <button type="button" className="w-full rounded border bg-white px-3 py-2 text-sm" onClick={exportManifest}>
                Export manifest
            </button>
            {manifestText && (
                <a
                    className="block text-center text-xs font-medium text-blue-700 underline"
                    download="composer-template.json"
                    href={`data:application/json;charset=utf-8,${encodeURIComponent(manifestText)}`}
                >
                    Download JSON
                </a>
            )}
            <label className="block text-xs font-medium text-gray-700">
                Template manifest
                <textarea
                    className="mt-1 min-h-28 w-full rounded border p-2 font-mono text-xs"
                    value={manifestText}
                    onChange={(event) => { setManifestText(event.target.value); invalidateDryRun(); }}
                />
            </label>
            <label className="block text-xs font-medium text-gray-700">
                Upload manifest
                <input
                    className="mt-1 block w-full text-xs"
                    type="file"
                    accept="application/json,.json"
                    onChange={(event) => void uploadManifest(event.target.files?.[0])}
                />
            </label>
            {(
                [
                    ["title_fa", "Draft title (FA)"],
                    ["title_en", "Draft title (EN)"],
                    ["slug_fa", "Draft slug (FA)"],
                    ["slug_en", "Draft slug (EN)"],
                ] as const
            ).map(([field, label]) => (
                <label key={field} className="block text-xs font-medium text-gray-700">
                    {label}
                    <input
                        className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                        dir={field.endsWith("_fa") ? "rtl" : "ltr"}
                        value={identity[field]}
                        onChange={(event) => updateIdentity(field, event.target.value)}
                    />
                </label>
            ))}
            <label className="block text-xs font-medium text-gray-700">
                Page type
                <select
                    className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                    value={identity.page_type}
                    onChange={(event) => updateIdentity("page_type", event.target.value)}
                >
                    <option value="custom">Custom</option>
                    <option value="home">Home</option>
                </select>
            </label>
            {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
            {message && <p role="status" className="text-xs text-green-700">{message}</p>}
            <button
                type="button"
                className="w-full rounded bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50"
                disabled={busy || !manifestText.trim() || !identityComplete}
                onClick={() => void validateImport()}
            >
                Validate import
            </button>
            {validatedManifest && (
                <button
                    type="button"
                    className="w-full rounded bg-blue-700 px-3 py-2 text-sm text-white disabled:opacity-50"
                    disabled={busy}
                    onClick={() => void confirmImport()}
                >
                    Confirm Draft import
                </button>
            )}
        </section>
    );
}
