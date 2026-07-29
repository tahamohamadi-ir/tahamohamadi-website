import type { BlockComponentProps, CodeContent } from "../types";

export function CodeBlock({ data }: BlockComponentProps<CodeContent>) {
    return (
        <div className="w-full overflow-hidden rounded-lg border border-border bg-muted">
            {(data.filename || data.language) && (
                <div className="flex items-center border-b border-border bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
                    {data.filename && <span>{data.filename}</span>}
                    {data.filename && data.language && <span className="mx-2">·</span>}
                    {data.language && <span>{data.language}</span>}
                </div>
            )}
            <pre className="overflow-x-auto p-4">
                <code className="text-sm leading-relaxed">{data.code}</code>
            </pre>
        </div>
    );
}
