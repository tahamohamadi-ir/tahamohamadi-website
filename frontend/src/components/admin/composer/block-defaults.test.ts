import { describe, expect, it } from "vitest";
import { createBlockSettings } from "./block-defaults";

describe("animation block defaults", () => {
  it("uses MediaAsset references rather than persisted media URLs", () => {
    const parallax = createBlockSettings("parallax");
    const imageReveal = createBlockSettings("image_reveal");

    expect(parallax).toMatchObject({ media_id: null });
    expect(imageReveal).toMatchObject({ media_id: null });
    expect(parallax).not.toHaveProperty("media_url");
    expect(imageReveal).not.toHaveProperty("media_url");
  });
});
