import type { BlockComponentProps, DividerSettings } from "../types";

/**
 * Article-level divider block.
 * Provides visual separation between article sections.
 */
export function ArticleDividerBlock({ data }: BlockComponentProps<DividerSettings>) {
    const style = data.style ?? "line";

    if (style === "space") {
        return <div className="h-6 md:h-8" aria-hidden="true" />;
    }

    if (style === "dots") {
        return (
            <div className="flex items-center justify-center py-4" aria-hidden="true">
                <span className="mx-1 h-1 w-1 rounded-full bg-muted-foreground/40" />
                <span className="mx-1 h-1 w-1 rounded-full bg-muted-foreground/40" />
                <span className="mx-1 h-1 w-1 rounded-full bg-muted-foreground/40" />
            </div>
        );
    }

    return <hr className="my-6 border-t border-border" aria-hidden="true" />;
}
