/**
 * ScramblePractice — client-side scramble component for L1S, L2S, L3S, L4S.
 *
 * TWO interaction patterns based on item size (UX Spec §9.2, Rule 6):
 *   L1S — word chips → phrase          } click-to-place word bank
 *   L2S — phrase chunks → sentence     }
 *   L3S — full sentences → paragraph   } drag-to-order list
 *
 * RETRY CYCLE (identical to MCQPractice):
 *   attemptCount = 0  → show V1  (versions[0])
 *   attemptCount = 1  → show V2  (versions[1])  after 1st wrong
 *   attemptCount = 2  → show V1  (versions[0])  after 2nd wrong
 *   wrong on attempt 2 → FORCED ADVANCE
 *
 *   Version formula: versionIndex = attemptCount % 2
 *
 * STATE DESIGN FOR CLICK-TO-PLACE (L1S/L2S):
 *   We use index-based tracking (placedIndices: number[]) rather than
 *   text-based tracking (arrangement.includes(text)) to correctly handle
 *   the edge case where the same word/chunk appears twice in the chips array.
 *   The Lab's split() and chunk_sentence() functions don't deduplicate, so
 *   a word could appear twice (e.g., "profit" in "profit damages profit").
 *   By tracking which INDEX is placed, both instances remain independent.
 *
 * STATE DESIGN FOR DRAG-TO-ORDER (L3S/L4S):
 *   arrangement: string[] holds the current ordered list of IDs or paragraph
 *   names. Initialized from the data's (pre-shuffled) order. Student drags
 *   to reorder. dragFromRef (useRef) tracks the source index — a ref avoids
 *   stale closure issues that would occur with useState in onDragOver.
 */
import { useState, useRef, useEffect } from "react";
import { GradingService } from "~/services/grading";

// ─── Type Definitions ─────────────────────────────────────────────────────────
// These match LAB-SCHOOL-CONTRACT §7.4–7.7 exactly.

// L1S — Lexical Scramble
interface LexScrambleQuestion {
  id: string;
  phrase: string;
  chips: string[];
  answer: string;
}
interface PracticeLexScramble {
  practice_code: "L1S";
  versions: [
    { version: "V1"; questions: LexScrambleQuestion[] },
    { version: "V2"; questions: LexScrambleQuestion[] },
  ];
}

// L2S — Sentence Scramble
interface SentChunk {
  text: string;
  is_lexical: boolean;
}
interface SentScrambleQuestion {
  id: string;
  paragraph: string;
  sentence_order: number;
  hint: string;
  chunks: SentChunk[];
  answer: string;
}
interface PracticeSentScramble {
  practice_code: "L2S";
  versions: [
    { version: "V1"; questions: SentScrambleQuestion[] },
    { version: "V2"; questions: SentScrambleQuestion[] },
  ];
}

// L3S — Paragraph Scramble
interface ScrambleSentence {
  sentence_id: string;
  text: string;
}
interface ParaScrambleQuestion {
  id: string;
  paragraph: string;
  hint: string;
  sentences: ScrambleSentence[];
  answer_order: string[];
}
interface PracticeParaScramble {
  practice_code: "L3S";
  versions: [
    { version: "V1"; questions: ParaScrambleQuestion[] },
    { version: "V2"; questions: ParaScrambleQuestion[] },
  ];
}

/** Discriminated union of all 3 scramble practice types. */
export type ScramblePracticeData =
  | PracticeLexScramble
  | PracticeSentScramble
  | PracticeParaScramble;

/**
 * ScrambleAttemptRecord — one attempt on one scramble item.
 * Collected internally; passed to onComplete() and saved to DB by parent.
 *
 * `arrangement` stores the student's placed/ordered items as text strings.
 * For L1S/L2S: the joined chip texts. For L3S/L4S: the ordered IDs/names.
 */
export interface ScrambleAttemptRecord {
  itemId: string;
  version: "V1" | "V2";
  arrangement: string[];
  pass: boolean;
  failedAdvanced: boolean;
  startedAt: string;
  completedAt: string;
}

interface ScramblePracticeProps {
  practice: ScramblePracticeData;
  /**
   * Called when all questions in this practice are done (correct or forced).
   * Passes all attempt records for the parent to save to the DB.
   */
  onComplete: (attempts: ScrambleAttemptRecord[]) => void;
  isPaused?: boolean;
}

// ─── Pure Helper Functions ─────────────────────────────────────────────────────

