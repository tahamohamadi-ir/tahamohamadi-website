interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocaleHomePage({ params }: LocalePageProps) {
  const { locale } = await params;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">
        {locale === "fa" ? "صفحه اصلی" : "Home"}
      </h1>
      <p className="mt-4 text-lg text-gray-600">
        {locale === "fa"
          ? "به وبسایت طاها محمدی خوش آمدید"
          : "Welcome to Taha Mohamadi's website"}
      </p>
    </main>
  );
}
