import type { Locale } from "@/components/blocks/types";
import type { BlockType } from "./types";

export function projectSettingsForLocale(
  blockType: BlockType,
  settings: Record<string, unknown>,
  locale: Locale,
): Record<string, unknown> {
  if (blockType === "hero" && ("heading_fa" in settings || "heading_en" in settings)) {
    return {
      title: settings[`heading_${locale}`],
      subtitle: settings[`subheading_${locale}`],
      cta_label: settings[`cta_text_${locale}`],
      cta_url: settings.cta_link,
      media_id: settings.media_id,
    };
  }

  if (blockType === "text" && ("body_fa" in settings || "body_en" in settings)) {
    return {
      content: settings[`body_${locale}`],
      alignment: settings.alignment ?? "start",
    };
  }

  return settings;
}
