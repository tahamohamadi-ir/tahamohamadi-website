import { Label } from "@/components/ui/label";

interface VariantSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

export function VariantSelector({ value, onChange }: VariantSelectorProps) {
    const variants = [
        {
            id: "default",
            name: "پیش‌فرض",
            description: "قالب استاندارد با حاشیه‌های متداول.",
            icon: (
                <div className="flex h-full w-full gap-1 p-1">
                    <div className="w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="w-3/4 rounded bg-gray-300 dark:bg-gray-600" />
                </div>
            )
        },
        {
            id: "full-width",
            name: "تمام‌عرض",
            description: "بدون سایدبار، مناسب برای محتوای طولانی.",
            icon: (
                <div className="flex h-full w-full p-1">
                    <div className="w-full rounded bg-gray-300 dark:bg-gray-600" />
                </div>
            )
        },
        {
            id: "landing",
            name: "لندینگ",
            description: "بدون کانتینر، مناسب برای هدرهای عریض.",
            icon: (
                <div className="flex h-full w-full flex-col gap-1 p-1">
                    <div className="h-1/3 w-full rounded bg-blue-500" />
                    <div className="flex-1 rounded bg-gray-300 dark:bg-gray-600" />
                </div>
            )
        }
    ];

    return (
        <div className="space-y-2 lg:col-span-3">
            <Label>انتخاب ظاهر صفحه (Variant)</Label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {variants.map((v) => (
                    <div
                        key={v.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onChange(v.id)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onChange(v.id); }}
                        className={`flex cursor-pointer flex-col overflow-hidden rounded-md border-2 transition-all hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                            value === v.id ? "border-primary bg-primary/5" : "border-muted bg-background"
                        }`}
                        aria-pressed={value === v.id}
                    >
                        <div className="flex h-20 w-full items-center justify-center border-b bg-muted/50 p-2">
                            {v.icon}
                        </div>
                        <div className="p-3">
                            <p className="text-sm font-semibold leading-none">{v.name}</p>
                            <p className="mt-1.5 text-xs text-muted-foreground">{v.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
