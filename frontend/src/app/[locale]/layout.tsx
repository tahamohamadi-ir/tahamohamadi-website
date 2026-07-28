import type { Metadata } from "next";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title:
      locale === "fa" ? "طاها محمدی — وبسایت شخصی" : "Taha Mohamadi — Personal Website",
    description:
      locale === "fa"
        ? "وبسایت شخصی، بلاگ، نمونه‌کارها و رزومه طاها محمدی"
        : "Personal website, blog, portfolio and resume of Taha Mohamadi",
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  const direction = locale === "fa" ? "rtl" : "ltr";

  return (
    <div dir={direction} lang={locale}>
      {children}
    </div>
  );
}
