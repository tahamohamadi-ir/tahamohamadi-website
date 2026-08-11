/**
 * Animation Runner
 *
 * Blueprint Part 28: Page JSON Schema (Animations)
 * Runs timeline animations natively using Web Animations API (WAAPI).
 *
 * @module builder/interactions/animation-runner
 */

export interface AnimationKeyframe {
  target: 'self' | string;
  from?: Record<string, string | number>;
  to: Record<string, string | number>;
  duration: number;
  delay?: number;
  easing?: string;
}

export interface AnimationDefinition {
  id: string;
  trigger: {
    type: 'viewport.enter' | 'pointer.click' | 'pointer.hover' | 'page.load';
    once?: boolean;
    target?: string;
  };
  timeline: AnimationKeyframe[];
}

export class AnimationRunner {
  private animations: AnimationDefinition[] = [];
  private intersectionObserver: IntersectionObserver | null = null;
  private hasRun = new Set<string>();

  constructor() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const nodeId = (entry.target as HTMLElement).dataset.builderNode;
            if (nodeId) {
              this.triggerAnimationsForNode('viewport.enter', nodeId);
            }
          }
        });
      }, { threshold: 0.1 });
    }
  }

  public setAnimations(animations: AnimationDefinition[]) {
    this.animations = animations;
  }

  public observe(element: HTMLElement) {
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(element);
    }
  }

  public unobserve(element: HTMLElement) {
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(element);
    }
  }

  public triggerAnimationsForNode(triggerType: string, nodeId: string) {
    const matched = this.animations.filter(
      (a) => a.trigger.type === triggerType && a.trigger.target === nodeId,
    );

    for (const anim of matched) {
      if (anim.trigger.once && this.hasRun.has(anim.id)) continue;
      
      this.playAnimation(anim, nodeId);
      
      if (anim.trigger.once) {
        this.hasRun.add(anim.id);
      }
    }
  }

  private playAnimation(anim: AnimationDefinition, triggerNodeId: string) {
    let currentDelay = 0;

    for (const step of anim.timeline) {
      const targetId = step.target === 'self' ? triggerNodeId : step.target;
      const el = document.querySelector(`[data-builder-node="${targetId}"]`) as HTMLElement;
      
      if (el) {
        const keyframes: Keyframe[] = [];
        if (step.from) keyframes.push(step.from as Keyframe);
        keyframes.push(step.to as Keyframe);

        el.animate(keyframes, {
          duration: step.duration,
          delay: currentDelay + (step.delay || 0),
          easing: step.easing || 'ease',
          fill: 'forwards',
        });
      }

      currentDelay += step.duration + (step.delay || 0);
    }
  }
}
