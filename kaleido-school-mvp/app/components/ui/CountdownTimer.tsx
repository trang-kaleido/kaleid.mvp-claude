/**
 * CountdownTimer — client-side countdown from N minutes to 0:00.
 *
 * AC-3.3: Freezes at 00:00 — never goes negative.
 * AC-3.4: No pause button — timer runs continuously once mounted.
 *
 * WHY use a ref for endTime instead of tracking seconds remaining?
 * Browsers throttle setInterval in background tabs to roughly once per minute.
 * If we counted down by subtracting 1 each tick, switching tabs for 10 minutes
 * could cause 10 minutes of "lost" time when returning. By storing the absolute
 * end time in a ref and computing remaining = endTime - Date.now() each tick,
 * the display jumps to the correct time when the tab regains focus — no drift.
 */
import { useEffect, useRef, useState } from "react";

interface CountdownTimerProps {
  /** How many minutes to count down from (e.g. 40 for P0) */
  durationMinutes: number;
  /** Optional callback — fires once when the timer reaches 0:00 */
  onExpire?: () => void;
}

export function CountdownTimer({ durationMinutes, onExpire }: CountdownTimerProps) {
  // endTime is stored in a ref, not state, because it never changes after mount.
  // Refs persist across re-renders without triggering them.
  const endTimeRef = useRef<number>(
    Date.now() + durationMinutes * 60 * 1000
  );

  // secondsLeft is state because changing it needs to trigger a re-render.
  // We initialise to the full duration so the display is correct immediately.
  const [secondsLeft, setSecondsLeft] = useState<number>(
    durationMinutes * 60
  );

  useEffect(() => {
    // setInterval fires every 500ms (half a second) so the display feels responsive.
    // 1000ms would mean the display could lag by up to 1s; 500ms keeps it snappy.
    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.round((endTimeRef.current - Date.now()) / 1000)
      );
      setSecondsLeft(remaining);

      if (remaining === 0) {
        // Stop the interval — no point continuing to fire at 0:00.
        clearInterval(interval);
        // Notify the parent if it wants to react (e.g. show a message).
        onExpire?.();
      }
    }, 500);

    // Cleanup: clear interval when the component unmounts.
    // (e.g. if the student submits early and the page navigates away)
    return () => clearInterval(interval);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    // endTimeRef and onExpire are intentionally excluded from deps:
    // - endTimeRef.current never changes after mount
    // - onExpire may change on parent re-render but we don't want to restart
    //   the interval when it does (that would reset the timer)
  }, []);

  // Format secondsLeft as "MM:SS" — e.g. 2400 → "40:00", 65 → "01:05"
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="font-mono font-black text-2xl text-gray-900">
      {display}
    </div>
  );
}
