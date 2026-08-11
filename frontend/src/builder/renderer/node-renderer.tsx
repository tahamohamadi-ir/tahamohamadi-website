/**
 * Node Renderer — Recursive renderer from normalized document
 *
 * Renders a node tree from the PageDocument schema.
 * Each node is resolved to a React component via the ComponentRegistry.
 *
 * ADR-008: Editor Preview and Published Rendering must use the same Component Registry
 *
 * @module builder/renderer/node-renderer
 */

'use client';

import React, { useMemo, useCallback, memo, useRef } from 'react';
import { motion, useScroll, useTransform, type TargetAndTransition } from 'framer-motion';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { NodeId, PageDocument } from '../schema/document';
import { resolveComponent } from './runtime-resolver';
import { CustomCursor } from './custom-cursor';

function ParallaxContainer({ speed, children }: { speed: number; children: React.ReactNode }) {
  const { scrollY } = useScroll();
  const yOffset = useTransform(scrollY, [0, 1000], [0, speed * -200]);
  return <motion.div style={{ y: yOffset }}>{children}</motion.div>;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface NodeRendererProps {
  /** The document to render from. */
  document: PageDocument;
  /** The node ID to render. */
  nodeId: NodeId;
  /** Whether we're in editor mode. */
  isEditor: boolean;
  /** Currently selected node IDs (for highlighting in editor). */
  selectedNodeIds?: NodeId[];
  /** Callback when a node is clicked (editor mode). */
  onNodeClick?: (nodeId: NodeId, event: React.MouseEvent) => void;
  /** Callback when mouse enters a node (editor mode). */
  onNodeHover?: (nodeId: NodeId | null) => void;
  /** Callback to update props when resizing */
  onUpdateProps?: (nodeId: NodeId, patch: Record<string, unknown>) => void;
}

// ---------------------------------------------------------------------------
// Fallback Component
// ---------------------------------------------------------------------------

function FallbackComponent({ nodeId, type }: { nodeId: string; type: string }) {
  return (
    <div
      data-builder-type="unknown"
      data-builder-node={nodeId}
      style={{
        padding: '1rem',
        border: '2px dashed #ef4444',
        borderRadius: '0.5rem',
        backgroundColor: '#fef2f2',
        color: '#dc2626',
        fontSize: '0.875rem',
        fontFamily: 'monospace',
      }}
    >
      ⚠ Unknown component: <strong>{type}</strong>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single Node Renderer (memoized)
// ---------------------------------------------------------------------------

interface SingleNodeContentProps extends NodeRendererProps {
  node: NonNullable<PageDocument['nodes'][string]>;
}

function SingleNodeContent({
  document,
  nodeId,
  isEditor,
  selectedNodeIds,
  onNodeClick,
  onNodeHover,
  onUpdateProps,
  node,
}: SingleNodeContentProps) {
  const { definition, resolvedProps: initialResolvedProps } = resolveComponent(node);
  const isSelected = selectedNodeIds?.includes(nodeId) ?? false;

  // Render slot children recursively
  const renderedSlots = useMemo(() => {
    const result: Record<string, React.ReactNode> = {};

    for (const [slotName, childIds] of Object.entries(node.slots)) {
      result[slotName] = (
        <>
          {childIds.map((childId) => (
            <SingleNodeRenderer
              key={childId}
              document={document}
              nodeId={childId}
              isEditor={isEditor}
              selectedNodeIds={selectedNodeIds}
              onNodeClick={onNodeClick}
              onNodeHover={onNodeHover}
              onUpdateProps={onUpdateProps}
            />
          ))}
        </>
      );
    }

    return result;
  }, [node.slots, document, isEditor, selectedNodeIds, onNodeClick, onNodeHover, onUpdateProps]);

  // Editor event handlers
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isEditor || !onNodeClick) return;
      e.stopPropagation();
      onNodeClick(nodeId, e);
    },
    [isEditor, onNodeClick, nodeId],
  );

  const handleMouseEnter = useCallback(() => {
    if (isEditor && onNodeHover) {
      onNodeHover(nodeId);
    }
  }, [isEditor, onNodeHover, nodeId]);

  const handleMouseLeave = useCallback(() => {
    if (isEditor && onNodeHover) {
      onNodeHover(null);
    }
  }, [isEditor, onNodeHover]);

  // Drag and Drop Hooks
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `drop-canvas-${nodeId}`,
    data: { type: 'canvas_node', nodeId },
    disabled: !isEditor,
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    isDragging,
    transform,
  } = useDraggable({
    id: `drag-canvas-${nodeId}`,
    data: { type: 'canvas_node', nodeId },
    disabled: !isEditor || document.rootNodeId === nodeId, // Cannot drag root
  });

  const containerRef = useRef<HTMLDivElement | null>(null);

  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      containerRef.current = node as HTMLDivElement;
      if (isEditor) {
        setDroppableRef(node);
        setDraggableRef(node);
      }
    },
    [isEditor, setDroppableRef, setDraggableRef],
  );

  // Unconditional hook calls for interactions and animations
  const actionType = node.props.actionType as string | undefined;
  const modalTargetId = node.props.modalTargetId as string | undefined;

  const handleInteractionClick = useCallback((e: React.MouseEvent) => {
    if (isEditor) return;
    if (actionType === 'modal' && modalTargetId) {
      e.preventDefault();
      const dialog = window.document.getElementById(modalTargetId) as HTMLDialogElement;
      if (dialog && dialog.showModal) {
        dialog.showModal();
      }
    }
  }, [isEditor, actionType, modalTargetId]);

  const animations = (node.props.animations as Record<string, unknown>) || {};
  const parallaxSpeed = (animations.parallaxSpeed as number) || 0;

  if (!definition) {
    return <FallbackComponent nodeId={nodeId} type={node.type} />;
  }

  // Determine hover styles
  const resolvedProps = { ...initialResolvedProps };
  const hoverStyles = (node.props.hoverStyles || {}) as React.CSSProperties;
  const hasHoverStyles = Object.keys(hoverStyles).length > 0;
  const hoverClassName = `hover-${nodeId}`;

  // If we have hover styles, append the class to the resolvedProps styles
  if (hasHoverStyles) {
    resolvedProps.className = resolvedProps.className ? `${resolvedProps.className} ${hoverClassName}` : hoverClassName;
  }

  // Render Component
  const Component = definition.render;
  
  let content = (
    <Component
      nodeId={nodeId}
      props={resolvedProps}
      slots={renderedSlots}
      isEditor={isEditor}
      isSelected={isSelected}
    />
  );

  // Apply Tooltips and Links (Wrap the component)
  const href = node.props.href as string | undefined;
  const tooltip = node.props.tooltip as string | undefined;

  if (actionType === 'modal' || href || tooltip) {
    if (!isEditor && (href || actionType === 'modal')) {
      content = <a href={href || '#'} onClick={handleInteractionClick} title={tooltip} style={{ textDecoration: 'none', display: 'contents', cursor: 'pointer' }}>{content}</a>;
    } else if (tooltip) {
      content = <div title={tooltip} style={{ display: 'contents' }}>{content}</div>;
    }
  }

  // Add Hover CSS if needed
  if (hasHoverStyles) {
    content = (
      <>
        <style dangerouslySetInnerHTML={{ __html: `.${hoverClassName}:hover { ${cssStringFromObject(hoverStyles as Record<string, unknown>)} }` }} />
        {content}
      </>
    );
  }

  let finalContent = content;

  if (!isEditor && (animations.entrance && animations.entrance !== 'none' || parallaxSpeed !== 0)) {
    const entranceType = animations.entrance;
    const delay = typeof animations.delay === 'number' ? animations.delay : 0;
    
    let initial: TargetAndTransition = {};
    let animate: TargetAndTransition = {};
    
    if (entranceType === 'fade') {
      initial = { opacity: 0 };
      animate = { opacity: 1 };
    } else if (entranceType === 'slide-up') {
      initial = { opacity: 0, y: 50 };
      animate = { opacity: 1, y: 0 };
    } else if (entranceType === 'scale') {
      initial = { opacity: 0, scale: 0.8 };
      animate = { opacity: 1, scale: 1 };
    }
    
    finalContent = (
      <motion.div
        initial={entranceType ? initial : undefined}
        whileInView={entranceType ? animate : undefined}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, delay, ease: 'easeOut' }}
        style={{ width: '100%', height: '100%' }}
      >
        {finalContent}
      </motion.div>
    );

    if (parallaxSpeed !== 0) {
      finalContent = (
        <ParallaxContainer speed={parallaxSpeed}>
          {finalContent}
        </ParallaxContainer>
      );
    }
  }

  if (isEditor) {
    const isInlineNode = node.type === 'text' || node.type === 'heading' || node.type === 'button' || node.type === 'badge';
    const customStyles = (node.props.styles as Record<string, string>) || {};

    return (
      <div
        ref={setRefs}
        {...attributes}
        {...listeners}
        data-builder-node={nodeId}
        data-node-id={nodeId}
        data-builder-type={node.type}
        data-builder-selected={isSelected || undefined}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'relative',
          width: customStyles.width || '100%',
          alignSelf: customStyles.alignSelf || undefined,
          textAlign: (customStyles.textAlign as React.CSSProperties['textAlign']) || undefined,
          minHeight: !isInlineNode ? '80px' : undefined,
          boxSizing: 'border-box',
          outline: isOver ? '2px dashed #22c55e' : undefined,
          cursor: node.metadata?.locked ? 'not-allowed' : (isDragging ? 'grabbing' : 'grab'),
          opacity: isDragging ? 0.4 : 1,
          transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
          zIndex: isDragging ? 50 : undefined,
          backgroundColor: isOver ? 'rgba(34, 197, 94, 0.05)' : undefined,
        }}
      >
        {content}
        {isSelected && !isDragging && onUpdateProps && (
          <ResizeOverlay
            nodeId={nodeId}
            containerRef={containerRef}
            currentStyles={(node.props.styles as Record<string, string>) || {}}
            onUpdateProps={onUpdateProps}
          />
        )}
      </div>
    );
  }

  return finalContent;
}

