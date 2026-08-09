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
    if (/(media|uuid)/.test(field) || /uuid|active media|media asset/.test(normalized)) {
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

function addFieldMessage(
    fields: Record<string, string[]>,
    field: string,
    serverMessage: string,
) {
    const message = safeMessage(field, serverMessage);
    fields[field] = [...new Set([...(fields[field] ?? []), message])];
}

function collectCompositionIssues(
    composition: unknown,
    issuesByBlock: Map<string, ComposerValidationIssue>,
) {
    if (!Array.isArray(composition)) return;

    composition.forEach((item) => {
        if (typeof item !== "string") return;
        const match = item.match(
            /^sections\[(\d+)]\.blocks\[(\d+)](?:\.settings(?:\.([a-z][a-z0-9_]*))?)?:\s*(.*)$/i,
        );
        if (!match) return;

        const sectionIndex = Number(match[1]);
        const blockIndex = Number(match[2]);
        const detail = match[4].replace(/^\(root\):\s*/, "");
        const urlField = detail.match(/unsafe\s+url\s+in\s+([a-z][a-z0-9_]*)/i)?.[1];
        const field = match[3]
            ?? urlField
            ?? (/media\s+(?:asset|uuid)/i.test(detail) ? "_block" : inferField([], detail));
        const key = `${sectionIndex}:${blockIndex}`;
        const issue = issuesByBlock.get(key) ?? { sectionIndex, blockIndex, fields: {} };
        addFieldMessage(issue.fields, field, detail);
        issuesByBlock.set(key, issue);
    });
}

export function extractComposerValidationIssues(error: unknown): ComposerValidationIssue[] {
    if (!(error instanceof AdminApiError)) return [];
    const errors = error.body.errors;
    if (!errors || typeof errors !== "object") return [];
    const issuesByBlock = new Map<string, ComposerValidationIssue>();
    const sections = (errors as { sections?: unknown }).sections;
    if (Array.isArray(sections)) sections.forEach((section, sectionIndex) => {
        if (!section || typeof section !== "object") return;
        const blocks = (section as { blocks?: unknown }).blocks;
        if (!Array.isArray(blocks)) return;
        blocks.forEach((block, blockIndex) => {
            if (!block || typeof block !== "object") return;
            const settings = (block as { settings?: unknown }).settings;
            if (settings === undefined) return;
            const fields: Record<string, string[]> = {};
            collectMessages(settings, fields);
            if (Object.keys(fields).length > 0) {
                issuesByBlock.set(`${sectionIndex}:${blockIndex}`, { sectionIndex, blockIndex, fields });
            }
        });
    });
    collectCompositionIssues((errors as { composition?: unknown }).composition, issuesByBlock);
    return [...issuesByBlock.values()];
}
