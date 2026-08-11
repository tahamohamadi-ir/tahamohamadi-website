'use client';

import React, { useEffect, useState, useRef } from 'react';
import { defineComponent } from '../component-registry';
import type { ComponentRenderProps } from '../registry-types';
import { motion, useInView, animate } from 'framer-motion';
import { useTheme } from 'next-themes';

// ---------------------------------------------------------------------------
// content.animated-text
// ---------------------------------------------------------------------------
function AnimatedTextRenderer({ props, isEditor }: ComponentRenderProps) {
  const text = (props.text as string) || 'Animated Typography';
  const customStyles = (props.styles as React.CSSProperties) || {};
  const tag = (props.tag as string) || 'h2';

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20%' });

  // Split text into words for stagger effect
  const words = text.split(' ');

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.04 * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: 'spring' as const,
        damping: 12,
        stiffness: 100,
      },
    },
  };

  const Component = (motion as unknown as Record<string, React.ElementType>)[tag] || motion.h2;

  if (isEditor) {
    return React.createElement(tag, { style: { ...customStyles, margin: 0 } }, text);
  }

  return (
    <Component
      ref={ref}
      style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25em', margin: 0, ...customStyles }}
      variants={container}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {words.map((word, index) => (
        <motion.span variants={child} style={{ display: 'inline-block' }} key={index}>
          {word}
        </motion.span>
      ))}
    </Component>
  );
}

export const contentAnimatedText = defineComponent({
  type: 'content.animated-text',
  version: 1,
  meta: {
    name: 'Animated Text',
    description: 'Large animated typography with stagger effect',
    category: 'content',
    icon: 'text',
  },
  defaults: { text: 'Welcome to the Future', tag: 'h2' },
  slots: {},
  capabilities: { style: true, animation: true, responsive: true },
  inspector: ['content', 'style', 'settings', 'animation'],
  render: AnimatedTextRenderer,
});

// ---------------------------------------------------------------------------
// content.counter
// ---------------------------------------------------------------------------
function CounterRenderer({ props, isEditor }: ComponentRenderProps) {
  const targetNumber = Number(props.target) || 100;
  const prefix = (props.prefix as string) || '';
  const suffix = (props.suffix as string) || '';
  const customStyles = (props.styles as React.CSSProperties) || {};

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isEditor) {
      setDisplayValue(targetNumber);
      return;
    }
    
    if (isInView) {
      const controls = animate(0, targetNumber, {
        duration: 2,
        ease: 'easeOut',
        onUpdate(value) {
          setDisplayValue(Math.floor(value));
        },
      });
      return () => controls.stop();
    }
  }, [isInView, targetNumber, isEditor]);

  return (
    <div ref={ref} style={{ display: 'inline-flex', alignItems: 'center', fontSize: '2rem', fontWeight: 'bold', ...customStyles }}>
      {prefix && <span style={{ marginRight: '0.25em' }}>{prefix}</span>}
      <motion.span>{displayValue}</motion.span>
      {suffix && <span style={{ marginLeft: '0.25em' }}>{suffix}</span>}
    </div>
  );
}

export const contentCounter = defineComponent({
  type: 'content.counter',
  version: 1,
  meta: {
    name: 'Live Counter',
    description: 'Animated number counter for statistics',
    category: 'content',
    icon: 'hash',
  },
  defaults: { target: 100, prefix: '', suffix: '+' },
  slots: {},
  capabilities: { style: true, animation: true, responsive: true },
  inspector: ['content', 'style', 'settings'],
  render: CounterRenderer,
});

// ---------------------------------------------------------------------------
// ui.theme-toggle
// ---------------------------------------------------------------------------
function ThemeToggleRenderer({ props, isEditor }: ComponentRenderProps) {
  const customStyles = (props.styles as React.CSSProperties) || {};
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => {
        if (!isEditor) {
          setTheme(isDark ? 'light' : 'dark');
        }
      }}
      style={{
        padding: '0.5rem',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid var(--border, #e5e7eb)',
        backgroundColor: 'var(--background, #ffffff)',
        color: 'var(--foreground, #000000)',
        cursor: 'pointer',
        ...customStyles,
      }}
      title="Toggle Theme"
    >
      {mounted && isDark ? '🌙' : '☀️'}
    </button>
  );
}

export const uiThemeToggle = defineComponent({
  type: 'ui.theme-toggle',
  version: 1,
  meta: {
    name: 'Theme Toggle',
    description: 'Dark/Light mode switch',
    category: 'ui',
    icon: 'moon',
  },
  defaults: {},
  slots: {},
  capabilities: { style: true, responsive: true },
  inspector: ['style', 'settings'],
  render: ThemeToggleRenderer,
});

// ---------------------------------------------------------------------------
// layout.freeform
// ---------------------------------------------------------------------------
function FreeformRenderer({ props, slots, isEditor }: ComponentRenderProps) {
  const customStyles = (props.styles as React.CSSProperties) || {};
  
  return (
    <div
      data-builder-type="layout.freeform"
      style={{
        position: 'relative',
        minHeight: isEditor ? '200px' : 'auto',
        border: isEditor ? '1px dashed #cbd5e1' : undefined,
        ...customStyles,
      }}
    >
      {slots.children}
    </div>
  );
}

export const layoutFreeform = defineComponent({
  type: 'layout.freeform',
  version: 1,
  meta: {
    name: 'Freeform Canvas',
    description: 'Absolute positioning container for broken grid designs',
    category: 'layout',
    icon: 'move',
  },
  defaults: {},
  slots: {
    children: { accepts: ['*'] },
  },
  capabilities: { style: true, responsive: true, animation: true },
  inspector: ['style', 'settings', 'animation'],
  render: FreeformRenderer,
});
