import type { BlockType } from "./types";

const animationDefaults = {
  duration: 600,
  delay: 0,
  easing: "ease-out",
  trigger: "scroll",
};

const BLOCK_DEFAULTS: Record<BlockType, Record<string, unknown>> = {
  hero: {
    heading_fa: "",
    heading_en: "",
    subheading_fa: "",
    subheading_en: "",
    cta_text_fa: "",
    cta_text_en: "",
    cta_link: "",
    media_id: null,
  },
  text: { body_fa: "", body_en: "", alignment: "start" },
  gallery: { media_ids: [], layout: "grid" },
  cta: { label: "", url: "/", variant: "primary" },
  collection: { source: "portfolio", filter: {}, limit: 6, order: "default" },
  quote: { text: "", attribution: null },
  divider: { style: "line" },
  research_focus: { title: "", description: "", icon: null },
  scroll_reveal: {
    title: "",
    description: null,
    direction: "up",
    ...animationDefaults,
  },
  parallax: {
    title: "",
    subtitle: null,
    media_url: null,
    speed: 0.5,
    ...animationDefaults,
  },
  text_stagger: { content: "", stagger_delay: 50, ...animationDefaults },
  fade_in_sequence: { items: [], ...animationDefaults },
  hover_card: {
    title: "",
    description: "",
    icon: null,
    hover_effect: "lift",
    ...animationDefaults,
  },
  counter_animation: {
    label: "",
    target_number: 0,
    suffix: null,
    ...animationDefaults,
  },
  image_reveal: {
    media_url: "",
    alt: null,
    reveal_direction: "left",
    ...animationDefaults,
  },
  section_transition: { transition_type: "fade", ...animationDefaults },
};

export function createBlockSettings(blockType: BlockType): Record<string, unknown> {
  return structuredClone(BLOCK_DEFAULTS[blockType]);
}
