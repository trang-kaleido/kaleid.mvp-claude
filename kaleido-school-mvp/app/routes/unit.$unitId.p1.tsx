/**
 * unit.$unitId.p1 — P1 Encoding Practice Page (F08)
 *
 * P1 contains 10 sequential practices from practices[1] to practices[10]:
 *   [1] L4M — Essay-level MCQ
 *   [2] L3M — Paragraph-level MCQ
 *   [3] L2M — Sentence-level MCQ
 *   [4] L1M — Lexical-level MCQ
 *   [5-10] — Scramble and Fill practices (F09/F10, stubbed here)
 *
 * Acceptance criteria covered:
 *   AC-3.8  — StopwatchTimer counts up, can be paused
 *   AC-3.9/3.10 — Peek button opens PeekModal, no rate limit
 *   AC-3.12 — Wrong answer → red X, V2 auto-loads (handled in MCQPractice)
 *   AC-3.16 — "Continue →" after 3 failures
 *   AC-3.17 — failedAdvanced: true on forced advance
 *   AC-3.18 — "Next →" on correct answer
 *   AC-3.19a — No mid-P1 save state (attempts saved per-practice on completion)
 *
 * DATA FLOW:
 *   Loader → fetches question, sentences, practices, povCards
 *   Action (save_attempts) → writes StudentAttempt rows for one completed practice
 *   Action (complete_p1) → advances phase to p2, redirects to /unit/:unitId/p2
 */
import { useState, useEffect } from "react";
import { redirect, useFetcher } from "react-router";
import { requireStudent } from "~/lib/auth.server";
import { prisma } from "~/lib/prisma.server";
import { PhaseTransitionService } from "~/services/phase-transition.server";
import { StopwatchTimer } from "~/components/ui/StopwatchTimer";
import { PeekModal, type PovCard } from "~/components/ui/PeekModal";
import { MCQPractice } from "~/components/practices/MCQPractice";
import type { AttemptRecord, PracticeMCQ } from "~/components/practices/MCQPractice";
import { ScramblePractice } from "~/components/practices/ScramblePractice";
import type {
  ScrambleAttemptRecord,
  ScramblePracticeData,
} from "~/components/practices/ScramblePractice";
import { FillPractice } from "~/components/practices/FillPractice";
import type { FillAttemptRecord, PracticePhraseFill } from "~/components/practices/FillPractice";
import { SentFillPractice } from "~/components/practices/SentFillPractice";
import type { SentFillAttemptRecord, PracticeSentFill } from "~/components/practices/SentFillPractice";
import type { Route } from "./+types/unit.$unitId.p1";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Practice union — discriminated on practice_code.
 * Scramble types (F09) now use their real interfaces from ScramblePractice.tsx.
 * Fill types (F10) remain as loose stubs until F10 is built.
 */
type Practice =
  | PracticeMCQ
  | ScramblePracticeData
  | PracticePhraseFill
  | PracticeSentFill
  | { practice_code: "P0"; [key: string]: unknown }
  | { practice_code: "L4W"; [key: string]: unknown };

/** Sentence shape — matches LAB-SCHOOL-CONTRACT §6 */
interface Sentence {
  sentence_id: string;
  paragraph_type: string;
  order: number;
  canonical_text: string;
  rhetoric_tag: string;
  rhetoric_label: string;
  direction_tag: string;
  lexical_items: { phrase: string; pos: string }[];
  syntax_items: string[];
}

// ─── Loader ───────────────────────────────────────────────────────────────────

/**
 * Loader: fetches everything P1 needs in one pass.
 *
 * Guards:
 *   - requireStudent → redirects to /sign-in if not authenticated
 *   - StudentPath must exist → /onboarding/tier if missing
 *   - Unit must not be locked → /dashboard
 *   - currentPhase must be 'p1' → redirects to the correct phase if not
 *
 * Returns: { unitId, question, sentences, practices, povCards }
 */
