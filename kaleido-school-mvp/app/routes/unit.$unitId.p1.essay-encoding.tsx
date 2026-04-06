/**
 * unit.$unitId.p1.essay-encoding — Essay Encoding Sub-Route (F08/F09/F10)
 *
 * Handles 9 sequential practices from practices[4] to practices[12]:
 *   [4]  L4M — Essay-level MCQ
 *   [5]  L2M — Sentence-level MCQ
 *   [6]  L1M — Lexical-level MCQ
 *   [7]  L1S — Phrase Scramble (click-to-place)
 *   [8]  L2S — Sentence Scramble (click-to-place)
 *   [9]  L3S — Paragraph Scramble (drag-to-order)
 *   [10] L4S — Essay Scramble (drag-to-order)
 *   [11] L1F — Phrase Fill
 *   [12] L2F — Sentence Fill
 *
 * On completion: phase advances to p2 (via completeEssayEncoding).
 *
 * Acceptance criteria covered:
 *   AC-3.8  — StopwatchTimer counts up, can be paused
 *   AC-3.9/3.10 — Peek button opens PeekModal, no rate limit
 *   AC-3.12 — Wrong answer → red X, V2 auto-loads (handled in MCQPractice)
 *   AC-3.16 — "Continue →" after 3 failures
 *   AC-3.17 — failedAdvanced: true on forced advance
 *   AC-3.18 — "Next →" on correct answer
 */
import { useState, useEffect } from "react";
import { redirect, useFetcher } from "react-router";
import { requireStudent } from "~/lib/auth.server";
import { prisma } from "~/lib/prisma.server";
import { PhaseTransitionService } from "~/services/phase-transition.server";
import { safeParseJson } from "~/lib/json.server";
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
import type { Route } from "./+types/unit.$unitId.p1.essay-encoding";

// ─── Types ────────────────────────────────────────────────────────────────────

type Practice =
  | PracticeMCQ
  | ScramblePracticeData
  | PracticePhraseFill
  | PracticeSentFill
  | { practice_code: "P0"; [key: string]: unknown }
  | { practice_code: "L4W"; [key: string]: unknown };

interface Sentence {
  sentence_id: string;
  paragraph_type: string;
  order: number;
  canonical_text: string;
  rhetoric_tag: string;
  rhetoric_label: string;
  direction_tag: string | null;
  lexical_items: { phrase: string; pos: string }[];
  syntax_items: string[];
}

// ─── Loader ───────────────────────────────────────────────────────────────────

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

  if (progress.currentPhase !== "p1_essay_encoding") {
    throw redirect(`/unit/${unitId}`);
  }

  const prepUnit = await prisma.prepUnit.findUnique({
    where: { unitId },
    select: { question: true, sentences: true, practices: true },
  });

  if (!prepUnit) {
    throw redirect("/dashboard");
  }

  const sentences = safeParseJson<Sentence[]>(prepUnit.sentences);
  const practices = safeParseJson<Practice[]>(prepUnit.practices);

  // Build PoV cards for PeekModal
  const bodyParagraphTypes = ["body_1", "body_2", "body_3", "body_4"];

  const uniqueDirectionTags = [
    ...new Set(
      sentences
        .filter((s) => bodyParagraphTypes.includes(s.paragraph_type) && s.direction_tag != null)
        .map((s) => s.direction_tag as string)
    ),
  ];

  const directionRefs = await prisma.directionRef.findMany({
    where: { directionId: { in: uniqueDirectionTags } },
    select: { directionId: true, argument: true },
  });

  const directionMap = new Map(directionRefs.map((ref) => [ref.directionId, ref.argument]));

  const povCards: PovCard[] = bodyParagraphTypes
    .filter((paraType) => sentences.some((s) => s.paragraph_type === paraType))
    .map((paraType) => {
      const paraSentences = sentences
        .filter((s) => s.paragraph_type === paraType)
        .sort((a, b) => a.order - b.order);

      const directionTag = paraSentences[0]?.direction_tag ?? "";

      return {
        paragraphType: paraType,
        directionLabel: directionMap.get(directionTag ?? "") ?? directionTag ?? "",
        topicSentence: paraSentences[0]?.canonical_text ?? "",
        blogSlug: directionTag ?? "",
      };
    });

  return { unitId, question: prepUnit.question, sentences, practices, povCards };
}

