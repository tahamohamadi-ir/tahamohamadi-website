import { cn } from "@/lib/utils";

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "animate-pulse motion-reduce:animate-none rounded-md bg-[hsl(var(--primary)/0.1)]",
                className,
            )}
            {...props}
        />
    );
}

export { Skeleton };