export async function loader(args: Route.LoaderArgs) {
  const clerkUserId = await requireStudent(args);

  const path = await prisma.studentPath.findUnique({
    where: { clerkUserId },
    select: { studentId: true },
  });

  if (!path) {
    throw redirect("/onboarding/tier");
  }

  const { unitId } = args.params;

  const progress = await prisma.studentUnitProgress.findUnique({
    where: { studentId_unitId: { studentId: path.studentId, unitId } },
    select: { status: true, currentPhase: true },
  });

  if (!progress || progress.status === "locked") {
    throw redirect("/dashboard");
  }

  if (progress.currentPhase !== "p1") {
    throw redirect(`/unit/${unitId}/${progress.currentPhase}`);
  }

  const prepUnit = await prisma.prepUnit.findUnique({
    where: { unitId },
    select: { question: true, sentences: true, practices: true },
  });

  if (!prepUnit) {
    throw redirect("/dashboard");
  }

  // WHY double-cast (as unknown as T)?
  // Prisma's Json type is a union (JsonValue) that doesn't directly overlap with
  // our specific interfaces. Casting via 'unknown' tells TypeScript we know the shape.
  const sentences = prepUnit.sentences as unknown as Sentence[];
  const practices = prepUnit.practices as unknown as Practice[];

  // ── Build PoV cards for the PeekModal ────────────────────────────────────
  // One card per body paragraph — joins direction_ref to get the human-readable
  // argument text, since PeekModal is a pure client component with no DB access.

  const bodyParagraphTypes = ["body_1", "body_2", "body_3", "body_4"];

  const uniqueDirectionTags = [
    ...new Set(
      sentences
        .filter((s) => bodyParagraphTypes.includes(s.paragraph_type))
        .map((s) => s.direction_tag)
    ),
  ];

  const directionRefs = await prisma.directionRef.findMany({
    where: { directionId: { in: uniqueDirectionTags } },
    select: { directionId: true, argument: true },
  });

  const directionMap = new Map(
    directionRefs.map((ref) => [ref.directionId, ref.argument])
  );

  const povCards: PovCard[] = bodyParagraphTypes
    .filter((paraType) => sentences.some((s) => s.paragraph_type === paraType))
    .map((paraType) => {
      const paraSentences = sentences
        .filter((s) => s.paragraph_type === paraType)
        .sort((a, b) => a.order - b.order);

      const directionTag = paraSentences[0]?.direction_tag ?? "";

      return {
        paragraphType: paraType,
        directionLabel: directionMap.get(directionTag) ?? directionTag,
        topicSentence: paraSentences[0]?.canonical_text ?? "",
        blogSlug: directionTag,
      };
    });

  return { unitId, question: prepUnit.question, sentences, practices, povCards };
}

// ─── Action ───────────────────────────────────────────────────────────────────

/**
 * Action: handles two intents.
 *
 * "save_attempts" — writes StudentAttempt rows for one completed practice.
 *   Fire-and-forget: UI doesn't wait for the response.
 *
 * "complete_p1" — advances phase p1 → p2 and redirects.
 */
export async function action(args: Route.ActionArgs) {
  const clerkUserId = await requireStudent(args);
  const { unitId } = args.params;

  const formData = await args.request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "save_attempts") {
    const path = await prisma.studentPath.findUnique({
      where: { clerkUserId },
      select: { studentId: true },
    });

    if (!path) {
      return { ok: false, error: "No student path found" };
    }

    const { studentId } = path;
    const attemptsJson = formData.get("attemptsJson") as string;
    const practiceCode = formData.get("practiceCode") as string;

    // Parse as a flexible record — MCQ attempts have selectedIndex, scramble attempts
    // have arrangement. Both share the same base fields (itemId, version, pass, etc.).
    // The response JSONB field stores whichever type-specific field is present.
    let attempts: Array<Record<string, unknown>>;
    try {
      attempts = JSON.parse(attemptsJson) as Array<Record<string, unknown>>;
    } catch {
      return { ok: false, error: "Invalid attempts JSON" };
    }

    // createMany inserts all attempt rows in one database call (more efficient
    // than looping with individual create() calls).
    await prisma.studentAttempt.createMany({
      data: attempts.map((attempt) => ({
        studentId,
        unitId,
        practiceCode,
        itemId: attempt.itemId as string,
        version: attempt.version as string | null,
        // Store whichever response shape the client sent.
        // MCQ sends:     { selectedIndex: number }
        // Scramble sends: { arrangement: string[] }
        // L1F sends:     { answers: Record<number, string> }
        // L2F sends:     { text: string }
        response:
          attempt.arrangement !== undefined
            ? { arrangement: attempt.arrangement as string[] }
            : attempt.answers !== undefined
            ? { answers: attempt.answers as Record<number, string> }
            : attempt.text !== undefined
            ? { text: attempt.text as string }
            : { selectedIndex: attempt.selectedIndex as number },
        // pass is boolean for graded practices, null for L2F (ungraded).
        pass: attempt.pass as boolean | null,
        failedAdvanced: attempt.failedAdvanced as boolean,
        startedAt: new Date(attempt.startedAt as string),
        completedAt: new Date(attempt.completedAt as string),
        artifactType: null,
        artifactContent: null,
      })),
    });

    return { ok: true };
  }

  if (intent === "complete_p1") {
    await PhaseTransitionService.completeP1(clerkUserId, unitId);
    // Redirect to P2. Until F11 is built this will 404 — that's expected.
    throw redirect(`/unit/${unitId}/p2`);
  }

  return { ok: false, error: `Unknown intent: ${intent}` };
}

