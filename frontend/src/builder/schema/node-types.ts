/**
 * Node Type Constants — Namespaced Component Types
 *
 * All component types use a namespace.name convention to avoid collisions
 * and enable category-based filtering.
 *
 * @module builder/schema/node-types
 */

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

export const NODE_TYPES = {
  // Core
  PAGE: 'core.page',

  // Layout
  SECTION: 'layout.section',
  CONTAINER: 'layout.container',
  BOX: 'layout.box',
  STACK: 'layout.stack',
  FLEX: 'layout.flex',
  GRID: 'layout.grid',
  COLUMNS: 'layout.columns',
  SPACER: 'layout.spacer',
  DIVIDER: 'layout.divider',

  // Content / Typography
  HEADING: 'content.heading',
  TEXT: 'content.text',
  PARAGRAPH: 'content.paragraph',
  RICH_TEXT: 'content.richtext',
  BLOCKQUOTE: 'content.blockquote',
  LIST: 'content.list',
  CODE_BLOCK: 'content.codeblock',

  // Media
  IMAGE: 'media.image',
  VIDEO: 'media.video',
  GALLERY: 'media.gallery',
  ICON: 'media.icon',
  AVATAR: 'media.avatar',

  // UI
  BUTTON: 'ui.button',
  ICON_BUTTON: 'ui.icon-button',
  CARD: 'ui.card',
  TABS: 'ui.tabs',
  ACCORDION: 'ui.accordion',
  MODAL: 'ui.modal',
  TOOLTIP: 'ui.tooltip',
  DROPDOWN: 'ui.dropdown',
  BADGE: 'ui.badge',

  // Navigation
  NAVBAR: 'navigation.navbar',
  BREADCRUMB: 'navigation.breadcrumb',
  FOOTER: 'navigation.footer',

  // Forms
  FORM: 'form.form',
  INPUT: 'form.input',
  TEXTAREA: 'form.textarea',
  SELECT: 'form.select',
  CHECKBOX: 'form.checkbox',
  SWITCH: 'form.switch',
  SUBMIT: 'form.submit',

  // Marketing
  HERO: 'marketing.hero',
  CTA: 'marketing.cta',
  PRICING: 'marketing.pricing',
  FAQ: 'marketing.faq',
  TESTIMONIAL: 'marketing.testimonial',

  // CMS / Dynamic
  COLLECTION: 'dynamic.collection',
  REPEATER: 'dynamic.repeater',
  CONDITIONAL: 'dynamic.conditional',
} as const;

/** All known node type values. */
export type NodeType = (typeof NODE_TYPES)[keyof typeof NODE_TYPES];

// ---------------------------------------------------------------------------
// Category helpers
// ---------------------------------------------------------------------------

/** Extract the namespace from a node type string. */
export function getNodeCategory(type: string): string {
  const dotIndex = type.indexOf('.');
  return dotIndex >= 0 ? type.slice(0, dotIndex) : type;
}

/** Extract the component name from a node type string. */
export function getNodeName(type: string): string {
  const dotIndex = type.indexOf('.');
  return dotIndex >= 0 ? type.slice(dotIndex + 1) : type;
}

/** Category labels for the UI. */
export const CATEGORY_LABELS: Record<string, string> = {
  core: 'Core',
  layout: 'Layout',
  content: 'Content',
  media: 'Media',
  ui: 'UI',
  navigation: 'Navigation',
  form: 'Forms',
  marketing: 'Marketing',
  dynamic: 'Dynamic',
};
