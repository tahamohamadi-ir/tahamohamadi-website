"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="container mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>
          <p className="mt-3 text-muted-foreground">Please try again. If the problem persists, return later.</p>
          <button
            type="button"
            onClick={reset}
            className="mx-auto mt-7 min-h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
