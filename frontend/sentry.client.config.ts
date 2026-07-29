// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
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

    // Replay is useful for debugging but has performance overhead — keep sampling low
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.01,

    integrations: [
        Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
        }),
    ],
});
