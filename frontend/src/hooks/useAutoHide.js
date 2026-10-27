import { useCallback, useEffect, useRef, useState } from 'react';

// 6.4 — Auto-hide: 3 s without mouse movement → element hidden.
const HIDE_DELAY_MS = 3000;

/**
 * Shared auto-hide logic (THEATRE.md §6.4):
 * - visible after mount; hidden after `delayMs` without activity
 * - activity = mousemove / touchstart / keydown (window-level)
 * - `show` cancels a pending hide (used on mouseenter)
 * - `scheduleHide` (re)starts the timer (used on mouseleave)
 * - hidden = opacity 0 + pointer-events none via the `is-hidden` class
 */
export function useAutoHide(delayMs = HIDE_DELAY_MS) {
  const [visible, setVisible] = useState(true);
  const visibleRef = useRef(true);
  const hideTimerRef = useRef(null);

  const show = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (!visibleRef.current) {
      visibleRef.current = true;
      setVisible(true);
    }
  }, []);

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      visibleRef.current = false;
      setVisible(false);
    }, delayMs);
  }, [delayMs]);

  useEffect(() => {
    const onActivity = () => {
      show();
      scheduleHide();
    };
    window.addEventListener('mousemove', onActivity);
    window.addEventListener('touchstart', onActivity);
    window.addEventListener('keydown', onActivity);
    return () => {
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('touchstart', onActivity);
      window.removeEventListener('keydown', onActivity);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [show, scheduleHide]);

  return { visible, show, scheduleHide };
}
