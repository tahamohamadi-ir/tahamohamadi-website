import { AdminApiError } from "@/lib/admin-fetch";

export interface ComposerValidationIssue {
    sectionIndex: number;
    blockIndex: number;
    fields: Record<string, string[]>;
}

function inferField(path: string[], message: string): string {
    const pathField = [...path].reverse().find((part) => /^[a-z][a-z0-9_]*$/i.test(part));
    if (pathField) return pathField;
    const prefixed = message.match(/^([a-z][a-z0-9_]*)\s*:/i)?.[1];
    if (prefixed) return prefixed;
    return message.match(/["']([a-z][a-z0-9_]*)["']\s+is\s+(?:a\s+)?required/i)?.[1] ?? "_block";
}

function safeMessage(field: string, serverMessage: string): string {
    const normalized = serverMessage.toLowerCase();
    if (/(url|link)/.test(field) && /(not allowed|unsafe|https|internal)/.test(normalized)) {
        return "Enter a safe internal path or HTTPS URL.";
    }
    if (/required/.test(normalized)) return "This field is required.";
    if (/(media|uuid)/.test(field) || /uuid|active media/.test(normalized)) {
        return "Choose an active media item.";
    }
    if (/additional propert|unsupported|unknown/.test(normalized)) return "Remove unsupported settings.";
    if (/enum|one of|allowed/.test(normalized)) return "Choose an allowed value.";
    if (/type|integer|number|string|array|object/.test(normalized)) return "Enter a valid value.";
    return "Review this field.";
}

function collectMessages(
    value: unknown,
    fields: Record<string, string[]>,
    path: string[] = [],
) {
    if (typeof value === "string") {
        const field = inferField(path, value.replace(/^\(root\):\s*/, ""));
        const message = safeMessage(field, value);
        fields[field] = [...new Set([...(fields[field] ?? []), message])];
        return;
    }
    if (Array.isArray(value)) {
        value.forEach((item) => collectMessages(item, fields, path));
        return;
    }
    if (value && typeof value === "object") {
        Object.entries(value).forEach(([key, item]) => collectMessages(item, fields, [...path, key]));
    }
}

export function extractComposerValidationIssues(error: unknown): ComposerValidationIssue[] {
    if (!(error instanceof AdminApiError)) return [];
    const errors = error.body.errors;
    if (!errors || typeof errors !== "object") return [];
    const sections = (errors as { sections?: unknown }).sections;
    if (!Array.isArray(sections)) return [];

    const issues: ComposerValidationIssue[] = [];
    sections.forEach((section, sectionIndex) => {
        if (!section || typeof section !== "object") return;
        const blocks = (section as { blocks?: unknown }).blocks;
        if (!Array.isArray(blocks)) return;
        blocks.forEach((block, blockIndex) => {
            if (!block || typeof block !== "object") return;
            const settings = (block as { settings?: unknown }).settings;
            if (settings === undefined) return;
            const fields: Record<string, string[]> = {};
            collectMessages(settings, fields);
            if (Object.keys(fields).length > 0) issues.push({ sectionIndex, blockIndex, fields });
        });
    });
    return issues;
}