// ─── Action ───────────────────────────────────────────────────────────────────

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

    let attempts: Array<Record<string, unknown>>;
    try {
      attempts = JSON.parse(attemptsJson) as Array<Record<string, unknown>>;
    } catch {
      return { ok: false, error: "Invalid attempts JSON" };
    }

    await prisma.studentAttempt.createMany({
      data: attempts.map((attempt) => ({
        studentId,
        unitId,
        practiceCode,
        itemId: attempt.itemId as string,
        version: attempt.version as string | null,
        response:
          attempt.arrangement !== undefined
            ? { arrangement: attempt.arrangement as string[] }
            : attempt.answers !== undefined
            ? { answers: attempt.answers as Record<number, string> }
            : attempt.text !== undefined
            ? { text: attempt.text as string }
            : { selectedIndex: attempt.selectedIndex as number },
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

  if (intent === "complete_essay_encoding") {
    await PhaseTransitionService.completeEssayEncoding(clerkUserId, unitId);
    throw redirect(`/unit/${unitId}/p2/intro`);
  }

  return { ok: false, error: `Unknown intent: ${intent}` };
}

// ─── PracticeRenderer ─────────────────────────────────────────────────────────

interface PracticeRendererProps {
  practices: Practice[];
  unitId: string;
  isPaused: boolean;
}

function PracticeRenderer({ practices, unitId, isPaused }: PracticeRendererProps) {
  const [practiceIndex, setPracticeIndex] = useState<number>(0);

  const saveFetcher = useFetcher();
  const completeFetcher = useFetcher();

  const [shouldComplete, setShouldComplete] = useState<boolean>(false);

  useEffect(() => {
    if (!shouldComplete) return;
    const formData = new FormData();
    formData.set("intent", "complete_essay_encoding");
    completeFetcher.submit(formData, { method: "post" });
  }, [shouldComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  // Essay encoding: practices[4] through practices[12] (9 practices total)
  // practiceIndex 0 → practices[4] (L4M)
  // practiceIndex 8 → practices[12] (L2F)
  const currentPractice = practices[practiceIndex + 4];
  const practiceCode = currentPractice?.practice_code;

  const MCQ_CODES = ["L4M", "L2M", "L1M"] as const;
  const SCRAMBLE_CODES = ["L1S", "L2S", "L3S", "L4S"] as const;

  const practiceLabel: Record<string, string> = {
    L4M: "Essay Structure",
    L2M: "Sentence Analysis",
    L1M: "Vocabulary Recognition",
    L1S: "Phrase Scramble",
    L2S: "Sentence Scramble",
    L3S: "Paragraph Scramble",
    L4S: "Essay Scramble",
    L1F: "Phrase Fill",
    L2F: "Sentence Fill",
  };

  function handlePracticeComplete(
    attempts: Array<AttemptRecord | ScrambleAttemptRecord | FillAttemptRecord | SentFillAttemptRecord>
  ) {
    if (attempts.length > 0) {
      const formData = new FormData();
      formData.set("intent", "save_attempts");
      formData.set("practiceCode", practiceCode);
      formData.set("attemptsJson", JSON.stringify(attempts));
      saveFetcher.submit(formData, { method: "post" });
    }

    if (practiceIndex < 8) {
      // 9 practices (indices 0–8), last is index 8
      setPracticeIndex((prev) => prev + 1);
    } else {
      setShouldComplete(true);
    }
  }

  if (shouldComplete) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-gray-500">Completing encoding phase…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        Practice {practiceIndex + 1} of 9 — {practiceLabel[practiceCode] ?? practiceCode}
      </p>

      {MCQ_CODES.includes(practiceCode as (typeof MCQ_CODES)[number]) ? (
        <MCQPractice
          key={practiceIndex}
          practice={currentPractice as PracticeMCQ}
          onComplete={handlePracticeComplete}
          isPaused={isPaused}
        />
      ) : SCRAMBLE_CODES.includes(practiceCode as (typeof SCRAMBLE_CODES)[number]) ? (
        <ScramblePractice
          key={practiceIndex}
          practice={currentPractice as ScramblePracticeData}
          onComplete={handlePracticeComplete}
          isPaused={isPaused}
        />
      ) : practiceCode === "L1F" ? (
        <FillPractice
          key={practiceIndex}
          practice={currentPractice as PracticePhraseFill}
          onComplete={handlePracticeComplete}
          isPaused={isPaused}
        />
      ) : practiceCode === "L2F" ? (
        <SentFillPractice
          key={practiceIndex}
          practice={currentPractice as PracticeSentFill}
          onComplete={handlePracticeComplete}
          isPaused={isPaused}
        />
      ) : (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-400 mb-4">
            {practiceCode} — coming in a future feature
          </p>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EssayEncodingPage({ loaderData }: Route.ComponentProps) {
  const { unitId, sentences, practices, povCards } = loaderData;

  // Resume the P1 stopwatch from the elapsed time since pov-intro was entered.
  // Use useEffect (not lazy useState) because this page is SSR — the lazy initializer
  // runs server-side where window/sessionStorage are unavailable, and React reuses
  // the server state (0) during hydration even after the client mounts.
  const [initialSeconds, setInitialSeconds] = useState<number | null>(null);
  useEffect(() => {
    const stored = sessionStorage.getItem(`p1_start_${unitId}`);
    setInitialSeconds(stored ? Math.floor((Date.now() - Number(stored)) / 1000) : 0);
  }, [unitId]);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [peekOpen, setPeekOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-stone-50">

      {/* ── Sticky header — controls only ──────────────────────────── */}
      <div className="sticky top-0 z-10 border-b-2 border-gray-500 bg-white px-6 py-3">
        <div className="flex items-center justify-end gap-3">
          {initialSeconds !== null && (
            <StopwatchTimer isPaused={isPaused} initialSeconds={initialSeconds} />
          )}

          <button
            onClick={() => setIsPaused((prev) => !prev)}
            className="rounded-lg border-2 border-gray-500 bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,0.5)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            {isPaused ? "▶ Resume" : "⏸ Pause"}
          </button>

          <button
            onClick={() => setPeekOpen(true)}
            className="rounded-lg bg-blue-600 border-2 border-gray-500 px-3 py-1.5 text-xs font-bold text-white shadow-[2px_2px_0px_0px_rgba(17,24,39,0.5)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            View Essay
          </button>
        </div>
      </div>

      {/* ── Paused overlay ────────────────────────────────────────────── */}
      {isPaused && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-gray-900/40">
          <div className="rounded-lg border-2 border-gray-500 bg-white px-8 py-6 text-center shadow-[5px_5px_0px_0px_rgba(17,24,39,0.5)]">
            <p className="text-lg font-extrabold text-gray-900 mb-2">Session Paused</p>
            <p className="text-sm text-gray-500 mb-4">Your timer is paused.</p>
            <button
              onClick={() => setIsPaused(false)}
              className="rounded-lg bg-blue-600 border-2 border-gray-500 px-6 py-2 text-sm font-bold text-white shadow-[2px_2px_0px_0px_rgba(17,24,39,0.5)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              ▶ Resume
            </button>
          </div>
        </div>
      )}

      {/* ── Two-column body ───────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8 items-start">

        {/* LEFT — practice content */}
        <div className="flex-1 min-w-0">
          <PracticeRenderer
            practices={practices}
            unitId={unitId}
            isPaused={isPaused}
          />
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-[57px]">
          <div className="rounded-lg border-2 border-gray-500 bg-white p-5 shadow-[4px_4px_0px_0px_rgba(17,24,39,0.5)] flex flex-col gap-3">
            <h1 className="text-xl font-extrabold text-gray-900">Practice Questions</h1>
            <p className="text-xs font-black uppercase tracking-widest text-gray-500">Step 2 of 3</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Work through 9 exercises on vocabulary, structure, and essay flow.
            </p>
          </div>
        </aside>

      </div>

      {/* ── Peek Modal ────────────────────────────────────────────────── */}
      <PeekModal
        isOpen={peekOpen}
        onClose={() => setPeekOpen(false)}
        sentences={sentences}
        povCards={povCards}
      />

    </div>
  );
}
