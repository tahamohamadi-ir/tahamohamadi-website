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

function PageRenderer({ props, slots, isEditor }: ComponentRenderProps) {
  const customStyles = (props.styles as React.CSSProperties) || {};
  
  const hasChildren = React.Children.count(slots.children) > 0;
  
  return (
    <div data-builder-type="core.page" style={{ minHeight: '100vh', ...customStyles }}>
      {hasChildren ? slots.children : isEditor ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '2rem', textAlign: 'center', backgroundColor: '#f9fafb', color: '#9ca3af', border: '2px dashed #e5e7eb', margin: '2rem', borderRadius: '1rem' }}>
          <svg style={{ width: '48px', height: '48px', marginBottom: '1rem', color: '#d1d5db' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>بوم شما خالی است</h3>
          <p style={{ maxWidth: '400px', fontSize: '0.875rem' }}>برای شروع طراحی، کامپوننت‌ها را از پنل سمت چپ بکشید و در اینجا رها کنید.</p>
        </div>
      ) : null}
    </div>
  );
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
  const customStyles = (props.styles as React.CSSProperties) || {};
  
  return React.createElement(
    tag,
    {
      'data-builder-type': 'layout.section',
      style: {
        minHeight: isEditor ? '80px' : undefined,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        ...customStyles,
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
  const customStyles = (props.styles as React.CSSProperties) || {};
  
  return (
    <div
      data-builder-type="layout.container"
      style={{
        maxWidth: (props.maxWidth as string) || '1200px',
        marginInline: 'auto',
        paddingInline: '1rem',
        minHeight: isEditor ? '40px' : undefined,
        display: 'flex',
        flexDirection: 'column',
        ...customStyles,
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

function BoxRenderer({ props, slots, isEditor }: ComponentRenderProps) {
  const customStyles = (props.styles as React.CSSProperties) || {};
  
  return (
    <div
      data-builder-type="layout.box"
      style={{
        minHeight: isEditor ? '40px' : undefined,
        display: 'flex',
        flexDirection: 'column',
        ...customStyles,
      }}
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
  ai: {
    purpose: 'Generic layout container without semantic constraints',
    bestFor: ['grouping elements', 'cards', 'cards grid'],
    semanticRole: 'div',
  },
});

// ---------------------------------------------------------------------------
// layout.spacer
// ---------------------------------------------------------------------------

function SpacerRenderer({ props }: ComponentRenderProps) {
  const customStyles = (props.styles as React.CSSProperties) || {};

  return (
    <div
      data-builder-type="layout.spacer"
      style={{ 
        height: (props.height as string) || '2rem',
        ...customStyles
      }}
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
  ai: {
    purpose: 'Vertical spacing between elements',
    bestFor: ['creating whitespace'],
  },
});

// ---------------------------------------------------------------------------
// layout.row
// ---------------------------------------------------------------------------

function RowRenderer({ props, slots, isEditor }: ComponentRenderProps) {
  const customStyles = (props.styles as React.CSSProperties) || {};
  
  return (
    <div
      data-builder-type="layout.row"
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: (props.gap as string) || '1rem',
        alignItems: (props.alignItems as string) || 'flex-start',
        justifyContent: (props.justifyContent as string) || 'flex-start',
        minHeight: isEditor ? '40px' : undefined,
        ...customStyles,
      }}
    >
      {slots.children}
    </div>
  );
}

export const layoutRow = defineComponent({
  type: 'layout.row',
  version: 1,
  meta: {
    name: 'Row',
    description: 'Horizontal flex container for side-by-side elements',
    category: 'layout',
    icon: 'align-justify', // roughly row-like
  },
  defaults: { gap: '1rem', alignItems: 'flex-start', justifyContent: 'flex-start' },
  slots: {
    children: { accepts: ['*'] },
  },
  capabilities: { style: true, responsive: true },
  inspector: ['layout', 'style'],
  render: RowRenderer,
  ai: {
    purpose: 'Place elements side by side horizontally',
    bestFor: ['button groups', 'inline content'],
  },
});

// ---------------------------------------------------------------------------
// layout.grid (Columns)
// ---------------------------------------------------------------------------

function GridRenderer({ props, slots, isEditor }: ComponentRenderProps) {
  const customStyles = (props.styles as React.CSSProperties) || {};
  const columns = (props.columns as string) || 'repeat(auto-fit, minmax(250px, 1fr))';
  
  return (
    <div
      data-builder-type="layout.grid"
      style={{
        display: 'grid',
        gridTemplateColumns: columns,
        gap: (props.gap as string) || '1.5rem',
        minHeight: isEditor ? '40px' : undefined,
        ...customStyles,
      }}
    >
      {slots.children}
    </div>
  );
}

export const layoutGrid = defineComponent({
  type: 'layout.grid',
  version: 1,
  meta: {
    name: 'Grid / Columns',
    description: 'Responsive CSS Grid for side-by-side columns',
    category: 'layout',
    icon: 'grid',
  },
  defaults: { gap: '1.5rem', columns: 'repeat(auto-fit, minmax(250px, 1fr))' },
  slots: {
    children: { accepts: ['*'] },
  },
  capabilities: { style: true, responsive: true },
  inspector: ['layout', 'style'],
  render: GridRenderer,
  ai: {
    purpose: 'Responsive multi-column grid',
    bestFor: ['feature cards', 'pricing tables', 'photo galleries'],
  },
});

// ---------------------------------------------------------------------------
// layout.frame (Freeform Canvas)
// ---------------------------------------------------------------------------

function FrameRenderer({ props, slots, isEditor }: ComponentRenderProps) {
  const customStyles = (props.styles as React.CSSProperties) || {};
  
  return (
    <div
      data-builder-type="layout.frame"
      style={{
        position: 'relative',
        minHeight: isEditor ? '200px' : undefined,
        width: '100%',
        ...customStyles,
      }}
    >
      {slots.children}
    </div>
  );
}

export const layoutFrame = defineComponent({
  type: 'layout.frame',
  version: 1,
  meta: {
    name: 'Frame (Freeform)',
    description: 'A relative container perfect for absolute (Figma-like) positioned children.',
    category: 'layout',
    icon: 'layout',
  },
  defaults: {},
  slots: {
    children: { accepts: ['*'] },
  },
  capabilities: { style: true, responsive: true },
  inspector: ['layout', 'style'],
  render: FrameRenderer,
  ai: {
    purpose: 'Container for absolutely positioned elements',
    bestFor: ['custom graphics', 'overlapping layouts', 'Figma-like freeform'],
  },
});

// ---------------------------------------------------------------------------
// layout.card
// ---------------------------------------------------------------------------

function CardRenderer({ props, slots, isEditor }: ComponentRenderProps) {
  const customStyles = (props.styles as React.CSSProperties) || {};
  return (
    <div
      data-builder-type="layout.card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '0.75rem',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        minHeight: isEditor ? '150px' : undefined,
        ...customStyles,
      }}
    >
      <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {slots.children}
      </div>
    </div>
  );
}

export const layoutCard = defineComponent({
  type: 'layout.card',
  version: 1,
  meta: {
    name: 'Card',
    description: 'A versatile container for content blocks.',
    category: 'layout',
    icon: 'layout',
  },
  defaults: {},
  slots: {
    children: { accepts: ['*'] },
  },
  capabilities: { style: true, responsive: true },
  inspector: ['layout', 'style'],
  render: CardRenderer,
  ai: {
    purpose: 'Card container for grouping related content',
    bestFor: ['product cards', 'blog post summaries', 'pricing tiers'],
  },
});

// ---------------------------------------------------------------------------
// ui.modal
// ---------------------------------------------------------------------------

function ModalRenderer({ props, slots, isEditor, isSelected }: ComponentRenderProps) {
  const customStyles = (props.styles as React.CSSProperties) || {};
  
  if (isEditor) {
    return (
      <div
        data-builder-type="ui.modal"
        style={{
          position: 'relative',
          padding: '2rem',
          border: '2px dashed #a855f7',
          backgroundColor: 'rgba(168, 85, 247, 0.05)',
          minHeight: '200px',
          width: '100%',
          ...customStyles,
        }}
      >
        <div style={{ position: 'absolute', top: -12, left: 10, background: '#a855f7', color: 'white', padding: '2px 8px', fontSize: '10px', borderRadius: '4px' }}>
          Modal / Popup
        </div>
        {slots.children}
      </div>
    );
  }

  // Production render (hidden by default unless triggered via Interaction engine - implementation in consumer)
  return (
    <dialog
      id={props.id as string}
      data-builder-type="ui.modal"
      style={{
        padding: '2rem',
        borderRadius: '1rem',
        border: 'none',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        maxWidth: '90vw',
        ...customStyles,
      }}
    >
      {slots.children}
    </dialog>
  );
}

export const uiModal = defineComponent({
  type: 'ui.modal',
  version: 1,
  meta: {
    name: 'Popup / Modal',
    description: 'A popup dialog that overlays the screen.',
    category: 'layout',
    icon: 'layout',
  },
  defaults: {},
  slots: {
    children: { accepts: ['*'] },
  },
  capabilities: { style: true, responsive: true },
  inspector: ['layout', 'style'],
  render: ModalRenderer,
  ai: {
    purpose: 'Popup dialog or modal overlay',
    bestFor: ['alerts', 'forms', 'details view'],
  },
});

// ---------------------------------------------------------------------------
// content.heading
// ---------------------------------------------------------------------------

function HeadingRenderer({ props, isEditor }: ComponentRenderProps) {
  const level = (props.level as number) || 2;
  const text = (props.text as string) || '';
  const tag = `h${Math.min(Math.max(level, 1), 6)}`;
  const customStyles = (props.styles as React.CSSProperties) || {};

  return React.createElement(
    tag,
    {
      'data-builder-type': 'content.heading',
      contentEditable: isEditor,
      suppressContentEditableWarning: true,
      style: customStyles,
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
  const customStyles = (props.styles as React.CSSProperties) || {};

  return (
    <span
      data-builder-type="content.text"
      contentEditable={isEditor}
      suppressContentEditableWarning
      style={{
        display: 'inline-block',
        minWidth: '20px',
        outline: 'none',
        color: customStyles.color || 'var(--foreground, #111827)',
        ...customStyles,
      }}
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
  ai: {
    purpose: 'Inline text element',
    bestFor: ['inline styles', 'labels'],
    avoidInside: ['heading', 'button'],
  },
});

// ---------------------------------------------------------------------------
// content.paragraph
// ---------------------------------------------------------------------------

function ParagraphRenderer({ props, isEditor }: ComponentRenderProps) {
  const text = (props.text as string) || '';
  const customStyles = (props.styles as React.CSSProperties) || {};

  return (
    <p
      data-builder-type="content.paragraph"
      contentEditable={isEditor}
      suppressContentEditableWarning
      style={customStyles}
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
  ai: {
    purpose: 'Block-level paragraph text',
    bestFor: ['body text', 'descriptions'],
    semanticRole: 'paragraph',
  },
});

// ---------------------------------------------------------------------------
// ui.button
// ---------------------------------------------------------------------------

function ButtonRenderer({ props, isEditor }: ComponentRenderProps) {
  const label = (props.label as string) || 'Button';
  const variant = (props.variant as string) || 'primary';
  const customStyles = (props.styles as React.CSSProperties) || {};

  return (
    <button
      data-builder-type="ui.button"
      data-variant={variant}
      type="button"
      onClick={isEditor ? (e) => e.preventDefault() : undefined}
      style={{
        cursor: isEditor ? 'default' : 'pointer',
        ...customStyles,
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
  const customStyles = (props.styles as React.CSSProperties) || {};

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
          ...customStyles,
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
      style={{ maxWidth: '100%', height: 'auto', ...customStyles }}
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
import {
  contentAnimatedText,
  contentCounter,
  uiThemeToggle,
  layoutFreeform,
} from './awwwards-components';
import {
  marketingHero,
  marketingFeatures,
  marketingTestimonial,
  marketingPricing,
  marketingFaq,
  marketingGallery,
  marketingTimeline,
  marketingFeaturedContent,
} from './marketing-components';

export const BUILT_IN_COMPONENTS: ComponentDefinition[] = [
  corePage,
  layoutSection,
  layoutContainer,
  layoutBox,
  layoutSpacer,
  layoutRow,
  layoutGrid,
  layoutFrame,
  layoutCard,
  uiModal,
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
  contentAnimatedText,
  contentCounter,
  uiThemeToggle,
  layoutFreeform,
  marketingHero,
  marketingFeatures,
  marketingTestimonial,
  marketingPricing,
  marketingFaq,
  marketingGallery,
  marketingTimeline,
  marketingFeaturedContent,
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
