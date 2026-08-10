/**
 * Built-in Components — Phase 0 set
 *
 * Registers the 10 initial components for the architecture spike.
 *
 * @module builder/registry/built-in
 */

'use client';

import React from 'react';
import { defineComponent } from '../component-registry';
import type { ComponentDefinition, ComponentRenderProps } from '../registry-types';

// ---------------------------------------------------------------------------
// core.page
// ---------------------------------------------------------------------------

function PageRenderer({ slots }: ComponentRenderProps) {
  return <div data-builder-type="core.page">{slots.children}</div>;
}

export const corePage = defineComponent({
  type: 'core.page',
  version: 1,
  meta: {
    name: 'Page',
    category: 'core',
    icon: 'file',
    hidden: true, // Not insertable from library
  },
  defaults: {},
  slots: {
    children: { accepts: ['layout.*', 'content.*', 'ui.*', 'media.*', 'marketing.*', 'dynamic.*', 'navigation.*'] },
  },
  capabilities: { style: true, responsive: true },
  inspector: ['style', 'settings'],
  render: PageRenderer,
});

// ---------------------------------------------------------------------------
// layout.section
// ---------------------------------------------------------------------------

function SectionRenderer({ props, slots, isEditor }: ComponentRenderProps) {
  const tag = (props.semanticTag as string) || 'section';
  return React.createElement(
    tag,
    {
      'data-builder-type': 'layout.section',
      style: {
        minHeight: isEditor ? '80px' : undefined,
        position: 'relative',
      },
    },
    slots.children,
  );
}

export const layoutSection = defineComponent({
  type: 'layout.section',
  version: 1,
  meta: {
    name: 'Section',
    description: 'A semantic page section',
    category: 'layout',
    icon: 'layout',
  },
  defaults: { semanticTag: 'section' },
  slots: {
    children: { accepts: ['*'] },
  },
  capabilities: { style: true, animation: true, responsive: true },
  inspector: ['content', 'layout', 'style', 'animation'],
  render: SectionRenderer,
  ai: {
    purpose: 'Major page section container',
    bestFor: ['hero', 'features', 'pricing', 'testimonials'],
    semanticRole: 'section',
  },
});

// ---------------------------------------------------------------------------
// layout.container
// ---------------------------------------------------------------------------

function ContainerRenderer({ props, slots, isEditor }: ComponentRenderProps) {
  return (
    <div
      data-builder-type="layout.container"
      style={{
        maxWidth: (props.maxWidth as string) || '1200px',
        marginInline: 'auto',
        paddingInline: '1rem',
        minHeight: isEditor ? '40px' : undefined,
      }}
    >
      {slots.children}
    </div>
  );
}

export const layoutContainer = defineComponent({
  type: 'layout.container',
  version: 1,
  meta: {
    name: 'Container',
    description: 'Centered content container with max-width',
    category: 'layout',
    icon: 'maximize',
  },
  defaults: { maxWidth: '1200px' },
  slots: {
    children: { accepts: ['*'] },
  },
  capabilities: { style: true, responsive: true },
  inspector: ['layout', 'style'],
  render: ContainerRenderer,
  ai: {
    purpose: 'Center and constrain content width',
    bestFor: ['wrapping section content'],
    semanticRole: 'container',
  },
});

// ---------------------------------------------------------------------------
// layout.box
// ---------------------------------------------------------------------------

function BoxRenderer({ slots, isEditor }: ComponentRenderProps) {
  return (
    <div
      data-builder-type="layout.box"
      style={{ minHeight: isEditor ? '40px' : undefined }}
    >
      {slots.children}
    </div>
  );
}

export const layoutBox = defineComponent({
  type: 'layout.box',
  version: 1,
  meta: {
    name: 'Box',
    description: 'Generic layout container',
    category: 'layout',
    icon: 'square',
  },
  defaults: {},
  slots: {
    children: { accepts: ['*'] },
  },
  capabilities: { style: true, responsive: true },
  inspector: ['layout', 'style'],
  render: BoxRenderer,
});

// ---------------------------------------------------------------------------
// layout.spacer
// ---------------------------------------------------------------------------

function SpacerRenderer({ props }: ComponentRenderProps) {
  return (
    <div
      data-builder-type="layout.spacer"
      style={{ height: (props.height as string) || '2rem' }}
      aria-hidden="true"
    />
  );
}

export const layoutSpacer = defineComponent({
  type: 'layout.spacer',
  version: 1,
  meta: {
    name: 'Spacer',
    description: 'Vertical spacing between elements',
    category: 'layout',
    icon: 'minus',
  },
  defaults: { height: '2rem' },
  slots: {},
  capabilities: { style: true, responsive: true },
  inspector: ['layout'],
  render: SpacerRenderer,
});

// ---------------------------------------------------------------------------
// content.heading
// ---------------------------------------------------------------------------

function HeadingRenderer({ props, isEditor }: ComponentRenderProps) {
  const level = (props.level as number) || 2;
  const text = (props.text as string) || '';
  const tag = `h${Math.min(Math.max(level, 1), 6)}`;

  return React.createElement(
    tag,
    {
      'data-builder-type': 'content.heading',
      contentEditable: isEditor,
      suppressContentEditableWarning: true,
    },
    text || (isEditor ? 'Heading' : '')
  );
}

export const contentHeading = defineComponent({
  type: 'content.heading',
  version: 1,
  meta: {
    name: 'Heading',
    description: 'H1–H6 heading element',
    category: 'content',
    icon: 'heading',
  },
  defaults: { level: 2, text: '' },
  slots: {},
  capabilities: { style: true, responsive: true, dataBinding: true },
  inspector: ['content', 'style'],
  render: HeadingRenderer,
  ai: {
    purpose: 'Page or section heading',
    bestFor: ['titles', 'section headers'],
    semanticRole: 'heading',
  },
});

