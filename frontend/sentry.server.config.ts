// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "./src/lib/sentry-scrubbing";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Only initialize if DSN is provided
    enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    sendDefaultPii: false,
    beforeSend: scrubSentryEvent,

    // Capture 10% of transactions for performance monitoring in production
    tracesSampleRate: 0.1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
});
