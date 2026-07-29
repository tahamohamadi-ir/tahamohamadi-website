import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/i18n";

/**
 * Root page redirects to the default locale.
 * In practice, the middleware handles this redirect for most requests,
 * but this serves as a fallback for direct SSR access.
 */
export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
