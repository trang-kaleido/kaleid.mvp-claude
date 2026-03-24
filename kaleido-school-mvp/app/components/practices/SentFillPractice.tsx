/**
 * SentFillPractice — client-side component for L2F (Sentence Fill).
 *
 * L2F: unversioned, NO grading — always advances on submit (UX Spec §9.4).
 * The student types a body sentence into a textarea. The input is stored in
 * the DB for educator reference but is never graded (pass: null).
 *
 * KEY DIFFERENCES from L1F:
 *   - No versions (no V1/V2) — questions array lives at the practice root level
 *   - No grading logic — pass is always null
 *   - No retry cycle — one attempt per question, always advances
 *   - No red X feedback — no lastResult state at all
 *   - hint_sentences[] are recall cues (NOT the answer) — shown below textarea
 *   - rhetoric_hint shown below the prompt as a small label
 */
import { useState, useRef, useEffect } from "react";

// ─── Type Definitions ─────────────────────────────────────────────────────────
// These match LAB-SCHOOL-CONTRACT §7.9 exactly.

/** One context line in the L2F practice — surrounding sentence or target gap. */
interface SentFillContext {
  order: number;
  text: string;
  isTarget: boolean;
}

/** One question within the L2F practice. */
interface SentFillQuestion {
  id: string;
  paragraph: string;
  sentence_order: number;
  rhetoric_tag: string;
  rhetoric_hint: string;      // recall cue for the student — shown below prompt
  hint_sentences: string[];   // additional recall cues — shown below textarea
  context: SentFillContext[];
  prompt: string;
}

/** The full L2F practice object from PrepUnit.practices JSONB. */
export interface PracticeSentFill {
  practice_code: "L2F";
  questions: SentFillQuestion[]; // L2F has no versions — questions live at root level
}

/**
 * SentFillAttemptRecord — one L2F submission.
 * version and pass are always null (ungraded, unversioned).
 */
export interface SentFillAttemptRecord {
  itemId: string;
  version: null;
  text: string;           // what the student typed (stored, not surfaced in EC for MVP)
  pass: null;
  failedAdvanced: false;
  startedAt: string;
  completedAt: string;
}

interface SentFillPracticeProps {
  practice: PracticeSentFill;
  /**
   * Called when all questions in this practice are done.
   * Passes all attempt records for the parent to save to the DB.
   */
  onComplete: (attempts: SentFillAttemptRecord[]) => void;
  /** When true, prevents interaction (textarea + button disabled). */
  isPaused?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SentFillPractice({
  practice,
  onComplete,
  isPaused = false,
}: SentFillPracticeProps) {
  // Which question (0-based) within this practice.
  const [questionIndex, setQuestionIndex] = useState<number>(0);

  // The student's current textarea input.
  const [textValue, setTextValue] = useState<string>("");

  // Timestamp when the current question first rendered.
  const [questionStartedAt, setQuestionStartedAt] = useState<string>(() =>
    new Date().toISOString()
  );

  // All attempt records collected during this practice session.
  const allAttemptsRef = useRef<SentFillAttemptRecord[]>([]);

  // ── Derived values ──────────────────────────────────────────────────────────

  const totalQuestions = practice.questions.length;
  const currentQuestion = practice.questions[questionIndex];

  // ── Reset state when advancing to a new question ─────────────────────────────

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setQuestionStartedAt(new Date().toISOString());
    setTextValue("");
  }, [questionIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Event handler ────────────────────────────────────────────────────────────

  /**
   * handleSubmit — record the attempt and advance immediately.
   *
   * L2F is always pass: null (no grading). No delay, no feedback state.
   * The student is immediately moved to the next question or the practice ends.
   */
  function handleSubmit() {
    if (isPaused || textValue.trim().length === 0) return;

    const now = new Date().toISOString();

    allAttemptsRef.current.push({
      itemId: currentQuestion.id,
      version: null,
      text: textValue,
      pass: null,
      failedAdvanced: false,
      startedAt: questionStartedAt,
      completedAt: now,
    });

    if (questionIndex + 1 < totalQuestions) {
      // More questions — advance immediately.
      // textValue and timestamp are reset by the useEffect on questionIndex.
      setQuestionIndex((prev) => prev + 1);
    } else {
      // Last question done — end the practice.
      onComplete(allAttemptsRef.current);
    }
  }

  // ── Main render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* ── Progress indicator ──────────────────────────────────────────── */}
      <p className="text-sm text-gray-500">
        Question {questionIndex + 1} of {totalQuestions}
      </p>

      {/* ── Instruction prompt + rhetoric hint ──────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm leading-relaxed text-gray-800">
          {currentQuestion.prompt}
        </p>
        {/* rhetoric_hint — a recall cue label, not the answer (UX Spec §9.4) */}
        {currentQuestion.rhetoric_hint && (
          <p className="mt-2 text-xs text-gray-400 italic">
            {currentQuestion.rhetoric_hint}
          </p>
        )}
      </div>

      {/* ── Context sentences — surrounding sentences + gap placeholder ──── */}
      {/*
        Sorted by order. The target slot renders as a dashed placeholder
        so the student can see where their sentence belongs in the paragraph.
      */}
      <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
        {[...currentQuestion.context]
          .sort((a, b) => a.order - b.order)
          .map((ctx) =>
            ctx.isTarget ? (
              // Target: visual gap placeholder showing where the sentence goes.
              <div
                key={ctx.order}
                className="rounded border-2 border-dashed border-blue-300 bg-blue-50 px-3 py-2"
              >
                <span className="text-xs text-blue-400 italic">
                  ✏️ Write the missing sentence below…
                </span>
              </div>
            ) : (
              // Non-target: surrounding context in gray italic.
              <p key={ctx.order} className="text-sm leading-relaxed text-gray-400 italic">
                {ctx.text}
              </p>
            )
          )}
      </div>

      {/* ── Textarea for student input ───────────────────────────────────── */}
      <textarea
        value={textValue}
        onChange={(e) => {
          if (isPaused) return;
          setTextValue(e.target.value);
        }}
        disabled={isPaused}
        placeholder="Write the missing sentence here…"
        rows={4}
        className="w-full rounded-lg border border-gray-300 p-3 text-sm leading-relaxed text-gray-800 resize-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
      />

      {/* ── Hint sentences — recall cues below textarea (UX Spec §9.4) ──── */}
      {/*
        These are NOT the answer — they are contextual recall prompts to help
        the student remember the content. Stored in the DB but not shown in EC.
      */}
      {currentQuestion.hint_sentences.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Recall cues
          </p>
          {currentQuestion.hint_sentences.map((hint, i) => (
            <p key={i} className="text-xs text-gray-500 italic">
              {hint}
            </p>
          ))}
        </div>
      )}

      {/* ── Submit button ────────────────────────────────────────────────── */}
      {/*
        Enabled only when the student has typed something.
        No feedback state — pressing this immediately advances.
      */}
      <button
        onClick={handleSubmit}
        disabled={textValue.trim().length === 0 || isPaused}
        className="self-end rounded-lg bg-gray-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next →
      </button>

    </div>
  );
}