// ---------------------------------------------------------------------------
// content.text
// ---------------------------------------------------------------------------

function TextRenderer({ props, isEditor }: ComponentRenderProps) {
  const text = (props.text as string) || '';

  return (
    <span
      data-builder-type="content.text"
      contentEditable={isEditor}
      suppressContentEditableWarning
    >
      {text || (isEditor ? 'Text' : '')}
    </span>
  );
}

export const contentText = defineComponent({
  type: 'content.text',
  version: 1,
  meta: {
    name: 'Text',
    description: 'Inline text element',
    category: 'content',
    icon: 'type',
  },
  defaults: { text: '' },
  slots: {},
  capabilities: { style: true, responsive: true, dataBinding: true },
  inspector: ['content', 'style'],
  render: TextRenderer,
});

// ---------------------------------------------------------------------------
// content.paragraph
// ---------------------------------------------------------------------------

function ParagraphRenderer({ props, isEditor }: ComponentRenderProps) {
  const text = (props.text as string) || '';

  return (
    <p
      data-builder-type="content.paragraph"
      contentEditable={isEditor}
      suppressContentEditableWarning
    >
      {text || (isEditor ? 'Paragraph text...' : '')}
    </p>
  );
}

export const contentParagraph = defineComponent({
  type: 'content.paragraph',
  version: 1,
  meta: {
    name: 'Paragraph',
    description: 'Block-level paragraph text',
    category: 'content',
    icon: 'align-left',
  },
  defaults: { text: '' },
  slots: {},
  capabilities: { style: true, responsive: true, dataBinding: true },
  inspector: ['content', 'style'],
  render: ParagraphRenderer,
});

// ---------------------------------------------------------------------------
// ui.button
// ---------------------------------------------------------------------------

function ButtonRenderer({ props, isEditor }: ComponentRenderProps) {
  const label = (props.label as string) || 'Button';
  const variant = (props.variant as string) || 'primary';

  return (
    <button
      data-builder-type="ui.button"
      data-variant={variant}
      type="button"
      onClick={isEditor ? (e) => e.preventDefault() : undefined}
      style={{
        cursor: isEditor ? 'default' : 'pointer',
      }}
    >
      {label}
    </button>
  );
}

export const uiButton = defineComponent({
  type: 'ui.button',
  version: 1,
  meta: {
    name: 'Button',
    description: 'Interactive button element',
    category: 'ui',
    icon: 'mouse-pointer',
  },
  defaults: { label: 'Button', variant: 'primary' },
  slots: {},
  capabilities: {
    style: true,
    animation: true,
    interactions: true,
    responsive: true,
  },
  inspector: ['content', 'style', 'interaction', 'animation'],
  render: ButtonRenderer,
  ai: {
    purpose: 'Primary call-to-action button',
    bestFor: ['hero', 'pricing', 'cta'],
    avoidInside: ['paragraph'],
    semanticRole: 'button',
  },
});

// ---------------------------------------------------------------------------
// media.image
// ---------------------------------------------------------------------------

function ImageRenderer({ props, isEditor }: ComponentRenderProps) {
  const src = (props.src as string) || '';
  const alt = (props.alt as string) || '';

  if (!src && isEditor) {
    return (
      <div
        data-builder-type="media.image"
        style={{
          width: '100%',
          height: '200px',
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
          borderRadius: '0.5rem',
          border: '2px dashed #d1d5db',
        }}
      >
        📷 Image Placeholder
      </div>
    );
  }

  return (
    <img
      data-builder-type="media.image"
      src={src}
      alt={alt}
      style={{ maxWidth: '100%', height: 'auto' }}
      loading="lazy"
    />
  );
}

export const mediaImage = defineComponent({
  type: 'media.image',
  version: 1,
  meta: {
    name: 'Image',
    description: 'Responsive image element',
    category: 'media',
    icon: 'image',
  },
  defaults: { src: '', alt: '' },
  slots: {},
  capabilities: { style: true, animation: true, responsive: true, dataBinding: true },
  inspector: ['content', 'style', 'animation'],
  render: ImageRenderer,
  ai: {
    purpose: 'Display an image',
    bestFor: ['hero', 'gallery', 'content illustration'],
    semanticRole: 'image',
  },
});

// ---------------------------------------------------------------------------
// Registration helper
// ---------------------------------------------------------------------------

import { contentRichTextComponent } from './content-richtext';
import {
  formFormComponent,
  formInputComponent,
  formTextareaComponent,
  formSubmitComponent,
} from './form-components';
import {
  navigationNavbarComponent,
  navigationFooterComponent,
} from './navigation-components';

export const BUILT_IN_COMPONENTS: ComponentDefinition[] = [
  corePage,
  layoutSection,
  layoutContainer,
  layoutBox,
  layoutSpacer,
  contentHeading,
  contentText,
  contentParagraph,
  contentRichTextComponent,
  uiButton,
  mediaImage,
  formFormComponent,
  formInputComponent,
  formTextareaComponent,
  formSubmitComponent,
  navigationNavbarComponent,
  navigationFooterComponent,
];

/**
 * Register all built-in components with the registry.
 */
export function registerBuiltInComponents(registry: {
  register: (def: ComponentDefinition) => void;
}): void {
  for (const component of BUILT_IN_COMPONENTS) {
    registry.register(component);
  }
}
