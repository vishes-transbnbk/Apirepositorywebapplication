import { useEffect, useRef } from 'react';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
];

export function useInactivityTimer(onTimeout: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(onTimeout, INACTIVITY_TIMEOUT);
    };

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetTimer)
    );
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, [onTimeout]);
}