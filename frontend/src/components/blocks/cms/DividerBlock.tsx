import { cn } from "@/lib/utils";
import type { BlockComponentProps, DividerSettings } from "../types";

export function DividerBlock({ data }: BlockComponentProps<DividerSettings>) {
    const style = data.style ?? "line";

    if (style === "space") {
        return <div className="h-8 md:h-12" aria-hidden="true" />;
    }

    if (style === "dots") {
        return (
            <div className="flex items-center justify-center py-6" aria-hidden="true">
                <span className="mx-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                <span className="mx-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                <span className="mx-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
            </div>
        );
    }

    return (
        <hr
            className={cn("my-8 border-t border-border")}
            aria-hidden="true"
        />
    );
}
