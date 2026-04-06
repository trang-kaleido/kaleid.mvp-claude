/**
 * unit.$unitId.p1.pov-encoding — PoV Encoding Sub-Route (F17)
 *
 * Renders L3M_POV (practices[2]) then L2M_POV (practices[3]) in sequence.
 *
 * Two-stage component:
 *   Stage 1 — "reading_essay": full model essay shown inline as mandatory
 *             reading block before questions unlock.
 *   Stage 2 — "practice": MCQPractice for L3M_POV then L2M_POV sequentially.
 *
 * On completion: phase advances to p1_essay_encoding.
 * StopwatchTimer, Pause, and Peek modal available during practice stage.
 * StudentAttempt rows written per item.
 */
import { useState, useEffect } from "react";
import { redirect, useFetcher } from "react-router";
import { requireStudent } from "~/lib/auth.server";
import { prisma } from "~/lib/prisma.server";
import { PhaseTransitionService } from "~/services/phase-transition.server";
import { safeParseJson } from "~/lib/json.server";
import { MCQPractice } from "~/components/practices/MCQPractice";
import type { AttemptRecord, PracticeMCQ } from "~/components/practices/MCQPractice";
import { StopwatchTimer } from "~/components/ui/StopwatchTimer";
import { PeekModal, type PovCard } from "~/components/ui/PeekModal";
import type { Route } from "./+types/unit.$unitId.p1.pov-encoding";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface Practice {
  practice_code: string;
  [key: string]: unknown;
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

  if (progress.currentPhase !== "p1_pov_encoding") {
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

  // practices[2] = L3M_POV, practices[3] = L2M_POV
  const povEncoding = [practices[2], practices[3]] as unknown as PracticeMCQ[];

  // Build PoV cards for PeekModal (same logic as essay-encoding)
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

  return {
    unitId,
    question: prepUnit.question,
    sentences,
    povEncoding,
    povCards,
  };
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
        studentId: path.studentId,
        unitId,
        practiceCode,
        itemId: attempt.itemId as string,
        version: attempt.version as string | null,
        response: { selectedIndex: attempt.selectedIndex as number },
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

  if (intent === "complete_pov_encoding") {
    await PhaseTransitionService.completePovEncoding(clerkUserId, unitId);
    throw redirect(`/unit/${unitId}/p1/essay-encoding`);
  }

  return { ok: false, error: `Unknown intent: ${intent}` };
}

// ─── EssayDisplay ─────────────────────────────────────────────────────────────

/**
 * EssayDisplay — renders the full model essay grouped by paragraph.
 * Used during the mandatory reading stage before MCQ questions appear.
 */
function EssayDisplay({ sentences }: { sentences: Sentence[] }) {
  const paragraphOrder = ["introduction", "body_1", "body_2", "body_3", "body_4", "conclusion"];

  const grouped = paragraphOrder
    .filter((p) => sentences.some((s) => s.paragraph_type === p))
    .map((p) => ({
      type: p,
      sentences: sentences
        .filter((s) => s.paragraph_type === p)
        .sort((a, b) => a.order - b.order),
    }));

  const labelMap: Record<string, string> = {
    introduction: "Introduction",
    body_1: "Body 1",
    body_2: "Body 2",
    body_3: "Body 3",
    body_4: "Body 4",
    conclusion: "Conclusion",
  };

  return (
    <div className="flex flex-col gap-5">
      {grouped.map(({ type, sentences: paraSentences }) => (
        <div key={type}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            {labelMap[type] ?? type}
          </p>
          <div className="rounded-lg border border-gray-200 bg-white p-4 flex flex-col gap-2">
            {paraSentences.map((s) => (
              <div key={s.sentence_id} className="relative group">
                <p className="text-sm text-gray-800 leading-relaxed">
                  {s.canonical_text}
                </p>
                <span className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 pointer-events-none">
                  {s.rhetoric_label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── PovEncodingRenderer ──────────────────────────────────────────────────────

type Stage = "reading_essay" | "practice";

interface PovEncodingRendererProps {
  unitId: string;
  sentences: Sentence[];
  povEncoding: PracticeMCQ[];
  povCards: PovCard[];
  isPaused: boolean;
}

function PovEncodingRenderer({
  unitId,
  sentences,
  povEncoding,
  isPaused,
}: PovEncodingRendererProps) {
  const [stage, setStage] = useState<Stage>("reading_essay");
  const [practiceIndex, setPracticeIndex] = useState<number>(0);

  const saveFetcher = useFetcher();
  const completeFetcher = useFetcher();

  const [shouldComplete, setShouldComplete] = useState<boolean>(false);

  useEffect(() => {
    if (!shouldComplete) return;
    const formData = new FormData();
    formData.set("intent", "complete_pov_encoding");
    completeFetcher.submit(formData, { method: "post" });
  }, [shouldComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentPractice = povEncoding[practiceIndex];
  const practiceCode = currentPractice?.practice_code ?? "";

  function handlePracticeComplete(attempts: AttemptRecord[]) {
    if (attempts.length > 0) {
      const formData = new FormData();
      formData.set("intent", "save_attempts");
      formData.set("practiceCode", practiceCode);
      formData.set("attemptsJson", JSON.stringify(attempts));
      saveFetcher.submit(formData, { method: "post" });
    }

    if (practiceIndex < 1) {
      // Move from L3M_POV (index 0) to L2M_POV (index 1)
      setPracticeIndex((prev) => prev + 1);
    } else {
      // L2M_POV done — complete pov encoding
      setShouldComplete(true);
    }
  }

  if (stage === "reading_essay") {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800 leading-relaxed">
            Read the model essay below. The questions that follow will ask you about
            how PoVs are expressed in this writing. These questions are to help you
            deepen your understanding, not to earn a score. Use it as a tool, not a
            test. A record of your effort will be sent for your teacher to review.
          </p>
        </div>

        <EssayDisplay sentences={sentences} />

        <div className="flex justify-end">
          <button
            onClick={() => setStage("practice")}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            I&apos;m ready to answer questions →
          </button>
        </div>
      </div>
    );
  }

  if (shouldComplete) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-gray-500">Completing PoV encoding…</p>
      </div>
    );
  }

  const practiceLabel: Record<string, string> = {
    L3M_POV: "PoV Paragraph Matching",
    L2M_POV: "PoV Sentence Matching",
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        Practice {practiceIndex + 1} of 2 — {practiceLabel[practiceCode] ?? practiceCode}
      </p>

      <MCQPractice
        key={practiceIndex}
        practice={currentPractice}
        onComplete={handlePracticeComplete}
        isPaused={isPaused}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PovEncodingPage({ loaderData }: Route.ComponentProps) {
  const { unitId, sentences, povEncoding, povCards } = loaderData;

  // Resume the P1 stopwatch from the elapsed time since pov-intro was entered.
  // Use useEffect (not lazy useState) — SSR runs the lazy initializer server-side
  // where sessionStorage is unavailable, and React reuses the server state (0)
  // during hydration even after the client mounts.
  const [initialSeconds, setInitialSeconds] = useState<number | null>(null);
  useEffect(() => {
    const stored = sessionStorage.getItem(`p1_start_${unitId}`);
    setInitialSeconds(stored ? Math.floor((Date.now() - Number(stored)) / 1000) : 0);
  }, [unitId]);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [peekOpen, setPeekOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Sticky header ────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-sm font-bold text-gray-900">PoV Encoding</h1>

          <div className="flex items-center gap-3">
            {initialSeconds !== null && (
              <StopwatchTimer isPaused={isPaused} initialSeconds={initialSeconds} />
            )}

            <button
              onClick={() => setIsPaused((prev) => !prev)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {isPaused ? "▶ Resume" : "⏸ Pause"}
            </button>

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
        <PovEncodingRenderer
          unitId={unitId}
          sentences={sentences}
          povEncoding={povEncoding}
          povCards={povCards}
          isPaused={isPaused}
        />
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
