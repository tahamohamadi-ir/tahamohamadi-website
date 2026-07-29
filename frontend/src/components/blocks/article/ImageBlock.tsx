import type { BlockComponentProps, ImageContent } from "../types";

export function ImageBlock({ data }: BlockComponentProps<ImageContent>) {
    return (
        <figure className="w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={data.url}
                alt={data.alt ?? ""}
                width={data.width}
                height={data.height}
                className="h-auto w-full rounded-lg"
                loading="lazy"
            />
            {data.caption && (
                <figcaption className="mt-2 text-center text-sm text-muted-foreground">
                    {data.caption}
                </figcaption>
            )}
        </figure>
    );
}
