import { useEffect, useRef } from "react";

/**
 * Runs `callback` every `ms` milliseconds, but ONLY while the document is visible.
 * Pauses the timer when the tab is hidden and resumes (without burst) when visible again.
 *
 * Prevents:
 * - Background CPU/battery drain from idle tabs
 * - "Burst" of throttled callbacks when returning to the tab
 */
export function useVisibleInterval(callback: () => void, ms: number) {
  const cbRef = useRef(callback);

  useEffect(() => {
    cbRef.current = callback;
  });

  useEffect(() => {
    let id: number | undefined;

    const stop = () => {
      if (id !== undefined) {
        clearInterval(id);
        id = undefined;
      }
    };

    const start = () => {
      stop();
      id = window.setInterval(() => cbRef.current(), ms);
    };

    const onVis = () => {
      if (document.visibilityState === "visible") {
        // Fire once immediately so the UI is up-to-date on return,
        // then resume the interval cleanly (no throttled burst).
        cbRef.current();
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === "visible") {
      start();
    }

    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ms]);
}