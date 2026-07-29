import { describe, expect, it } from "vitest";
import type { Event } from "@sentry/core";

import { scrubSentryEvent } from "./sentry-scrubbing";

describe("scrubSentryEvent", () => {
  it("removes identity, content, credentials, and query strings", () => {
    const event: Event = {
      message: "private failure details",
      user: { id: "user-1", email: "person@example.test" },
      request: {
        url: "https://tahamohamadi.ir/fa/blog?q=private",
        headers: { authorization: "Bearer secret", accept: "application/json" },
        data: { content: "private manuscript", safe: "not retained with request data" },
      },
      extra: {
        phone: "+98-000-000-0000",
        nested: { token: "secret-token", safe: "kept" },
      },
    };

    const scrubbed = scrubSentryEvent(event);

    expect(scrubbed).not.toBe(event);
    expect(scrubbed.message).toBe("[Filtered]");
    expect(scrubbed.user).toBeUndefined();
    expect(scrubbed.request?.url).toBe("https://tahamohamadi.ir/fa/blog");
    expect(scrubbed.request?.headers).toMatchObject({
      authorization: "[Filtered]",
      accept: "application/json",
    });
    expect(scrubbed.request?.data).toBe("[Filtered]");
    expect(scrubbed.extra).toEqual({
      phone: "[Filtered]",
      nested: { token: "[Filtered]", safe: "kept" },
    });
  });
});
