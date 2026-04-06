/**
 * MCQPractice — client-side MCQ practice component for L4M, L3M, L2M, L1M.
 *
 * This component manages the FULL retry cycle for ONE practice (e.g. all L4M questions).
 * The parent (PracticeRenderer) calls onComplete() when all questions are done.
 *
 * HOW THE RETRY CYCLE WORKS:
 *   Each practice has two versions: V1 (versions[0]) and V2 (versions[1]).
 *   V1 and V2 have the SAME question stems but DIFFERENT distractors (wrong options).
 *
 *   attemptCount = 0  → show V1  (first try)
 *   attemptCount = 1  → show V2  (after 1st wrong answer — different distractors help)
 *   attemptCount = 2  → show V1  (after 2nd wrong answer)
 *   attemptCount >= 2 → FORCED ADVANCE (after 3rd wrong answer)
 *
 *   Formula: versionIndex = attemptCount % 2  (0 = V1, 1 = V2)
 *
 * HOW STATE IS MANAGED (no server round-trips mid-practice):
 *   All state lives in this component. Attempt records are collected in allAttemptsRef
 *   (a ref to avoid stale closures) and passed to onComplete() when the practice ends.
 *   The PARENT (PracticeRenderer) handles saving to the database via useFetcher.
 */
import { useState, useRef, useEffect } from "react";
import { GradingService } from "~/services/grading";

// ─── Type Definitions ─────────────────────────────────────────────────────────

/**
 * MCQQuestion — one question item within a version.
 * Matches LAB-SCHOOL-CONTRACT §7.3 MCQQuestion interface.
 *
 * `context` is a string block rendered above the prompt:
 *   - L3M_POV: the full paragraph text the student should identify
 *   - L2M_POV: the PoV argument + logic text (multiline)
 *   - L4M/L2M/L1M: supporting sentence or paragraph block
 */
interface MCQQuestion {
  id: string;             // e.g. "L4M-1"
  prompt: string;         // the question stem (same in V1 and V2)
  context?: string;       // optional supporting text rendered above the prompt
  options: string[];      // 5 option strings (different between V1 and V2)
  correct_index: number;  // 0-based index of the correct option
}

/**
 * PracticeMCQ — the full practice object from the prep_unit.practices JSONB.
 * Matches LAB-SCHOOL-CONTRACT §7.3 PracticeMCQ interface.
 */
export interface PracticeMCQ {
  practice_code: "L4M" | "L3M" | "L2M" | "L1M" | "L3M_POV" | "L2M_POV";
  versions: [
    { version: "V1"; questions: MCQQuestion[] },
    { version: "V2"; questions: MCQQuestion[] },
  ];
}

/**
 * AttemptRecord — one attempt on one MCQ question item.
 * Collected internally; passed to onComplete() and then saved to DB by parent.
 */
export interface AttemptRecord {
  itemId: string;         // e.g. "L4M-1" (the question's id field)
  version: "V1" | "V2";  // which version was shown for this attempt
  selectedIndex: number;  // which option the student picked (0-based)
  pass: boolean;          // true if correct
  failedAdvanced: boolean; // true if this was a forced advance (3rd wrong answer)
  startedAt: string;      // ISO timestamp — when this question started rendering
  completedAt: string;    // ISO timestamp — when the student submitted this answer
}

