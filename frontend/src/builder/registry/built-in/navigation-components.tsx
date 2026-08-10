/**
 * Navigation Components — Navbar and Footer
 *
 * Implements semantic header & footer navigation layout components.
 *
 * @module builder/registry/built-in/navigation-components
 */

import React from 'react';
import { z } from 'zod';
import { defineComponent } from '../component-registry';

// ---------------------------------------------------------------------------
// navigation.navbar
// ---------------------------------------------------------------------------

export const NavbarSchema = z.object({
  brandName: z.string(),
  sticky: z.boolean().default(true),
});

export const navigationNavbarComponent = defineComponent({
  type: 'navigation.navbar',
  version: 1,
  meta: {
    name: 'Navbar Header',
    category: 'Navigation',
    description: 'Header navigation container with brand and links.',
    icon: 'panel-top',
  },
  propsSchema: NavbarSchema,
  defaults: {
    brandName: 'Brand',
    sticky: true,
  },
  slots: {
    links: { accepts: ['ui.button', 'content.*', 'navigation.*'] },
  },
  capabilities: { style: true, animation: true, interactions: false, dataBinding: true, responsive: true },
  inspector: ['content', 'style'],
  render: ({ props, slots }) => (
    <header className={`w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between ${props.sticky ? 'sticky top-0 z-40' : ''}`}>
      <div className="font-bold text-lg text-gray-900 dark:text-white">
        {props.brandName}
      </div>
      <nav className="flex items-center gap-4">
        {slots.links}
      </nav>
    </header>
  ),
});

// ---------------------------------------------------------------------------
// navigation.footer
// ---------------------------------------------------------------------------

export const FooterSchema = z.object({
  copyrightText: z.string(),
});

export const navigationFooterComponent = defineComponent({
  type: 'navigation.footer',
  version: 1,
  meta: {
    name: 'Footer Section',
    category: 'Navigation',
    description: 'Footer section block with copyright text.',
    icon: 'panel-bottom',
  },
  propsSchema: FooterSchema,
  defaults: {
    copyrightText: '© 2026 All rights reserved.',
  },
  slots: {
    content: { accepts: ['*'] },
  },
  capabilities: { style: true, animation: false, interactions: false, dataBinding: true, responsive: true },
  inspector: ['content', 'style'],
  render: ({ props, slots }) => (
    <footer className="w-full bg-gray-900 text-gray-400 px-6 py-8 border-t border-gray-800 flex flex-col gap-4 text-sm">
      <div className="flex-1">{slots.content}</div>
      <div className="text-xs text-center border-t border-gray-800 pt-4">
        {props.copyrightText}
      </div>
    </footer>
  ),
});
