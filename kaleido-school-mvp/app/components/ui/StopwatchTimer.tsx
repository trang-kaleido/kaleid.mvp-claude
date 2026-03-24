/**
 * StopwatchTimer — client-side stopwatch that counts UP from 0:00.
 *
 * AC-3.8: Counts up, can be paused and resumed.
 *
 * WHY use a clock-based approach instead of incrementing a counter each tick?
 * Browsers throttle setInterval in background tabs (to ~once per minute).
 * If we added +1 per tick, a student who switches tabs for 5 minutes would
 * come back and see the timer only advanced a few seconds — very wrong.
 * Instead, we store the absolute wall-clock time of when each running segment
 * began, and compute elapsed = (now - segmentStart) + accumulated.
 * When the tab regains focus, the timer jumps to the correct elapsed time.
 *
 * PAUSE/RESUME DESIGN:
 *   pausedSecondsRef  — total seconds accumulated before the current segment
 *   startTimeRef      — Date.now() at the moment the current segment began
 *
 *   When isPaused flips TRUE:
 *     snapshot = pausedSecondsRef + (now - startTimeRef) / 1000
 *     pausedSecondsRef = snapshot   ← save where we are
 *     clearInterval                 ← stop the ticker
 *
 *   When isPaused flips FALSE:
 *     startTimeRef = Date.now()     ← reset origin for new segment
 *     start setInterval             ← resume counting
 *
 * Parent controls isPaused prop; no pause button lives inside this component.
 */
import { useEffect, useRef, useState } from "react";

interface StopwatchTimerProps {
  /** When true, the timer freezes. When false (default), it counts up. */
  isPaused?: boolean;
}

export function StopwatchTimer({ isPaused = false }: StopwatchTimerProps) {
  // pausedSecondsRef: total elapsed seconds BEFORE the current running segment.
  // Updated each time the timer is paused so we can resume from the right place.
  const pausedSecondsRef = useRef<number>(0);

  // startTimeRef: the wall-clock moment the current running segment began.
  // Reset to Date.now() every time the timer transitions from paused → running.
  const startTimeRef = useRef<number>(Date.now());

  // displaySeconds drives the MM:SS render. Changing it triggers a re-render.
  const [displaySeconds, setDisplaySeconds] = useState<number>(0);

  useEffect(() => {
    if (isPaused) {
      // --- PAUSING ---
      // Compute how many seconds elapsed in this running segment, add to
      // previously accumulated total, then save it for when we resume.
      const segmentElapsed = (Date.now() - startTimeRef.current) / 1000;
      pausedSecondsRef.current = pausedSecondsRef.current + segmentElapsed;

      // No interval to return here — we just freeze the display as-is.
      return;
    }

    // --- RESUMING (or initial mount) ---
    // Reset the segment origin to "now" so elapsed is computed correctly.
    startTimeRef.current = Date.now();

    // Tick every 500ms so the display feels responsive without being wasteful.
    const interval = setInterval(() => {
      const segmentElapsed = (Date.now() - startTimeRef.current) / 1000;
      const totalElapsed = pausedSecondsRef.current + segmentElapsed;
      setDisplaySeconds(Math.floor(totalElapsed));
    }, 500);

    // Cleanup: when isPaused flips TRUE (or component unmounts), clear interval.
    return () => clearInterval(interval);
  }, [isPaused]); // Re-run only when isPaused changes

  // Format displaySeconds as "MM:SS" — e.g. 0 → "00:00", 125 → "02:05"
  const minutes = Math.floor(displaySeconds / 60);
  const seconds = displaySeconds % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="font-mono text-lg font-semibold text-gray-700">
      {display}
    </div>
  );
}