// ─── PracticeRenderer ─────────────────────────────────────────────────────────

/**
 * PracticeRenderer — local component that orchestrates the 10 P1 practices.
 *
 * Uses TWO fetchers:
 *   saveFetcher    — submits save_attempts (fire-and-forget, no UI block)
 *   completeFetcher — submits complete_p1 (causes navigation/redirect)
 *
 * WHY two fetchers?
 * If we used one fetcher, the second submit() call would cancel the first.
 * Keeping them separate means save_attempts completes independently of
 * the complete_p1 redirect.
 *
 * practiceIndex 0 → practices[1] (L4M)
 * practiceIndex 9 → practices[10] (L2F stub)
 */
interface PracticeRendererProps {
  practices: Practice[];
  unitId: string;
  isPaused: boolean;
}

function PracticeRenderer({ practices, unitId, isPaused }: PracticeRendererProps) {
  const [practiceIndex, setPracticeIndex] = useState<number>(0);

  // saveFetcher: submits save_attempts — fire-and-forget
  const saveFetcher = useFetcher();

  // completeFetcher: submits complete_p1 — will follow the redirect to /p2
  const completeFetcher = useFetcher();

  // Tracks whether we should trigger complete_p1.
  // WHY state instead of calling completeFetcher.submit() directly?
  // useFetcher.submit() can't be called during a render (only in event handlers
  // or effects). We set this flag in the callback, then useEffect submits it.
  const [shouldCompleteP1, setShouldCompleteP1] = useState<boolean>(false);

  // When shouldCompleteP1 flips to true, submit the complete_p1 action.
  useEffect(() => {
    if (!shouldCompleteP1) return;
    const formData = new FormData();
    formData.set("intent", "complete_p1");
    completeFetcher.submit(formData, { method: "post" });
  }, [shouldCompleteP1]); // eslint-disable-line react-hooks/exhaustive-deps
  // (completeFetcher excluded from deps intentionally — adding it would cause infinite loops)

  const currentPractice = practices[practiceIndex + 1];
  const practiceCode = currentPractice?.practice_code;

  const MCQ_CODES = ["L4M", "L3M", "L2M", "L1M"] as const;
  const SCRAMBLE_CODES = ["L1S", "L2S", "L3S", "L4S"] as const;

  const practiceLabel: Record<string, string> = {
    L4M: "Essay Structure",
    L3M: "Paragraph Structure",
    L2M: "Sentence Analysis",
    L1M: "Lexical Recognition",
    L1S: "Phrase Scramble",
    L2S: "Sentence Scramble",
    L3S: "Paragraph Scramble",
    L4S: "Essay Scramble",
    L1F: "Phrase Fill",
    L2F: "Sentence Fill",
  };

  /**
   * handlePracticeComplete — called by MCQPractice or ScramblePractice when done.
   *
   * 1. Submit the attempt records to the DB via saveFetcher (fire-and-forget).
   * 2a. If not the last practice: advance to the next one.
   * 2b. If the last practice (index 9): trigger the complete_p1 flow.
   *
   * Accepts both AttemptRecord (MCQ) and ScrambleAttemptRecord — they share
   * the same structure for JSON serialization purposes.
   */
  function handlePracticeComplete(
    attempts: Array<AttemptRecord | ScrambleAttemptRecord | FillAttemptRecord | SentFillAttemptRecord>
  ) {
    // Save attempts to DB (fire-and-forget).
    if (attempts.length > 0) {
      const formData = new FormData();
      formData.set("intent", "save_attempts");
      formData.set("practiceCode", practiceCode);
      formData.set("attemptsJson", JSON.stringify(attempts));
      saveFetcher.submit(formData, { method: "post" });
    }

    if (practiceIndex < 9) {
      // More practices — move to the next one.
      setPracticeIndex((prev) => prev + 1);
    } else {
      // Last practice done — trigger P1 completion via useEffect.
      setShouldCompleteP1(true);
    }
  }

  // Show a loading state while the complete_p1 redirect is in progress.
  if (shouldCompleteP1) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-gray-500">Completing encoding phase…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Practice X of 10 progress header */}
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        Practice {practiceIndex + 1} of 10 — {practiceLabel[practiceCode] ?? practiceCode}
      </p>

      {/* Route to the correct practice component */}
      {MCQ_CODES.includes(practiceCode as (typeof MCQ_CODES)[number]) ? (
        // MCQ practices (L4M, L3M, L2M, L1M) — F08
        <MCQPractice
          key={practiceIndex} // key forces remount when moving to a new practice
          practice={currentPractice as PracticeMCQ}
          onComplete={handlePracticeComplete}
          isPaused={isPaused}
        />
      ) : SCRAMBLE_CODES.includes(practiceCode as (typeof SCRAMBLE_CODES)[number]) ? (
        // Scramble practices (L1S, L2S, L3S, L4S) — F09
        <ScramblePractice
          key={practiceIndex} // key forces remount when moving to a new practice
          practice={currentPractice as ScramblePracticeData}
          onComplete={handlePracticeComplete}
          isPaused={isPaused}
        />
      ) : practiceCode === "L1F" ? (
        // Phrase Fill (L1F) — F10
        <FillPractice
          key={practiceIndex}
          practice={currentPractice as PracticePhraseFill}
          onComplete={handlePracticeComplete}
          isPaused={isPaused}
        />
      ) : practiceCode === "L2F" ? (
        // Sentence Fill (L2F) — F10
        <SentFillPractice
          key={practiceIndex}
          practice={currentPractice as PracticeSentFill}
          onComplete={handlePracticeComplete}
          isPaused={isPaused}
        />
      ) : (
        // L4W stub only — no other codes remain in P1 after F10
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-400 mb-4">
            {practiceCode} — coming in a future feature
          </p>
          {/* Dev-only: remove before launch */}
          <button
            onClick={() => handlePracticeComplete([])}
            className="rounded bg-gray-200 px-4 py-2 text-xs text-gray-600 hover:bg-gray-300"
          >
            Skip (dev only)
          </button>
        </div>
      )}

    </div>
  );
}

