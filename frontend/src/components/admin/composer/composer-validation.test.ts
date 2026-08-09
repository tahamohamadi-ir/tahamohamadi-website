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

    it("maps flat composition errors to the affected block without exposing UUIDs or URLs", () => {
        const missingMediaId = "11111111-2222-4333-8444-555555555555";
        const unsafeUrl = "javascript:alert(document.cookie)";
        const error = new AdminApiError(400, {
            detail: "Page composition validation failed.",
            errors: {
                composition: [
                    `sections[1].blocks[2]: media asset '${missingMediaId}' not found`,
                    `sections[1].blocks[2]: unsafe URL in cta_url '${unsafeUrl}'`,
                ],
            },
        });

        const issues = extractComposerValidationIssues(error);

        expect(issues).toEqual([
            {
                sectionIndex: 1,
                blockIndex: 2,
                fields: {
                    _block: ["Choose an active media item."],
                    cta_url: ["Enter a safe internal path or HTTPS URL."],
                },
            },
        ]);
        expect(JSON.stringify(issues)).not.toContain(missingMediaId);
        expect(JSON.stringify(issues)).not.toContain(unsafeUrl);
    });
});