const SingleNodeRenderer = memo(function SingleNodeRenderer(props: NodeRendererProps) {
  const { document, nodeId, isEditor } = props;
  const node = document.nodes[nodeId];
  if (!node) return null;

  // Check visibility
  if (node.visibility?.hidden && !isEditor) return null;
  if (node.metadata?.hiddenInEditor && isEditor) return null;

  return <SingleNodeContent {...props} node={node} />;
});

SingleNodeRenderer.displayName = 'SingleNodeRenderer';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function camelToKebab(str: string) {
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function cssStringFromObject(obj: Record<string, unknown>) {
  return Object.entries(obj)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${camelToKebab(key)}: ${value};`)
    .join(' ');
}

// ---------------------------------------------------------------------------
// Root Renderer
// ---------------------------------------------------------------------------

export interface PageRendererProps {
  document: PageDocument;
  isEditor?: boolean;
  selectedNodeIds?: NodeId[];
  onNodeClick?: (nodeId: NodeId, event: React.MouseEvent) => void;
  onNodeHover?: (nodeId: NodeId | null) => void;
  onUpdateProps?: (nodeId: NodeId, patch: Record<string, unknown>) => void;
}

/**
 * Renders the entire page document starting from the root node.
 */
export function PageRenderer({
  document,
  isEditor = false,
  selectedNodeIds = [],
  onNodeClick,
  onNodeHover,
  onUpdateProps,
}: PageRendererProps) {
  if (!document.rootNodeId || !document.nodes[document.rootNodeId]) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        <CustomCursor isEditor={isEditor} />
        Empty page — add components from the library panel.
      </div>
    );
  }

  return (
    <>
      <CustomCursor isEditor={isEditor} />
      <SingleNodeRenderer
        document={document}
        nodeId={document.rootNodeId}
        isEditor={isEditor}
        selectedNodeIds={selectedNodeIds}
        onNodeClick={onNodeClick}
        onNodeHover={onNodeHover}
        onUpdateProps={onUpdateProps}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Resize Overlay
// ---------------------------------------------------------------------------

function ResizeOverlay({
  nodeId,
  containerRef,
  currentStyles,
  onUpdateProps,
}: {
  nodeId: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  currentStyles: Record<string, string>;
  onUpdateProps: (nodeId: string, patch: Record<string, unknown>) => void;
}) {
  const startResize = (e: React.PointerEvent, direction: 'width' | 'height' | 'both') => {
    e.preventDefault();
    e.stopPropagation();

    if (!containerRef.current) return;
    const target = containerRef.current.children[0] as HTMLElement; // Target the actual component inside the wrapper
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const startWidth = rect.width;
    const startHeight = rect.height;
    const startX = e.clientX;
    const startY = e.clientY;

    let finalWidth = startWidth;
    let finalHeight = startHeight;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      if (direction === 'width' || direction === 'both') {
        finalWidth = Math.max(20, startWidth + deltaX);
        target.style.width = `${finalWidth}px`;
      }
      if (direction === 'height' || direction === 'both') {
        finalHeight = Math.max(20, startHeight + deltaY);
        target.style.height = `${finalHeight}px`;
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      const updates: Record<string, string> = {};
      if (direction === 'width' || direction === 'both') updates.width = `${finalWidth}px`;
      if (direction === 'height' || direction === 'both') updates.height = `${finalHeight}px`;

      onUpdateProps(nodeId, { styles: { ...currentStyles, ...updates } });
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleStyle: React.CSSProperties = {
    position: 'absolute',
    background: '#ffffff',
    border: '2px solid #4F46E5',
    boxShadow: '0 0 4px rgba(0,0,0,0.2)',
    zIndex: 100,
  };

  return (
    <>
      {/* Right handle */}
      <div
        onPointerDown={(e) => startResize(e, 'width')}
        style={{
          ...handleStyle,
          top: '50%',
          right: '-5px',
          width: '10px',
          height: '24px',
          transform: 'translateY(-50%)',
          cursor: 'ew-resize',
          borderRadius: '2px',
        }}
      />
      {/* Bottom handle */}
      <div
        onPointerDown={(e) => startResize(e, 'height')}
        style={{
          ...handleStyle,
          bottom: '-5px',
          left: '50%',
          width: '24px',
          height: '10px',
          transform: 'translateX(-50%)',
          cursor: 'ns-resize',
          borderRadius: '2px',
        }}
      />
      {/* Bottom-Right handle */}
      <div
        onPointerDown={(e) => startResize(e, 'both')}
        style={{
          ...handleStyle,
          bottom: '-6px',
          right: '-6px',
          width: '12px',
          height: '12px',
          cursor: 'nwse-resize',
          borderRadius: '50%',
        }}
      />
    </>
  );
}
