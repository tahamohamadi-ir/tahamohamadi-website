'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function CustomCursor({ isEditor }: { isEditor?: boolean }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    // Hide cursor in editor mode to not interfere with drag/drop UX
    if (isEditor) return;

    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if hovering over clickable elements
      if (
        target.tagName.toLowerCase() === 'a' ||
        target.tagName.toLowerCase() === 'button' ||
        target.closest('a') ||
        target.closest('button') ||
        target.getAttribute('role') === 'button'
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);

    // Hide default cursor
    document.body.style.cursor = 'none';

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
      document.body.style.cursor = 'auto';
    };
  }, [isEditor]);

  if (isEditor) return null;

  const cursorVariants = {
    default: {
      x: mousePosition.x - 16,
      y: mousePosition.y - 16,
      scale: 1,
      backgroundColor: 'transparent',
      border: '2px solid rgba(0, 0, 0, 0.5)',
    },
    hover: {
      x: mousePosition.x - 24,
      y: mousePosition.y - 24,
      scale: 1.5,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      border: '2px solid rgba(0, 0, 0, 0.8)',
    },
  };

  return (
    <>
      {/* Small dot */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '8px',
          height: '8px',
          backgroundColor: '#000',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
        animate={{
          x: mousePosition.x - 4,
          y: mousePosition.y - 4,
        }}
        transition={{ type: 'tween', ease: 'linear', duration: 0 }}
      />

      {/* Trailing circle */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9998,
        }}
        variants={cursorVariants}
        animate={isHovering ? 'hover' : 'default'}
        transition={{ type: 'spring', stiffness: 500, damping: 28, mass: 0.5 }}
      />
    </>
  );
}
