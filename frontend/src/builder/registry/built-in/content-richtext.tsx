/**
 * RichText Component — Tiptap-powered inline rich text editing
 *
 * Implements Tiptap integration (Blueprint Part 6).
 *
 * @module builder/registry/built-in/content-richtext
 */

'use client';

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { z } from 'zod';
import { defineComponent } from '../component-registry';

export const RichTextSchema = z.object({
  content: z.string(),
  placeholder: z.string().optional(),
});

export type RichTextProps = z.infer<typeof RichTextSchema>;

function RichTextRenderer({ props, isEditor, onPropsChange }: {
  props: RichTextProps;
  isEditor?: boolean;
  onPropsChange?: (patch: Partial<RichTextProps>) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: props.placeholder || 'Type rich content...',
      }),
    ],
    content: props.content || '<p>Rich text content goes here...</p>',
    editable: isEditor,
    onUpdate: ({ editor: currentEditor }) => {
      if (onPropsChange) {
        onPropsChange({ content: currentEditor.getHTML() });
      }
    },
  });

  if (!isEditor) {
    return (
      <div
        className="prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: props.content || '' }}
      />
    );
  }

  return (
    <div className="builder-richtext-wrapper border border-dashed border-indigo-300 dark:border-indigo-700 p-2 rounded">
      {editor && isEditor && (
        <div className="flex gap-1 mb-2 border-b border-gray-200 dark:border-gray-700 pb-1 text-xs">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-2 py-0.5 rounded ${editor.isActive('bold') ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
          >
            B
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-2 py-0.5 rounded italic ${editor.isActive('italic') ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
          >
            I
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-2 py-0.5 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-2 py-0.5 rounded ${editor.isActive('bulletList') ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
          >
            List
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

export const contentRichTextComponent = defineComponent<RichTextProps>({
  type: 'content.richtext',
  version: 1,
  meta: {
    name: 'Rich Text',
    category: 'Content',
    description: 'Inline formatted rich text with Tiptap editor.',
    icon: 'text-quote',
  },
  propsSchema: RichTextSchema,
  defaults: {
    content: '<p>Start typing formatted text with headings, bolding, lists, and links...</p>',
    placeholder: 'Type rich content...',
  },
  slots: {},
  capabilities: {
    style: true,
    animation: true,
    interactions: false,
    dataBinding: true,
    responsive: true,
  },
  inspector: ['content', 'style'],
  render: ({ props, isEditor, onPropsChange }) => (
    <RichTextRenderer props={props} isEditor={isEditor} onPropsChange={onPropsChange} />
  ),
  ai: {
    purpose: 'Formatted block of rich text',
    bestFor: ['articles', 'long descriptions', 'formatted content'],
    semanticRole: 'article',
  },
});
