/**
 * question-bank — Question Bank Home (F14)
 *
 * Two-column layout:
 *   Left  — "Perspectives Library": all PoVs accumulated by the student
 *            (from units where they have passed pov-intro).
 *            Each card links to /pov/:directionTag.
 *   Right — Question list (attempted / unlocked / locked).
 *
 * Acceptance criteria covered: AC-4.8, AC-4.9, AC-4.10, AC-4.11
 */
import { redirect, Link } from "react-router";
import { requireStudent } from "~/lib/auth.server";
import { prisma } from "~/lib/prisma.server";
import { safeParseJson } from "~/lib/json.server";
import { povContent, poleStyles } from "~/content/pov-content";
import type { Pole } from "~/content/pov-content";
import type { Route } from "./+types/question-bank";

// ─── Types ───────────────────────────────────────────────────────────────────

type QuestionRow = {
  questionId: string;
  displayText: string;
  unlockedBySequencePosition: number;
  state: "attempted" | "unlocked" | "locked";
  attemptCount: number;
};

type StudiedPov = {
  direction_tag: string;
  argument: string;
  poles: [Pole, Pole] | null; // available when content exists
  hasContent: boolean;
};

// Minimal shape we need from the practices JSONB
interface PovDirection {
  direction_tag: string;
  argument: string;
}
interface PovIntroPractice {
  practice_code: "POV_INTRO";
  directions: PovDirection[];
}
interface Practice {
  practice_code: string;
  [key: string]: unknown;
}

// ─── Loader ──────────────────────────────────────────────────────────────────

export async function loader(args: Route.LoaderArgs) {
  const clerkUserId = await requireStudent(args);

  const path = await prisma.studentPath.findUnique({
    where: { clerkUserId },
    select: {
      studentId: true,
      batchId: true,
      tier: true,
      currentSequencePosition: true,
    },
  });

  if (!path) {
    throw redirect("/onboarding/tier");
  }

  // Run questions query, attempt groupBy, and studied-units query in parallel.
  const [qbankQuestions, attemptGroups, studiedProgress] = await Promise.all([
    prisma.qBankUnlocks.findMany({
      where: { batchId: path.batchId, tier: path.tier },
      orderBy: { unlockedBySequencePosition: "asc" },
      select: {
        questionId: true,
        questionText: true,
        unlockedBySequencePosition: true,
      },
    }),
    prisma.studentAttempt.groupBy({
      by: ["qbankQuestionId"],
      where: {
        studentId: path.studentId,
        artifactType: "free_practice",
        qbankQuestionId: { not: null },
      },
      _count: { id: true },
    }),
    // Units where the student has passed the pov-intro screen
    prisma.studentUnitProgress.findMany({
      where: {
        studentId: path.studentId,
        NOT: { currentPhase: { in: ["p0", "p1_pov_intro", "p1"] } },
        status: { not: "locked" },
      },
      select: { unitId: true },
    }),
  ]);

  // ── Shape question data ────────────────────────────────────────────────────

  const attemptMap = new Map(
    attemptGroups.map((a) => [a.qbankQuestionId!, a._count.id])
  );

  const effectivePosition =
    path.currentSequencePosition ?? (path.tier === "tier_50" ? 50 : 80);

  const questions: QuestionRow[] = qbankQuestions.map((q) => {
    const isUnlocked = effectivePosition >= q.unlockedBySequencePosition;
    const attemptCount = attemptMap.get(q.questionId) ?? 0;
    const state: "attempted" | "unlocked" | "locked" =
      attemptCount > 0 ? "attempted" : isUnlocked ? "unlocked" : "locked";
    const words = q.questionText.split(" ");
    const displayText = isUnlocked
      ? q.questionText
      : words.slice(0, 8).join(" ") + (words.length > 8 ? "…" : "");
    return {
      questionId: q.questionId,
      displayText,
      unlockedBySequencePosition: q.unlockedBySequencePosition,
      state,
      attemptCount,
    };
  });

  // ── Shape accumulated PoVs ─────────────────────────────────────────────────

  const studiedPovs: StudiedPov[] = [];

  if (studiedProgress.length > 0) {
    const unitIds = studiedProgress.map((p) => p.unitId);

    const prepUnits = await prisma.prepUnit.findMany({
      where: { unitId: { in: unitIds } },
      select: { practices: true },
    });

    const seen = new Set<string>();

    for (const unit of prepUnits) {
      const practices = safeParseJson<Practice[]>(unit.practices);
      if (!practices || !practices[1]) continue;
      const povIntro = practices[1] as unknown as PovIntroPractice;
      if (!Array.isArray(povIntro.directions)) continue;

      for (const dir of povIntro.directions) {
        if (seen.has(dir.direction_tag)) continue;
        seen.add(dir.direction_tag);
        const entry = povContent[dir.direction_tag];
        studiedPovs.push({
          direction_tag: dir.direction_tag,
          argument: dir.argument,
          poles: entry ? entry.poles : null,
          hasContent: !!entry,
        });
      }
    }
  }

  return { questions, studiedPovs };
}

// ─── QuestionCard ─────────────────────────────────────────────────────────────

