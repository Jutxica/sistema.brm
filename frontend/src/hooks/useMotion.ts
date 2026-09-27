import { useState, useEffect, useRef } from 'react';
import { animateNumber, EASINGS, triggerHaptic } from '../lib/motion';

/**
 * Hook to smoothly animate a numeric counter on mount or when the target changes
 */
export function useAnimatedNumber(
  target: number,
  options: {
    duration?: number;
    decimals?: number;
    delay?: number;
    from?: number;
  } = {}
): number {
  const { duration = 700, decimals = 0, delay = 0, from = 0 } = options;
  const [current, setCurrent] = useState<number>(from);
  const prevTarget = useRef<number>(from);

  useEffect(() => {
    let cancelFn: (() => void) | null = null;
    let timerId: NodeJS.Timeout | null = null;

    const startAnimation = () => {
      cancelFn = animateNumber({
        from: prevTarget.current,
        to: target,
        duration,
        easing: EASINGS.easeOutQuart,
        onUpdate: (val) => {
          if (decimals === 0) {
            setCurrent(Math.round(val));
          } else {
            setCurrent(Number(val.toFixed(decimals)));
          }
        },
        onComplete: () => {
          prevTarget.current = target;
          setCurrent(target);
        },
      });
    };

    if (delay > 0) {
      timerId = setTimeout(startAnimation, delay);
    } else {
      startAnimation();
    }

    return () => {
      if (timerId) clearTimeout(timerId);
      if (cancelFn) cancelFn();
    };
  }, [target, duration, decimals, delay]);

  return current;
}

/**
 * Hook to detect if user has requested reduced motion in their OS
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);

    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/**
 * Hook to trigger tactile feedback on clicks/presses
 */
export function useTactileClick(type: 'light' | 'medium' | 'success' = 'light') {
  return () => {
    triggerHaptic(type);
  };
}

/**
 * Utility to calculate stagger inline style for list items
 */
export function staggerStyle(index: number) {
  return {
    ['--stagger-index' as string]: index,
  };
}
