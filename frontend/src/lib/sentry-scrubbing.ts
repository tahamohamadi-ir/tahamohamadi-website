import type { Event } from "@sentry/core";

const FILTERED = "[Filtered]";
const SENSITIVE_KEY =
  /authorization|cookie|csrf|password|passwd|secret|token|api[_-]?key|email|phone|mobile|reference|content|body|data|message|value/i;

function scrubValue(value: unknown, key?: string): unknown {
  if (key && SENSITIVE_KEY.test(key)) {
    return FILTERED;
  }

  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        scrubValue(entryValue, entryKey),
      ]),
    );
  }

  return value;
}

/**
 * Removes private identity and content data before a Sentry event leaves the app.
 */
export function scrubSentryEvent<T extends Event>(event: T): T {
  const scrubbed = scrubValue(event) as T;

  if (scrubbed.request?.url) {
    scrubbed.request.url = scrubbed.request.url.split("?", 1)[0];
  }

  scrubbed.user = undefined;
  return scrubbed;
}
