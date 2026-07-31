import { describe, expect, it } from "vitest";

import { AdminApiError, formatAdminError } from "./admin-fetch";

describe("formatAdminError", () => {
  it("turns nested composer validation errors into a concise actionable message", () => {
    const error = new AdminApiError(422, {
      detail: "One or more fields are invalid.",
      errors: {
        sections: [
          {
            blocks: [
              {
                settings: [
                  "(root): 'title' is a required property",
                  "(root): Additional properties are not allowed ('heading_fa' was unexpected)",
                ],
              },
            ],
          },
        ],
      },
    });

    const message = formatAdminError(error, "ذخیره صفحه");

    expect(message).toContain("ذخیره صفحه انجام نشد");
    expect(message).toContain("بخش ۱، بلاک ۱");
    expect(message).toContain("'title' is a required property");
    expect(message).not.toContain("API error 422");
    expect(message).not.toContain("{\"type\"");
  });

  it("uses a clear conflict message for optimistic locking", () => {
    expect(formatAdminError(new AdminApiError(409, {}), "ذخیره صفحه")).toContain(
      "نسخه جدیدتری",
    );
  });
});
