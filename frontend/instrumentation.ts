import * as Sentry from "@sentry/nextjs";

/** Initialize Sentry in the runtime selected by Next.js at server startup. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./instrumentation-edge");
  }
}

export const onRequestError = Sentry.captureRequestError;