interface MCQPracticeProps {
  practice: PracticeMCQ;
  /**
   * Called when all questions in this practice are done (correct or forced).
   * Passes the full list of attempt records for the parent to save to the DB.
   */
  onComplete: (attempts: AttemptRecord[]) => void;
  /**
   * Whether the parent has paused the session (used to prevent interaction).
   * When true, buttons are disabled.
   */
  isPaused?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MCQPractice({ practice, onComplete, isPaused = false }: MCQPracticeProps) {
  // Which question (0-based) within this practice are we on?
  // A practice can have multiple questions (e.g. L4M might have 3 questions).
  const [questionIndex, setQuestionIndex] = useState<number>(0);

  // How many attempts has the student made on the CURRENT question?
  // 0 = first try, 1 = second try, 2 = third try (then force if wrong)
  const [attemptCount, setAttemptCount] = useState<number>(0);

  // Drives the feedback UI:
  //   null    = awaiting answer (show question normally)
  //   "correct" = green check, show "Next →" button
  //   "wrong"   = red X, auto-advance to next version after short delay
  //   "forced"  = all 3 attempts used, show "Continue →" button
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | "forced" | null>(null);

  // Which option did the student click? Used for visual highlighting.
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Records the wall-clock time when the current question first rendered.
  // Stored as an ISO string so it's ready to insert into AttemptRecord.
  const [questionStartedAt, setQuestionStartedAt] = useState<string>(() => new Date().toISOString());

  // All attempt records collected so far during this practice session.
  // We use a ref (not state) to avoid stale closures in handleAnswer callbacks.
  // The ref is always current without triggering re-renders.
  const allAttemptsRef = useRef<AttemptRecord[]>([]);

  // ── Derived values ──────────────────────────────────────────────────────────

  // Which version to show: V1 when attemptCount is even, V2 when odd.
  // versionIndex 0 = V1 (practice.versions[0]), 1 = V2 (practice.versions[1]).
  const versionIndex = attemptCount % 2;
  const currentVersion = practice.versions[versionIndex];
  const currentQuestion = currentVersion.questions[questionIndex];

  // Human-readable version label for display (not currently shown, but useful for debugging).
  const versionLabel: "V1" | "V2" = versionIndex === 0 ? "V1" : "V2";

  // Total questions in this practice (V1 and V2 must have the same count).
  const totalQuestions = practice.versions[0].questions.length;

  // ── Auto-advance after "wrong" feedback ─────────────────────────────────────

  // When the student gets a wrong answer (not forced), we show the red X briefly,
  // then automatically reset so the next version of the same question appears.
  // This implements AC-3.12: "V2 auto-loads immediately."
  useEffect(() => {
    if (lastResult !== "wrong") return;

    // Show the red X for 1200ms, then reset to show the next version.
    const timer = setTimeout(() => {
      setLastResult(null);
      setSelectedIndex(null);
      // Reset questionStartedAt for the next attempt on the same question.
      setQuestionStartedAt(new Date().toISOString());
    }, 1200);

    // If the component unmounts before the timer fires, clear it to avoid
    // calling setState on an unmounted component.
    return () => clearTimeout(timer);
  }, [lastResult]);

  // ── Reset questionStartedAt when moving to a new question ──────────────────

  // This is called by handleAdvance when moving to the next question.
  // We use the effect to ensure the timestamp is fresh when the new question renders.
  // (The questionIndex dependency means this fires AFTER the state update.)
  // NOTE: We skip the initial mount (index=0) because it's set in useState initializer.
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setQuestionStartedAt(new Date().toISOString());
  }, [questionIndex]);

  // ── Event handlers ──────────────────────────────────────────────────────────

  /**
   * handleAnswer — called when the student clicks an option button.
   *
   * Determines correct/wrong/forced, records the attempt, and updates state.
   *
   * RETRY LOGIC (from AC-3.12, AC-3.16, AC-3.17):
   *   - Correct → lastResult="correct", wait for "Next →" button
   *   - Wrong (attemptCount < 2) → lastResult="wrong", auto-advance to next version
   *   - Wrong (attemptCount >= 2) → lastResult="forced", wait for "Continue →" button
   */
  function handleAnswer(clickedIndex: number) {
    // Ignore clicks while feedback is showing or session is paused.
    if (lastResult !== null || isPaused) return;

    setSelectedIndex(clickedIndex);

    const isCorrect = GradingService.gradeMCQ(clickedIndex, currentQuestion.correct_index);
    const now = new Date().toISOString();

    if (isCorrect) {
      // ── CORRECT ANSWER ──────────────────────────────────────────────────────
      setLastResult("correct");

      // Record the attempt.
      allAttemptsRef.current.push({
        itemId: currentQuestion.id,
        version: versionLabel,
        selectedIndex: clickedIndex,
        pass: true,
        failedAdvanced: false,
        startedAt: questionStartedAt,
        completedAt: now,
      });
    } else if (attemptCount < 2) {
      // ── WRONG ANSWER (not yet at 3rd attempt) ──────────────────────────────
      // Show red X briefly; useEffect will auto-reset after 1200ms.
      setLastResult("wrong");

      // Record the attempt (pass=false, not a forced advance).
      allAttemptsRef.current.push({
        itemId: currentQuestion.id,
        version: versionLabel,
        selectedIndex: clickedIndex,
        pass: false,
        failedAdvanced: false,
        startedAt: questionStartedAt,
        completedAt: now,
      });

      // Increment attempt count AFTER recording (so the record shows the version
      // that was actually displayed, not the next one).
      setAttemptCount((prev) => prev + 1);
    } else {
      // ── FORCED ADVANCE (3rd wrong answer, attemptCount === 2) ───────────────
      // AC-3.16: Show "You've used all attempts — keep going." + "Continue →"
      setLastResult("forced");

      // AC-3.17: Record with failedAdvanced=true.
      allAttemptsRef.current.push({
        itemId: currentQuestion.id,
        version: versionLabel,
        selectedIndex: clickedIndex,
        pass: false,
        failedAdvanced: true,
        startedAt: questionStartedAt,
        completedAt: now,
      });
    }
  }

  /**
   * handleAdvance — called when "Next →" (correct) or "Continue →" (forced) is clicked.
   *
   * Moves to the next question, or ends the practice if all questions are done.
   */
  function handleAdvance() {
    if (questionIndex + 1 < totalQuestions) {
      // More questions remaining in this practice — move to the next one.
      setQuestionIndex((prev) => prev + 1);
      setAttemptCount(0);      // Reset attempt count for the new question.
      setLastResult(null);
      setSelectedIndex(null);
      // questionStartedAt is reset by the useEffect watching questionIndex.
    } else {
      // All questions in this practice are done — call onComplete with all records.
      // The parent (PracticeRenderer) will save these to the DB and move on.
      onComplete(allAttemptsRef.current);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* ── Progress indicator ─────────────────────────────────────────── */}
      <p className="text-sm text-gray-500">
        Question {questionIndex + 1} of {totalQuestions}
      </p>

      {/* ── Context block (optional) ───────────────────────────────────── */}
      {/* Shown above the prompt when the Lab includes supporting text. */}
      {currentQuestion.context && (
        <div className="rounded-lg border-2 border-blue-400 bg-blue-50 p-4">
          <p className="text-xs font-black uppercase tracking-widest text-blue-500 mb-2">
            Context
          </p>
          <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-line">
            {currentQuestion.context}
          </p>
        </div>
      )}

      {/* ── Question prompt ────────────────────────────────────────────── */}
      <div className="rounded-lg border-2 border-gray-500 bg-white p-4 shadow-[3px_3px_0px_0px_rgba(17,24,39,0.5)]">
        <p className="text-sm leading-relaxed text-gray-800">
          {currentQuestion.prompt}
        </p>
      </div>

      {/* ── Answer options ─────────────────────────────────────────────── */}
      {/* 5 option buttons — the student clicks one to answer. */}
      <div className="flex flex-col gap-2">
        {currentQuestion.options.map((option, idx) => {
          // Determine the visual state of each button after an answer is submitted.
          // While lastResult is null (awaiting answer), all buttons look the same.
          let buttonClass =
            "w-full rounded-lg border-2 p-3 text-left text-sm transition-all";

          if (lastResult === null) {
            // Awaiting answer: normal interactive style.
            buttonClass += " border-gray-800 bg-white text-gray-800 hover:border-blue-600 hover:bg-blue-50";
          } else if (idx === selectedIndex && lastResult === "correct") {
            // The selected option was correct: green highlight.
            buttonClass += " border-emerald-600 bg-emerald-600 text-white font-bold";
          } else if (idx === selectedIndex && (lastResult === "wrong" || lastResult === "forced")) {
            // The selected option was wrong: red highlight.
            buttonClass += " border-red-500 bg-red-50 text-red-800 font-semibold";
          } else {
            // Other unselected options after an answer: muted.
            buttonClass += " border-gray-300 bg-gray-50 text-gray-400";
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              // Disable when feedback is showing (answer already recorded) or paused.
              disabled={lastResult !== null || isPaused}
              className={buttonClass}
            >
              {/* Option letter prefix: A, B, C, D, E */}
              <span className="font-medium mr-2">
                {String.fromCharCode(65 + idx)}.
              </span>
              {option}
            </button>
          );
        })}
      </div>

      {/* ── Feedback area ──────────────────────────────────────────────── */}
      {/*
        Shown after the student submits an answer.
        Wrong: red X message (auto-disappears after 1200ms, handled by useEffect above).
        Correct: green check + "Next →" button.
        Forced: orange warning + "Continue →" button.
      */}
      {lastResult === "wrong" && (
        <div className="flex items-center gap-2 rounded-lg border-2 border-red-500 bg-red-50 p-3">
          {/* ✗ symbol */}
          <span className="text-lg text-red-600 font-bold" aria-label="Incorrect">✗</span>
          <p className="text-sm text-red-700">
            Not quite — try again.
          </p>
        </div>
      )}

      {lastResult === "correct" && (
        <div className="flex items-center justify-between rounded-lg border-2 border-emerald-500 bg-emerald-50 p-3">
          <div className="flex items-center gap-2">
            {/* ✓ symbol */}
            <span className="text-lg text-emerald-600 font-bold" aria-label="Correct">✓</span>
            <p className="text-sm text-emerald-700 font-medium">Correct!</p>
          </div>
          {/* AC-3.18: "Next →" on correct answer */}
          <button
            onClick={handleAdvance}
            className="rounded-lg bg-emerald-600 border-2 border-gray-500 px-5 py-2 text-sm font-bold text-white shadow-[2px_2px_0px_0px_rgba(17,24,39,0.5)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            Next →
          </button>
        </div>
      )}

      {lastResult === "forced" && (
        <div className="flex flex-col gap-3 rounded-lg border-2 border-orange-400 bg-orange-50 p-3">
          <div className="flex items-center gap-2">
            <span className="text-lg text-orange-600 font-bold" aria-label="All attempts used">!</span>
            {/* AC-3.16: exact copy as specified */}
            <p className="text-sm text-orange-700">
              You&apos;ve used all attempts — keep going.
            </p>
          </div>
          {/* AC-3.16: "Continue →" button */}
          <button
            onClick={handleAdvance}
            className="self-end rounded-lg bg-orange-500 border-2 border-gray-500 px-5 py-2 text-sm font-bold text-white shadow-[2px_2px_0px_0px_rgba(17,24,39,0.5)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            Continue →
          </button>
        </div>
      )}

    </div>
  );
}
