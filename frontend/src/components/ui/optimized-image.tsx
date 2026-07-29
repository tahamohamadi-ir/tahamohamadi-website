import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

/**
 * OptimizedImage — a wrapper around next/image that enforces
 * responsive sizing, lazy loading (default), and format optimization (WebP/AVIF).
 *
 * For above-the-fold images (hero, LCP candidates), set `priority={true}`
 * to disable lazy loading and preload the image.
 *
 * Usage:
 *   <OptimizedImage src="/media/photo.jpg" alt="Description" fill className="object-cover" />
 *   <OptimizedImage src="/media/thumb.jpg" alt="..." width={400} height={300} />
 *   <OptimizedImage src="/media/hero.jpg" alt="Hero" fill priority />
 */

export interface OptimizedImageProps extends Omit<ImageProps, "loading"> {
    /** Override lazy loading behavior. Defaults to "lazy" unless priority is set. */
    loading?: "lazy" | "eager";
}

export function OptimizedImage({
    className,
    sizes,
    quality,
    loading,
    ...props
}: OptimizedImageProps) {
    // Default responsive sizes if not provided and using fill mode
    const defaultSizes =
        "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

    return (
        <Image
            className={cn("transition-opacity duration-300 motion-reduce:transition-none", className)}
            sizes={sizes ?? defaultSizes}
            quality={quality ?? 80}
            loading={props.priority ? undefined : (loading ?? "lazy")}
            {...props}
        />
    );
}
