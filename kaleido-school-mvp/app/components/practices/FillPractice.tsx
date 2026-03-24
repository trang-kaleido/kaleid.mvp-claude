/**
 * FillPractice — client-side fill component for L1F (Phrase Fill).
 *
 * L1F: versioned (V1/V2), graded, case-insensitive exact match per blank.
 * ALL blanks must be correct to pass (UX Spec §9.3).
 *
 * HOW THE RETRY CYCLE WORKS (same as MCQ/Scramble):
 *   attemptCount = 0  → show V1  (first try)
 *   attemptCount = 1  → show V2  (after 1st wrong — different distractor phrases)
 *   attemptCount = 2  → show V1  (after 2nd wrong)
 *   wrong on attempt 2 → FORCED ADVANCE
 *
 *   Formula: versionIndex = attemptCount % 2
 *
 * HINT DISPLAY (UX Spec §9.3):
 *   Below each blank: pos_hint label + similar_phrases tags.
 *   Always visible — not a toggle or hover.
 *
 * WRONG FEEDBACK:
 *   Wrong blanks get a red ring on the input.
 *   The useEffect auto-resets after 1200ms (same pattern as MCQ/Scramble).
 *   No correct answer is ever shown on failure.
 */
import { useState, useRef, useEffect } from "react";
import { GradingService } from "~/services/grading.server";

// ─── Type Definitions ─────────────────────────────────────────────────────────
// These match LAB-SCHOOL-CONTRACT §7.8 exactly.

/** One "part" within a context line — either static text or a fill blank. */
interface FillPart {
  type: "text" | "blank";
  text?: string;        // populated when type === "text"
  blank_index?: number; // populated when type === "blank"
}

/** One context line — either a surrounding sentence or the target sentence. */
interface FillContext {
  order: number;
  parts: FillPart[];
  isTarget: boolean;
}

/** Metadata for one blank: the correct answer, POS hint, and similar phrases. */
interface FillBlank {
  index: number;
  answer: string;
  pos_hint: string;
  similar_phrases: string[];
}

/** One question within an L1F version. */
interface PhraseFillQuestion {
  id: string;
  paragraph: string;
  sentence_order: number;
  rhetoric_tag: string;
  prompt: string;
  context: FillContext[];
  blanks: FillBlank[];
}

/** One version of the L1F practice (V1 or V2). */
interface PhraseFillVersion {
  version: "V1" | "V2";
  questions: PhraseFillQuestion[];
}

/** The full L1F practice object from PrepUnit.practices JSONB. */
export interface PracticePhraseFill {
  practice_code: "L1F";
  versions: [PhraseFillVersion, PhraseFillVersion];
}

/**
 * FillAttemptRecord — one attempt on one L1F question.
 * Collected internally; passed to onComplete() and saved to DB by parent.
 */
export interface FillAttemptRecord {
  itemId: string;
  version: "V1" | "V2";
  answers: Record<number, string>; // blank_index → typed text
  pass: boolean;
  failedAdvanced: boolean;
  startedAt: string;
  completedAt: string;
}

interface FillPracticeProps {
  practice: PracticePhraseFill;
  /**
   * Called when all questions in this practice are done (correct or forced).
   * Passes all attempt records for the parent to save to the DB.
   */
  onComplete: (attempts: FillAttemptRecord[]) => void;
  /** When true, prevents interaction (same as MCQ/Scramble). */
  isPaused?: boolean;
}

// ─── Pure Helper Functions ─────────────────────────────────────────────────────

/** Get the version object for a given version index (0 = V1, 1 = V2). */
function getCurrentVersion(
  practice: PracticePhraseFill,
  versionIndex: number
): PhraseFillVersion {
  return practice.versions[versionIndex];
}