/**
 * getInitialArrangement — derive the starting arrangement for a given state.
 *
 * L1S/L2S (click-to-place): returns [] because the student starts with an
 * empty placed area and clicks chips from the bank.
 *
 * L3S/L4S (drag-to-order): returns the data's pre-shuffled order so the
 * student starts with the (wrong) Lab-shuffled order and drags to fix it.
 */
function getInitialArrangement(
  practice: ScramblePracticeData,
  versionIndex: number,
  questionIndex: number,
): string[] {
  if (practice.practice_code === "L1S" || practice.practice_code === "L2S") {
    // Click-to-place: start empty
    return [];
  }
  // L3S: drag-to-order sentences within a paragraph
  const version = practice.versions[versionIndex];
  const q = (version as PracticeParaScramble["versions"][0]).questions[questionIndex];
  return q?.sentences.map((s) => s.sentence_id) ?? [];
}

/**
 * gradeArrangement — grade the student's current arrangement.
 *
 * For click-to-place (L1S/L2S): the arranged texts are joined with a space
 * and compared to the answer string (case-insensitive).
 *
 * For drag-to-order (L3S): compare arranged sentence_ids to answer_order.
 * For drag-to-order (L4S): compare arranged paragraph names to answer_order.
 */
function gradeArrangement(
  practice: ScramblePracticeData,
  versionIndex: number,
  questionIndex: number,
  arranged: string[],
): boolean {
  const version = practice.versions[versionIndex];
  if (practice.practice_code === "L1S") {
    const q = (version as PracticeLexScramble["versions"][0]).questions[questionIndex];
    return GradingService.gradeScrambleJoin(arranged, q.answer);
  }
  if (practice.practice_code === "L2S") {
    const q = (version as PracticeSentScramble["versions"][0]).questions[questionIndex];
    return GradingService.gradeScrambleJoin(arranged, q.answer);
  }
  // L3S
  const q = (version as PracticeParaScramble["versions"][0]).questions[questionIndex];
  return GradingService.gradeScrambleOrder(arranged, q.answer_order);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ScramblePractice({
  practice,
  onComplete,
  isPaused = false,
}: ScramblePracticeProps) {
  // Which question within the practice (0-based).
  // Always 0 for L4S, which has a single arrangement task per version.
  const [questionIndex, setQuestionIndex] = useState<number>(0);

  // Attempts on the CURRENT question. 0 = first try, 2 = third try (force if wrong).
  const [attemptCount, setAttemptCount] = useState<number>(0);

  // Drives feedback UI. null = awaiting input.
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | "forced" | null>(null);

  // ── Click-to-place state (L1S, L2S) ────────────────────────────────────────
  // placedIndices: which positions in the chips/chunks array are currently placed,
  // in the order they were placed. Index-based to handle duplicate chip texts.
  const [placedIndices, setPlacedIndices] = useState<number[]>([]);

  // ── Drag-to-order state (L3S, L4S) ─────────────────────────────────────────
  // arrangement: the ordered list of IDs or paragraph names in current student order.
  const [arrangement, setArrangement] = useState<string[]>(() =>
    getInitialArrangement(practice, 0, 0),
  );

  // dragFromRef: which index in the list is currently being dragged.
  // We use a ref (not state) so that onDragOver callbacks always have the current
  // value without stale closures, and without triggering re-renders.
  const dragFromRef = useRef<number | null>(null);

  // Timestamp when the current question first rendered.
  const [questionStartedAt, setQuestionStartedAt] = useState<string>(() =>
    new Date().toISOString(),
  );

  // All attempt records collected during this practice session.
  const allAttemptsRef = useRef<ScrambleAttemptRecord[]>([]);

  // ── Derived values ───────────────────────────────────────────────────────────

  const versionIndex = attemptCount % 2;
  const versionLabel: "V1" | "V2" = versionIndex === 0 ? "V1" : "V2";
  const currentVersion = practice.versions[versionIndex];

  const totalQuestions = (currentVersion as { questions: unknown[] }).questions.length;

  const currentItemId = (() => {
    const q = (currentVersion as { questions: Array<{ id: string }> }).questions[questionIndex];
    return q?.id ?? "";
  })();

  // ── Auto-advance after "wrong" ───────────────────────────────────────────────

  // When the student gets a wrong answer (not forced), show the red X for 1200ms,
  // then reset so the next version of the same item appears.
  // WHY: UX Spec §10 "V2 auto-loads immediately" — no retry button.
  useEffect(() => {
    if (lastResult !== "wrong") return;

    const timer = setTimeout(() => {
      setLastResult(null);
      // Reset click-to-place state for the new version.
      setPlacedIndices([]);
      // Reset drag-to-order state for the new version.
      // NOTE: attemptCount is already incremented before this effect fires
      // (React batches the setState calls in handleSubmit). So
      // attemptCount % 2 here gives the NEW version's index, which is correct.
      setArrangement(getInitialArrangement(practice, attemptCount % 2, questionIndex));
    }, 1200);

    return () => clearTimeout(timer);
  }, [lastResult]); // eslint-disable-line react-hooks/exhaustive-deps
  // (practice, attemptCount, questionIndex excluded intentionally — see comment above)

  // ── Reset timestamps and state when moving to a new question ────────────────

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setQuestionStartedAt(new Date().toISOString());
    setPlacedIndices([]);
    setArrangement(getInitialArrangement(practice, versionIndex, questionIndex));
  }, [questionIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Event handlers ───────────────────────────────────────────────────────────

  /**
   * handleSubmit — called when the student clicks "Check →".
   *
   * Derives the arranged text array from placedIndices (L1S/L2S) or
   * arrangement (L3S/L4S), grades it, and updates state accordingly.
   */
  function handleSubmit() {
    if (lastResult !== null || isPaused) return;

    // Derive the text-based arrangement for grading and recording.
    let arrangedTexts: string[];
    if (practice.practice_code === "L1S") {
      const q = (currentVersion as PracticeLexScramble["versions"][0]).questions[questionIndex];
      arrangedTexts = placedIndices.map((i) => q.chips[i]);
    } else if (practice.practice_code === "L2S") {
      const q = (currentVersion as PracticeSentScramble["versions"][0]).questions[questionIndex];
      arrangedTexts = placedIndices.map((i) => q.chunks[i].text);
    } else {
      arrangedTexts = arrangement;
    }

    // Guard: L1S/L2S require at least one chip placed before submitting.
    if (
      (practice.practice_code === "L1S" || practice.practice_code === "L2S") &&
      arrangedTexts.length === 0
    ) {
      return;
    }

    const isCorrect = gradeArrangement(practice, versionIndex, questionIndex, arrangedTexts);
    const now = new Date().toISOString();

    if (isCorrect) {
      setLastResult("correct");
      allAttemptsRef.current.push({
        itemId: currentItemId,
        version: versionLabel,
        arrangement: arrangedTexts,
        pass: true,
        failedAdvanced: false,
        startedAt: questionStartedAt,
        completedAt: now,
      });
    } else if (attemptCount < 2) {
      // Wrong, but not yet at 3rd attempt — show red X, auto-advance to next version.
      setLastResult("wrong");
      allAttemptsRef.current.push({
        itemId: currentItemId,
        version: versionLabel,
        arrangement: arrangedTexts,
        pass: false,
        failedAdvanced: false,
        startedAt: questionStartedAt,
        completedAt: now,
      });
      // Increment AFTER recording (so the record shows the version that was displayed).
      setAttemptCount((prev) => prev + 1);
    } else {
      // 3rd wrong answer — forced advance.
      setLastResult("forced");
      allAttemptsRef.current.push({
        itemId: currentItemId,
        version: versionLabel,
        arrangement: arrangedTexts,
        pass: false,
        failedAdvanced: true,
        startedAt: questionStartedAt,
        completedAt: now,
      });
    }
  }

  /**
   * handleAdvance — called when "Next →" (correct) or "Continue →" (forced) is clicked.
   */
  function handleAdvance() {
    if (questionIndex + 1 < totalQuestions) {
      const nextIndex = questionIndex + 1;
      // Reset ALL derived state synchronously in the same batch so the render
      // that fires after this call sees the new questionIndex AND empty/fresh
      // placedIndices/arrangement at the same time.
      // If placedIndices were only reset via useEffect (after render), the
      // intermediate render would use new question's chunks with stale indices
      // → chunks[stale_index] can be undefined when the new question has fewer
      // chunks than the previous one, causing a crash.
      setQuestionIndex(nextIndex);
      setAttemptCount(0);
      setLastResult(null);
      setPlacedIndices([]);
      setArrangement(getInitialArrangement(practice, 0, nextIndex));
    } else {
      onComplete(allAttemptsRef.current);
    }
  }

  // ── Render: click-to-place (L1S, L2S) ────────────────────────────────────────

  function renderL1S() {
    const q = (currentVersion as PracticeLexScramble["versions"][0]).questions[questionIndex];
    const chips = q.chips;
    // Bank: indices NOT yet placed.
    const bankIndices = chips
      .map((_, i) => i)
      .filter((i) => !placedIndices.includes(i));

    return (
      <div className="flex flex-col gap-4">
        <p className="text-xs text-gray-500">
          Arrange the word chips to form the correct phrase.
        </p>

        {/* Placed area — shows chips in placed order. Click to remove. */}
        <div className="min-h-[52px] rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 p-3 flex flex-wrap gap-2 items-center">
          {placedIndices.length === 0 ? (
            <span className="text-sm text-gray-400 italic">
              Click words from the bank below…
            </span>
          ) : (
            placedIndices.map((chipIdx, pos) => (
              <button
                key={`placed-${chipIdx}-${pos}`}
                onClick={() => {
                  if (lastResult !== null || isPaused) return;
                  // Remove this position from placedIndices.
                  setPlacedIndices((prev) => prev.filter((_, i) => i !== pos));
                }}
                disabled={lastResult !== null || isPaused}
                className="rounded-full border-2 border-blue-800 bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 transition-colors"
              >
                {chips[chipIdx]} ✕
              </button>
            ))
          )}
        </div>

        {/* Word bank — chips not yet placed. Click to place. */}
        <div className="flex flex-wrap gap-2">
          {bankIndices.map((chipIdx) => (
            <button
              key={`bank-${chipIdx}`}
              onClick={() => {
                if (lastResult !== null || isPaused) return;
                setPlacedIndices((prev) => [...prev, chipIdx]);
              }}
              disabled={lastResult !== null || isPaused}
              className="rounded-full border-2 border-gray-800 bg-white px-3 py-1 text-sm text-gray-800 hover:border-blue-600 hover:bg-blue-50 transition-colors"
            >
              {chips[chipIdx]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderL2S() {
    const q = (currentVersion as PracticeSentScramble["versions"][0]).questions[questionIndex];
    const chunks = q.chunks;
    const bankIndices = chunks
      .map((_, i) => i)
      .filter((i) => !placedIndices.includes(i));

    return (
      <div className="flex flex-col gap-4">
        {/* Rhetoric hint — shown below the prompt, always visible (UX Spec §9.2) */}
        {q.hint && (
          <p className="text-xs text-gray-500 italic">{q.hint}</p>
        )}

        {/* Placed area */}
        <div className="min-h-[52px] rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 p-3 flex flex-wrap gap-2 items-center">
          {placedIndices.length === 0 ? (
            <span className="text-sm text-gray-400 italic">
              Click chunks from the bank below…
            </span>
          ) : (
            placedIndices.map((chunkIdx, pos) => {
              const chunk = chunks[chunkIdx];
              return (
                <button
                  key={`placed-${chunkIdx}-${pos}`}
                  onClick={() => {
                    if (lastResult !== null || isPaused) return;
                    setPlacedIndices((prev) => prev.filter((_, i) => i !== pos));
                  }}
                  disabled={lastResult !== null || isPaused}
                  className={`rounded-lg px-3 py-1 text-sm transition-colors ${
                    chunk.is_lexical
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {chunk.text} ✕
                </button>
              );
            })
          )}
        </div>

        {/* Chunk bank — lexical chunks get emerald styling (UX Spec §9.2) */}
        <div className="flex flex-wrap gap-2">
          {bankIndices.map((chunkIdx) => {
            const chunk = chunks[chunkIdx];
            return (
              <button
                key={`bank-${chunkIdx}`}
                onClick={() => {
                  if (lastResult !== null || isPaused) return;
                  setPlacedIndices((prev) => [...prev, chunkIdx]);
                }}
                disabled={lastResult !== null || isPaused}
                className={`rounded-lg border-2 px-3 py-1 text-sm transition-colors ${
                  chunk.is_lexical
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-medium"
                    : "border-gray-800 bg-white text-gray-800 hover:border-blue-600 hover:bg-blue-50"
                }`}
              >
                {chunk.text}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Render: drag-to-order (L3S, L4S) ─────────────────────────────────────────

  function renderDragToOrder() {
    const q = (currentVersion as PracticeParaScramble["versions"][0]).questions[questionIndex];
    const textMap = new Map<string, string>(q.sentences.map((s) => [s.sentence_id, s.text]));
    const hint = q.hint;

    return (
      <div className="flex flex-col gap-4">
        {/* Rhetoric / structure hint */}
        {hint && (
          <p className="text-xs text-gray-500 italic">{hint}</p>
        )}

        <p className="text-xs text-gray-400">
          Drag the items into the correct order.
        </p>

        {/* Draggable list */}
        <div className="flex flex-col gap-2">
          {arrangement.map((id, i) => (
            <div
              key={id}
              draggable={lastResult === null && !isPaused}
              onDragStart={() => {
                dragFromRef.current = i;
              }}
              onDragOver={(e) => {
                e.preventDefault(); // required to allow drop
                const from = dragFromRef.current;
                if (from === null || from === i) return;
                // Swap the dragged item into this position (live preview).
                setArrangement((prev) => {
                  const next = [...prev];
                  const [moved] = next.splice(from, 1);
                  next.splice(i, 0, moved);
                  return next;
                });
                // Update the source index to where the item now lives.
                dragFromRef.current = i;
              }}
              onDragEnd={() => {
                dragFromRef.current = null;
              }}
              className={`rounded-lg border p-3 text-sm leading-relaxed select-none transition-colors ${
                lastResult !== null || isPaused
                  ? "cursor-default border-2 border-gray-300 bg-gray-50 text-gray-500"
                  : "cursor-grab active:cursor-grabbing border-2 border-gray-800 bg-white text-gray-800 hover:border-blue-600 hover:shadow-[2px_2px_0px_0px_rgba(17,24,39,0.5)]"
              }`}
            >
              <span className="mr-2 text-xs font-semibold text-gray-400">
                {i + 1}.
              </span>
              {textMap.get(id) ?? id}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────

  const isClickToPlace = practice.practice_code === "L1S" || practice.practice_code === "L2S";

  // Submit is disabled for click-to-place when nothing is placed yet.
  const canSubmit = isClickToPlace ? placedIndices.length > 0 : true;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Progress indicator ──────────────────────────────────────────── */}
      <p className="text-sm text-gray-500">
        Question {questionIndex + 1} of {totalQuestions}
      </p>

      {/* ── Instruction prompt ──────────────────────────────────────────── */}
      <div className="rounded-lg border-2 border-gray-500 bg-white p-4 shadow-[3px_3px_0px_0px_rgba(17,24,39,0.5)]">
        <p className="text-sm font-medium text-gray-700">
          {practice.practice_code === "L1S" &&
            "Arrange the word chips to form the correct phrase:"}
          {practice.practice_code === "L2S" &&
            "Arrange the chunks to form the correct sentence:"}
          {practice.practice_code === "L3S" &&
            "Drag the sentences into the correct paragraph order:"}
        </p>
      </div>

      {/* ── Input area ─────────────────────────────────────────────────── */}
      {practice.practice_code === "L1S" && renderL1S()}
      {practice.practice_code === "L2S" && renderL2S()}
      {practice.practice_code === "L3S" && renderDragToOrder()}

      {/* ── Check button (only shown when awaiting input) ─────────────── */}
      {lastResult === null && (
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isPaused}
          className="self-end rounded-lg bg-gray-900 border-2 border-gray-500 px-6 py-2.5 text-sm font-bold text-white shadow-[2px_2px_0px_0px_rgba(17,24,39,0.5)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Check →
        </button>
      )}

      {/* ── Feedback area ──────────────────────────────────────────────── */}
      {lastResult === "wrong" && (
        <div className="flex items-center gap-2 rounded-lg border-2 border-red-500 bg-red-50 p-3">
          <span className="text-lg text-red-600 font-bold" aria-label="Incorrect">
            ✗
          </span>
          <p className="text-sm text-red-700">Not quite — try again.</p>
        </div>
      )}

      {lastResult === "correct" && (
        <div className="flex items-center justify-between rounded-lg border-2 border-emerald-500 bg-emerald-50 p-3">
          <div className="flex items-center gap-2">
            <span className="text-lg text-emerald-600 font-bold" aria-label="Correct">
              ✓
            </span>
            <p className="text-sm text-emerald-700 font-medium">Correct!</p>
          </div>
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
            className="self-end rounded-lg bg-orange-500 border-2 border-gray-500 px-5 py-2 text-sm font-bold text-white shadow-[2px_2px_0px_0px_rgba(17,24,39,0.5)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            Continue →
          </button>
        </div>
      )}

    </div>
  );
}
