/**
 * UTXICA Motion Design System & Animation Engine
 * Based on Emil Kowalski's Design Engineering Philosophy & UTXICA.ANIMACAO
 */

export const MOTION_TOKENS = {
  easeOut: 'cubic-bezier(0.23, 1, 0.32, 1)',
  easeInOut: 'cubic-bezier(0.77, 0, 0.175, 1)',
  easeSpring: 'cubic-bezier(0.175, 0.885, 0.32, 1.15)',
  easeSmooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeDrawer: 'cubic-bezier(0.32, 0.72, 0, 1)',
  durationFast: 160,
  durationNormal: 220,
  durationModal: 280,
  durationCounter: 650,
} as const;

/**
 * Pure JavaScript Easing Functions for RAF Tickers
 */
export const EASINGS = {
  // Snappy deceleration - equivalent to cubic-bezier(0.23, 1, 0.32, 1)
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
  // Ultra smooth Apple/Stripe-like curve
  easeOutQuart: (t: number): number => 1 - Math.pow(1 - t, 4),
  // Exponential deceleration for fast response
  easeOutExpo: (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  // Spring-like subtle bounce
  easeOutBack: (t: number): number => {
    const c1 = 1.4;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

export interface AnimateNumberOptions {
  from?: number;
  to: number;
  duration?: number;
  easing?: (t: number) => number;
  decimals?: number;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
}

/**
 * 60FPS Hardware-synchronized requestAnimationFrame counter
 */
export function animateNumber({
  from = 0,
  to,
  duration = MOTION_TOKENS.durationCounter,
  easing = EASINGS.easeOutQuart,
  onUpdate,
  onComplete,
}: AnimateNumberOptions): () => void {
  // Check if user prefers reduced motion
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    onUpdate(to);
    if (onComplete) onComplete();
    return () => {};
  }

  let startTime: number | null = null;
  let rafId: number | null = null;

  const tick = (currentTime: number) => {
    if (startTime === null) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);

    const currentValue = from + (to - from) * easedProgress;
    onUpdate(currentValue);

    if (progress < 1) {
      rafId = requestAnimationFrame(tick);
    } else {
      onUpdate(to);
      if (onComplete) onComplete();
    }
  };

  rafId = requestAnimationFrame(tick);

  // Return cancel function
  return () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
  };
}

/**
 * Stagger child elements using Web Animations API (WAAPI)
 * Runs off the main thread where possible for zero frame drops.
 */
export function staggerEntrance(
  container: HTMLElement | null,
  childSelector: string,
  options: {
    staggerMs?: number;
    durationMs?: number;
    distancePx?: number;
  } = {}
) {
  if (!container) return;

  const isReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReduced) return;

  const { staggerMs = 40, durationMs = 240, distancePx = 8 } = options;
  const elements = container.querySelectorAll<HTMLElement>(childSelector);

  elements.forEach((el, index) => {
    el.animate(
      [
        { opacity: '0', transform: `translateY(${distancePx}px)` },
        { opacity: '1', transform: 'translateY(0px)' },
      ],
      {
        duration: durationMs,
        delay: index * staggerMs,
        easing: MOTION_TOKENS.easeOut,
        fill: 'both',
      }
    );
  });
}

/**
 * Gentle tactile haptic feedback for supported mobile devices
 */
export function triggerHaptic(type: 'light' | 'medium' | 'success' = 'light') {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;
  try {
    if (type === 'light') navigator.vibrate(10);
    else if (type === 'medium') navigator.vibrate(20);
    else if (type === 'success') navigator.vibrate([12, 40, 18]);
  } catch {
    // Ignore unsupported
  }
}
