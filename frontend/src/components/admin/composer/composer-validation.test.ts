import { describe, expect, it } from "vitest";

import { AdminApiError } from "@/lib/admin-fetch";
import { extractComposerValidationIssues } from "./composer-validation";

describe("extractComposerValidationIssues", () => {
    it("maps nested Problem Details settings errors without exposing server text or identifiers", () => {
        const error = new AdminApiError(422, {
            detail: "One or more fields are invalid.",
            errors: {
                sections: [
                    {
                        blocks: [
                            {
                                settings: [
                                    "(root): 'title' is a required property",
                                    "cta_url: 'javascript:alert(1)' is not allowed",
                                ],
                            },
                        ],
                    },
                ],
            },
        });

        expect(extractComposerValidationIssues(error)).toEqual([
            {
                sectionIndex: 0,
                blockIndex: 0,
                fields: {
                    title: ["This field is required."],
                    cta_url: ["Enter a safe internal path or HTTPS URL."],
                },
            },
        ]);
    });
});