/** Get the question object for the current version and question index. */
function getCurrentQuestion(
  practice: PracticePhraseFill,
  versionIndex: number,
  questionIndex: number
): PhraseFillQuestion {
  return getCurrentVersion(practice, versionIndex).questions[questionIndex];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FillPractice({
  practice,
  onComplete,
  isPaused = false,
}: FillPracticeProps) {
  // Which question within this practice (0-based).
  const [questionIndex, setQuestionIndex] = useState<number>(0);

  // How many attempts on the current question.
  // 0 = first try (V1), 1 = second try (V2), 2 = third try (V1 again → force if wrong).
  const [attemptCount, setAttemptCount] = useState<number>(0);

  // Drives feedback UI. null = awaiting input.
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | "forced" | null>(null);

  // Maps blank_index → what the student has typed so far.
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Which blank indices were wrong on the last graded attempt.
  // Used to add a red ring to specific inputs.
  const [wrongIndices, setWrongIndices] = useState<number[]>([]);

  // Timestamp when the current question first rendered.
  const [questionStartedAt, setQuestionStartedAt] = useState<string>(() =>
    new Date().toISOString()
  );

  // All attempt records collected during this practice session.
  const allAttemptsRef = useRef<FillAttemptRecord[]>([]);

  // ── Derived values ──────────────────────────────────────────────────────────

  const versionIndex = attemptCount % 2;
  const versionLabel: "V1" | "V2" = versionIndex === 0 ? "V1" : "V2";
  const currentVersion = getCurrentVersion(practice, versionIndex);
  const totalQuestions = currentVersion.questions.length;
  const currentQuestion = getCurrentQuestion(practice, versionIndex, questionIndex);

  // ── Auto-reset after "wrong" feedback (1200ms, same as MCQ/Scramble) ─────────

  // When the student gets a wrong answer (not forced), show the red rings for
  // 1200ms, then auto-reset so the next version of the same question appears.
  // NOTE: attemptCount is already incremented before this effect fires
  // (React batches the setState calls in handleSubmit). So versionIndex will
  // correctly reflect the new version when inputs rerender.
  useEffect(() => {
    if (lastResult !== "wrong") return;

    const timer = setTimeout(() => {
      setLastResult(null);
      setAnswers({});
      setWrongIndices([]);
    }, 1200);

    return () => clearTimeout(timer);
  }, [lastResult]); // eslint-disable-line react-hooks/exhaustive-deps
  // (practice, attemptCount, questionIndex excluded intentionally — see comment above)

  // ── Reset per-question state when moving to a new question ──────────────────

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setQuestionStartedAt(new Date().toISOString());
    setAnswers({});
    setWrongIndices([]);
    setLastResult(null);
  }, [questionIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Event handlers ───────────────────────────────────────────────────────────

  /**
   * handleSubmit — grade all blanks and determine correct / wrong / forced.
   *
   * Uses GradingService.gradeFillBlanks() which returns a pass flag plus
   * the specific blank indices that were wrong.
   */
  function handleSubmit() {
    if (lastResult !== null || isPaused) return;

    const { pass, wrongIndices: newWrongIndices } = GradingService.gradeFillBlanks(
      answers,
      currentQuestion.blanks
    );
    const now = new Date().toISOString();

    if (pass) {
      setLastResult("correct");
      allAttemptsRef.current.push({
        itemId: currentQuestion.id,
        version: versionLabel,
        answers: { ...answers },
        pass: true,
        failedAdvanced: false,
        startedAt: questionStartedAt,
        completedAt: now,
      });
    } else if (attemptCount < 2) {
      // Wrong — show red rings, auto-reset to next version after 1200ms.
      setWrongIndices(newWrongIndices);
      setLastResult("wrong");
      allAttemptsRef.current.push({
        itemId: currentQuestion.id,
        version: versionLabel,
        answers: { ...answers },
        pass: false,
        failedAdvanced: false,
        startedAt: questionStartedAt,
        completedAt: now,
      });
      // Increment AFTER recording (so the record shows the version that was displayed).
      setAttemptCount((prev) => prev + 1);
    } else {
      // 3rd failure — forced advance.
      setLastResult("forced");
      allAttemptsRef.current.push({
        itemId: currentQuestion.id,
        version: versionLabel,
        answers: { ...answers },
        pass: false,
        failedAdvanced: true,
        startedAt: questionStartedAt,
        completedAt: now,
      });
    }
  }

  /**
   * handleAdvance — move to the next question, or end the practice.
   * Called by "Next →" (correct) or "Continue →" (forced).
   */
  function handleAdvance() {
    if (questionIndex + 1 < totalQuestions) {
      setQuestionIndex((prev) => prev + 1);
      setAttemptCount(0);
      // Per-question state (answers, wrongIndices, lastResult, timestamp) is
      // reset by the useEffect watching questionIndex.
    } else {
      onComplete(allAttemptsRef.current);
    }
  }

  // ── Render helpers ───────────────────────────────────────────────────────────

  /**
   * renderContextLine — one context row.
   *
   * Non-target: join all text parts → gray italic prose (surrounding context).
   * Target:     inline mix of text spans and blank inputs with hints below.
   */
  function renderContextLine(ctx: FillContext) {
    if (!ctx.isTarget) {
      // Non-target: join text parts and display as gray surrounding context.
      const text = ctx.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text ?? "")
        .join("");
      return (
        <p key={ctx.order} className="text-sm leading-relaxed text-gray-400 italic">
          {text}
        </p>
      );
    }

    // Target: inline render — text spans + blank inputs.
    return (
      <div key={ctx.order} className="flex flex-wrap items-end gap-x-1 gap-y-4">
        {ctx.parts.map((part, partIdx) => {
          if (part.type === "text") {
            return (
              <span key={partIdx} className="text-sm text-gray-800">
                {part.text}
              </span>
            );
          }

          // Blank input — look up the FillBlank metadata for this index.
          const blankIdx = part.blank_index!;
          const blankMeta = currentQuestion.blanks.find((b) => b.index === blankIdx);
          const isWrong = wrongIndices.includes(blankIdx) && lastResult === "wrong";

          return (
            <div key={partIdx} className="flex flex-col items-start gap-0.5">
              {/* The text input for this blank */}
              <input
                type="text"
                value={answers[blankIdx] ?? ""}
                onChange={(e) => {
                  if (lastResult !== null || isPaused) return;
                  setAnswers((prev) => ({ ...prev, [blankIdx]: e.target.value }));
                }}
                disabled={lastResult !== null || isPaused}
                className={`rounded border px-2 py-1 text-sm w-32 transition-colors ${
                  isWrong
                    ? "border-red-500 ring-2 ring-red-400 bg-red-50"
                    : "border-gray-300 bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-300 focus:outline-none"
                }`}
                aria-label={`Blank ${blankIdx + 1}`}
              />
              {/* POS hint — always visible below the input (UX Spec §9.3) */}
              {blankMeta?.pos_hint && (
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                  {blankMeta.pos_hint}
                </span>
              )}
              {/* Similar phrases — always visible as small gray tags */}
              {blankMeta && blankMeta.similar_phrases.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {blankMeta.similar_phrases.map((phrase, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500"
                    >
                      {phrase}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Submit button state ──────────────────────────────────────────────────────

  // Enable submit as soon as at least one blank has text.
  // Grading will handle any blanks left empty (they won't match the answer).
  const hasAnyAnswer = currentQuestion.blanks.some(
    (b) => (answers[b.index] ?? "").trim().length > 0
  );
  const canSubmit = hasAnyAnswer && lastResult === null && !isPaused;

  // ── Main render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* ── Progress indicator ──────────────────────────────────────────── */}
      <p className="text-sm text-gray-500">
        Question {questionIndex + 1} of {totalQuestions}
      </p>

      {/* ── Instruction prompt ──────────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm leading-relaxed text-gray-800">
          {currentQuestion.prompt}
        </p>
      </div>

      {/* ── Context sentences with inline blanks ────────────────────────── */}
      {/*
        Sorted by order so surrounding context appears in the correct position
        relative to the target sentence.
      */}
      <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        {[...currentQuestion.context]
          .sort((a, b) => a.order - b.order)
          .map((ctx) => renderContextLine(ctx))}
      </div>

      {/* ── Submit button (shown when awaiting input) ────────────────────── */}
      {lastResult === null && (
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="self-end rounded-lg bg-gray-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Check →
        </button>
      )}

      {/* ── Feedback area ──────────────────────────────────────────────────── */}

      {lastResult === "wrong" && (
        <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-3">
          <span className="text-lg text-red-600 font-bold" aria-label="Incorrect">
            ✗
          </span>
          {/* No correct answer shown — UX Spec §10 */}
          <p className="text-sm text-red-700">Not quite — try again.</p>
        </div>
      )}

      {lastResult === "correct" && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 p-3">
          <div className="flex items-center gap-2">
            <span className="text-lg text-emerald-600 font-bold" aria-label="Correct">
              ✓
            </span>
            <p className="text-sm text-emerald-700 font-medium">Correct!</p>
          </div>
          <button
            onClick={handleAdvance}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {lastResult === "forced" && (
        <div className="flex flex-col gap-3 rounded-lg border border-orange-300 bg-orange-50 p-3">
          <div className="flex items-center gap-2">
            <span
              className="text-lg text-orange-600 font-bold"
              aria-label="All attempts used"
            >
              !
            </span>
            {/* AC-3.16: exact copy */}
            <p className="text-sm text-orange-700">
              You&apos;ve used all attempts — keep going.
            </p>
          </div>
          <button
            onClick={handleAdvance}
            className="self-end rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
          >
            Continue →
          </button>
        </div>
      )}

    </div>
  );
}
