import React, { useMemo } from 'react';
import type { PageDocument } from '../schema/document';
import { PageRenderer } from './node-renderer';
import { compileDocumentCSS } from '../style/css-compiler';

export interface RuntimeRendererProps {
  /** The fully normalized page document schema to render. */
  document: PageDocument;
  /**
   * Optional custom CSS class applied to the root container.
   */
  className?: string;
}

/**
 * Production Runtime Renderer
 * 
 * Safely renders the page document exactly as it would appear in production.
 * This component does NOT include editor overlays, drag handles, or Inspector
 * logic. It is strictly a one-way deterministic render from the Source of Truth.
 */
export function RuntimeRenderer({ document, className }: RuntimeRendererProps) {
  // Memoize the global CSS compilation so we don't re-compile every render
  const globalCSS = useMemo(() => {
    try {
      return compileDocumentCSS(document);
    } catch (e) {
      console.error('Failed to compile document CSS', e);
      return '';
    }
  }, [document]);

  return (
    <div className={`builder-runtime ${className || ''}`.trim()}>
      <style
        dangerouslySetInnerHTML={{
          __html: globalCSS,
        }}
      />
      <PageRenderer
        document={document}
        isEditor={false}
      />
    </div>
  );
}
