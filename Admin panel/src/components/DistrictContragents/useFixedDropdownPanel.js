import { useLayoutEffect, useState, useCallback } from 'react';

/**
 * Modal overflow dan tashqarida ko‘rinishi uchun portal + fixed joylashuv.
 */
export function useFixedDropdownPanel(triggerRef, enabled) {
  const [box, setBox] = useState(null);

  const update = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 4;
    const spaceBelow = window.innerHeight - r.bottom - gap;
    const cap = Math.min(window.innerHeight * 0.75, 28 * 16);
    /** Ko‘rinish oynasidan chiqmasin; modal tashqarisida to‘liq scroll */
    const maxHeight = Math.min(spaceBelow > 8 ? spaceBelow : cap, cap);

    setBox({
      top: r.bottom + gap,
      left: r.left,
      width: r.width,
      maxHeight,
    });
  }, [triggerRef]);

  useLayoutEffect(() => {
    if (!enabled) {
      setBox(null);
      return;
    }
    update();
    const el = triggerRef.current;
    const ro = typeof ResizeObserver !== 'undefined' && el ? new ResizeObserver(update) : null;
    if (el && ro) ro.observe(el);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const id = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(id);
      ro?.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [enabled, update, triggerRef]);

  return box;
}