// ─── P1Page ───────────────────────────────────────────────────────────────────

/**
 * P1Page — the main page component for the Encoding phase.
 *
 * Layout:
 *   ┌─ Sticky header ────────────────────────────────────────┐
 *   │  "P1 — Encoding"  [StopwatchTimer]  [⏸ Pause]  [Peek] │
 *   └────────────────────────────────────────────────────────┘
 *   ┌─ Scrollable content ───────────────────────────────────┐
 *   │  <PracticeRenderer />                                  │
 *   └────────────────────────────────────────────────────────┘
 *   PeekModal (overlay, conditionally rendered)
 */
export default function P1Page({ loaderData }: Route.ComponentProps) {
  const { unitId, sentences, practices, povCards } = loaderData;

  // Pausing freezes the StopwatchTimer and prevents practice interaction.
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Controls PeekModal visibility — no rate limit (AC-3.10).
  const [peekOpen, setPeekOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Sticky header ────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">

          <h1 className="text-sm font-bold text-gray-900">P1 — Encoding</h1>

          <div className="flex items-center gap-3">
            {/* AC-3.8: Counts up from 0:00, pauseable */}
            <StopwatchTimer isPaused={isPaused} />

            {/* Pause/Resume toggle */}
            <button
              onClick={() => setIsPaused((prev) => !prev)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {isPaused ? "▶ Resume" : "⏸ Pause"}
            </button>

            {/* Peek button — AC-3.9 */}
            <button
              onClick={() => setPeekOpen(true)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Peek
            </button>
          </div>

        </div>
      </div>

      {/* ── Paused overlay ────────────────────────────────────────────── */}
      {/*
        Full-screen overlay that appears when paused.
        Prevents the student from interacting with the practice while time is stopped.
      */}
      {isPaused && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-gray-900/40">
          <div className="rounded-xl bg-white px-8 py-6 text-center shadow-xl">
            <p className="text-lg font-semibold text-gray-800 mb-2">Session Paused</p>
            <p className="text-sm text-gray-500 mb-4">Your timer is paused.</p>
            <button
              onClick={() => setIsPaused(false)}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              ▶ Resume
            </button>
          </div>
        </div>
      )}

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <PracticeRenderer
          practices={practices}
          unitId={unitId}
          isPaused={isPaused}
        />
      </div>

      {/* ── Peek Modal ────────────────────────────────────────────────── */}
      {/*
        AC-3.9/3.10: Available throughout all P1. No rate limit.
        Data was pre-joined in the loader — no additional fetch needed here.
      */}
      <PeekModal
        isOpen={peekOpen}
        onClose={() => setPeekOpen(false)}
        sentences={sentences}
        povCards={povCards}
      />

    </div>
  );
}
