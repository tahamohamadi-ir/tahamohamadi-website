import type { BlockComponentProps, CaptionContent } from "../types";

export function CaptionBlock({ data }: BlockComponentProps<CaptionContent>) {
    return (
        <p className="text-center text-sm italic text-muted-foreground">
            {data.text}
        </p>
    );
}
