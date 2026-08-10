/**
 * Form Components — Form, Input, Textarea, Select, Submit
 *
 * Implements accessible visual form building blocks.
 *
 * @module builder/registry/built-in/form-components
 */

import React from 'react';
import { z } from 'zod';
import { defineComponent } from '../component-registry';

// ---------------------------------------------------------------------------
// form.form
// ---------------------------------------------------------------------------

export const FormSchema = z.object({
  action: z.string().optional(),
  method: z.enum(['GET', 'POST']).default('POST'),
  name: z.string().optional(),
});

export const formFormComponent = defineComponent({
  type: 'form.form',
  version: 1,
  meta: {
    name: 'Form Container',
    category: 'Forms',
    description: 'Container for form input controls.',
    icon: 'form-input',
  },
  propsSchema: FormSchema,
  defaults: {
    action: '',
    method: 'POST',
    name: 'contact_form',
  },
  slots: {
    children: { accepts: ['form.*', 'ui.*', 'layout.*', 'content.*'] },
  },
  capabilities: { style: true, animation: true, interactions: true, dataBinding: true, responsive: true },
  inspector: ['content', 'style'],
  render: ({ props, slots }) => (
    <form action={props.action || undefined} method={props.method} name={props.name} className="space-y-4 p-4 border rounded border-gray-200 dark:border-gray-800">
      {slots.children}
    </form>
  ),
});

// ---------------------------------------------------------------------------
// form.input
// ---------------------------------------------------------------------------

export const FormInputSchema = z.object({
  label: z.string(),
  name: z.string(),
  type: z.enum(['text', 'email', 'tel', 'number', 'password']).default('text'),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
});

export const formInputComponent = defineComponent({
  type: 'form.input',
  version: 1,
  meta: {
    name: 'Text Input',
    category: 'Forms',
    description: 'Single-line text input field with label.',
    icon: 'text-cursor',
  },
  propsSchema: FormInputSchema,
  defaults: {
    label: 'Field Label',
    name: 'field_name',
    type: 'text',
    placeholder: 'Enter value...',
    required: false,
  },
  slots: {},
  capabilities: { style: true, animation: false, interactions: false, dataBinding: true, responsive: true },
  inspector: ['content', 'style'],
  render: ({ props }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {props.label} {props.required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={props.type}
        name={props.name}
        placeholder={props.placeholder}
        required={props.required}
        className="px-3 py-2 border rounded-md text-sm border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  ),
});

// ---------------------------------------------------------------------------
// form.textarea
// ---------------------------------------------------------------------------

export const FormTextareaSchema = z.object({
  label: z.string(),
  name: z.string(),
  placeholder: z.string().optional(),
  rows: z.number().default(4),
  required: z.boolean().default(false),
});

export const formTextareaComponent = defineComponent({
  type: 'form.textarea',
  version: 1,
  meta: {
    name: 'Textarea',
    category: 'Forms',
    description: 'Multi-line text input area.',
    icon: 'text-align-left',
  },
  propsSchema: FormTextareaSchema,
  defaults: {
    label: 'Message',
    name: 'message',
    placeholder: 'Enter your message...',
    rows: 4,
    required: false,
  },
  slots: {},
  capabilities: { style: true, animation: false, interactions: false, dataBinding: true, responsive: true },
  inspector: ['content', 'style'],
  render: ({ props }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {props.label} {props.required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        name={props.name}
        rows={props.rows}
        placeholder={props.placeholder}
        required={props.required}
        className="px-3 py-2 border rounded-md text-sm border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
      />
    </div>
  ),
});

// ---------------------------------------------------------------------------
// form.submit
// ---------------------------------------------------------------------------

export const FormSubmitSchema = z.object({
  label: z.string(),
  variant: z.enum(['primary', 'secondary', 'outline']).default('primary'),
});

export const formSubmitComponent = defineComponent({
  type: 'form.submit',
  version: 1,
  meta: {
    name: 'Submit Button',
    category: 'Forms',
    description: 'Form submission action button.',
    icon: 'send',
  },
  propsSchema: FormSubmitSchema,
  defaults: {
    label: 'Submit',
    variant: 'primary',
  },
  slots: {},
  capabilities: { style: true, animation: true, interactions: false, dataBinding: false, responsive: true },
  inspector: ['content', 'style'],
  render: ({ props }) => (
    <button
      type="submit"
      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-md transition-colors"
    >
      {props.label}
    </button>
  ),
});