function QuestionCard({ question }: { question: QuestionRow }) {
  const base =
    "rounded-lg border-2 p-4 flex items-start justify-between gap-3 transition-colors";

  const inner = (
    <>
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <span
          className={
            question.state === "attempted"
              ? "text-xs font-black text-purple-600 uppercase tracking-widest"
              : question.state === "unlocked"
              ? "text-xs font-black text-purple-500 uppercase tracking-widest"
              : "text-xs font-black text-gray-400 uppercase tracking-widest"
          }
        >
          {question.state === "attempted" && "Attempted"}
          {question.state === "unlocked" && "Unlocked"}
          {question.state === "locked" && "Locked"}
        </span>
        <p className="text-sm text-gray-800 leading-relaxed">
          {question.displayText}
        </p>
        {question.state === "locked" && (
          <p className="text-xs text-gray-400 mt-1">
            Unlock after completing Prep-Unit{" "}
            {question.unlockedBySequencePosition}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {question.state === "attempted" && (
          <span className="text-xs text-gray-500">
            {question.attemptCount}{" "}
            {question.attemptCount === 1 ? "attempt" : "attempts"}
          </span>
        )}
        {question.state !== "locked" && (
          <span className="text-purple-500 font-semibold text-sm">→</span>
        )}
      </div>
    </>
  );

  if (question.state === "attempted" || question.state === "unlocked") {
    return (
      <Link
        to={`/question-bank/${question.questionId}`}
        className={`${base} border-purple-500 bg-purple-50 shadow-[3px_3px_0px_0px_rgba(88,28,135,0.5)] hover:shadow-[1px_1px_0px_0px_rgba(88,28,135,0.5)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className={`${base} border-gray-400 bg-gray-50 opacity-60 cursor-default`}>
      {inner}
    </div>
  );
}

// ─── PovLibraryCard ───────────────────────────────────────────────────────────

function PovLibraryCard({ pov }: { pov: StudiedPov }) {
  const inner = (
    <div className="flex flex-col gap-2">
      {/* Pole badges */}
      {pov.poles && (
        <div className="flex gap-1.5 flex-wrap">
          {pov.poles.map((pole) => (
            <span
              key={pole}
              className={`${poleStyles[pole]} border border-gray-900 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest`}
            >
              {pole}
            </span>
          ))}
        </div>
      )}
      {/* Argument */}
      <p className="text-xs font-semibold text-gray-800 leading-snug">
        {pov.argument}
      </p>
      {/* Dive Deep link or coming-soon label */}
      {pov.hasContent ? (
        <span className="text-[10px] font-black text-blue-600 uppercase tracking-wide">
          Dive Deep →
        </span>
      ) : (
        <span className="text-[10px] font-black text-gray-300 uppercase tracking-wide">
          Content coming soon
        </span>
      )}
    </div>
  );

  if (pov.hasContent) {
    return (
      <Link
        to={`/pov/${pov.direction_tag}?from=question-bank`}
        className="rounded border-2 border-gray-500 bg-white p-3 shadow-[2px_2px_0px_0px_rgba(17,24,39,0.4)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all block"
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className="rounded border-2 border-gray-300 bg-white p-3 opacity-60">
      {inner}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function QuestionBankPage({ loaderData }: Route.ComponentProps) {
  const { questions, studiedPovs } = loaderData;

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">

        {/* ── Top header ──────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Question Bank</h1>
            <p className="text-sm text-gray-500 mt-1">
              Free practice on unlocked questions
            </p>
          </div>
          <Link
            to="/dashboard"
            className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors shrink-0 mt-1"
          >
            ← Dashboard
          </Link>
        </div>

        {/* ── Two-column layout ───────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Left: PoV Library ──────────────────────────────────────── */}
          <aside className="w-full lg:w-72 lg:flex-shrink-0 lg:sticky lg:top-6 flex flex-col gap-3">
            <div className="rounded-lg border-2 border-gray-500 bg-white shadow-[3px_3px_0px_0px_rgba(17,24,39,0.5)] overflow-hidden">
              {/* Panel header */}
              <div className="border-b-2 border-gray-500 px-4 py-3 bg-stone-50">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Perspectives Library
                </p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  {studiedPovs.length > 0
                    ? `${studiedPovs.length} perspective${studiedPovs.length === 1 ? "" : "s"} studied`
                    : "No perspectives yet"}
                </p>
              </div>

              {/* PoV cards or empty state */}
              <div className="p-3 flex flex-col gap-2 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
                {studiedPovs.length > 0 ? (
                  studiedPovs.map((pov) => (
                    <PovLibraryCard key={pov.direction_tag} pov={pov} />
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-6 leading-relaxed">
                    Complete your first unit to see the perspectives you&apos;ve
                    studied here.
                  </p>
                )}
              </div>
            </div>
          </aside>

          {/* ── Right: Questions ───────────────────────────────────────── */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">

            {/* How it works */}
            <div className="rounded-lg border-2 border-gray-500 bg-white p-4 shadow-[3px_3px_0px_0px_rgba(17,24,39,0.5)] flex flex-col gap-3">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                How it works
              </p>
              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-gray-900">Unlocking —</span>{" "}
                  Each question unlocks after you complete the corresponding
                  prep-unit. Locked questions show a preview so you know what's
                  coming.
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-gray-900">Writing —</span>{" "}
                  Click any unlocked question to write a full IELTS essay.
                  There's no time limit here — take as long as you need.
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-gray-900">Feedback —</span>{" "}
                  Once you submit, your essay is sent to your teacher for
                  review. You can attempt the same question multiple times.
                </p>
              </div>
            </div>

            {/* Question list */}
            <div className="flex flex-col gap-3">
              {questions.map((q) => (
                <QuestionCard key={q.questionId} question={q} />
              ))}
            </div>

            {questions.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">
                No questions available yet.
              </p>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
