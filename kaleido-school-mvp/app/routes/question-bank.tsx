/**
 * question-bank — Question Bank Home (F14)
 *
 * Lists all Q Bank questions for the student's tier in three states:
 *   - attempted  (purple, clickable) — student has submitted at least one free_practice essay
 *   - unlocked   (purple, clickable) — sequence position reached, no attempt yet
 *   - locked     (grey, not clickable) — student hasn't reached the unlock position yet
 *
 * Access logic:
 *   effectivePosition = currentSequencePosition ?? tier max (50 or 80)
 *   When the path is complete (currentSequencePosition = null), ALL questions count as unlocked.
 *
 * Acceptance criteria covered: AC-4.8, AC-4.9, AC-4.10, AC-4.11
 */
import { redirect, Link } from "react-router";
import { requireStudent } from "~/lib/auth.server";
import { prisma } from "~/lib/prisma.server";
import type { Route } from "./+types/question-bank";

// ─── Loader ──────────────────────────────────────────────────────────────────

/**
 * Loader: fetches all QB questions and computes state (attempted/unlocked/locked)
 * for this student.
 *
 * Guard order:
 *   1. requireStudent → redirect /sign-in if not authenticated
 *   2. StudentPath must exist → redirect /onboarding/tier
 *
 * Server-side derivations (so the component just renders):
 *   - effectivePosition: handles the "path complete" case where null means all unlocked
 *   - state: 'attempted' | 'unlocked' | 'locked' per question
 *   - displayText: full text for unlocked, first 8 words + "…" for locked (AC-4.9)
 */
export async function loader(args: Route.LoaderArgs) {
  // Step 1: authenticate. Returns Clerk user ID string.
  const clerkUserId = await requireStudent(args);

  // Step 2: load the student's path — we need batchId, tier, and sequence position.
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
    // No StudentPath = onboarding not complete.
    throw redirect("/onboarding/tier");
  }

  // Step 3: fetch ALL Q Bank questions for this student's batch + tier,
  // ordered by when they unlock so the list flows from earliest → latest.
  const qbankQuestions = await prisma.qBankUnlocks.findMany({
    where: { batchId: path.batchId, tier: path.tier },
    orderBy: { unlockedBySequencePosition: "asc" },
    select: {
      questionId: true,
      questionText: true,
      unlockedBySequencePosition: true,
    },
  });

  // Step 4: find which questions this student has already attempted.
  // groupBy gives us one row per qbankQuestionId with a count of attempts.
  // We only look at free_practice artifacts (QB writes, not unit attempts).
  const attemptGroups = await prisma.studentAttempt.groupBy({
    by: ["qbankQuestionId"],
    where: {
      studentId: path.studentId,
      artifactType: "free_practice",
      qbankQuestionId: { not: null },
    },
    _count: { id: true },
  });

  // Build a Map so we can look up attempt counts in O(1).
  // Key: questionId UUID string  →  Value: number of attempts
  const attemptMap = new Map(
    attemptGroups.map((a) => [a.qbankQuestionId!, a._count.id])
  );

  // Step 5: compute the "effective" sequence position.
  // When currentSequencePosition is null, the student has finished the entire path.
  // In that case, all questions should appear as unlocked regardless of position,
  // so we use the tier maximum (50 or 80) to guarantee every question passes the check.
  const effectivePosition =
    path.currentSequencePosition ??
    (path.tier === "tier_50" ? 50 : 80);

  // Step 6: shape each question into the form the component needs.
  // We do all logic here — the component receives clean, pre-shaped data.
  const questions = qbankQuestions.map((q) => {
    const isUnlocked = effectivePosition >= q.unlockedBySequencePosition;
    const attemptCount = attemptMap.get(q.questionId) ?? 0;

    // Determine the display state:
    //   attempted = unlocked + at least one submission
    //   unlocked  = position reached, no submission yet
    //   locked    = position not yet reached
    const state: "attempted" | "unlocked" | "locked" =
      attemptCount > 0 ? "attempted" : isUnlocked ? "unlocked" : "locked";

    // For locked questions, truncate to first 8 words so the student gets
    // a hint of what's coming without revealing the full question. (AC-4.9)
    const words = q.questionText.split(" ");
    const displayText =
      isUnlocked
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

  return { questions };
}

// ─── Types ───────────────────────────────────────────────────────────────────

// Shape of a single question row, derived from the loader return.
type QuestionRow = {
  questionId: string;
  displayText: string;
  unlockedBySequencePosition: number;
  state: "attempted" | "unlocked" | "locked";
  attemptCount: number;
};

// ─── QuestionCard ─────────────────────────────────────────────────────────────

/**
 * QuestionCard — renders one row in the question list.
 *
 * Attempted and unlocked questions are clickable Links (AC-4.8, AC-4.10).
 * Locked questions are plain divs — no interaction, greyed out (AC-4.8).
 */
function QuestionCard({ question }: { question: QuestionRow }) {
  // Base styles shared by all three states
  const base =
    "rounded-lg border p-4 flex items-start justify-between gap-3 transition-colors";

  // Inner content is the same for all states — only the wrapper changes.
  const inner = (
    <>
      {/* Left side: state badge + question text */}
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        {/* State badge — small coloured pill */}
        <span
          className={
            question.state === "attempted"
              ? "text-xs font-semibold text-purple-600 uppercase tracking-wide"
              : question.state === "unlocked"
              ? "text-xs font-semibold text-purple-500 uppercase tracking-wide"
              : "text-xs font-semibold text-gray-400 uppercase tracking-wide"
          }
        >
          {question.state === "attempted" && "Attempted"}
          {question.state === "unlocked" && "Unlocked"}
          {question.state === "locked" && "Locked"}
        </span>

        {/* Question text (full for unlocked, truncated for locked) */}
        <p className="text-sm text-gray-800 leading-relaxed">
          {question.displayText}
        </p>

        {/* For locked questions: tell the student when this question unlocks */}
        {question.state === "locked" && (
          <p className="text-xs text-gray-400 mt-1">
            Unlock after completing Prep-Unit {question.unlockedBySequencePosition}
          </p>
        )}
      </div>

      {/* Right side: attempt count (if any) + arrow for clickable states */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {question.state === "attempted" && (
          <span className="text-xs text-gray-500">
            {question.attemptCount} {question.attemptCount === 1 ? "attempt" : "attempts"}
          </span>
        )}
        {question.state !== "locked" && (
          <span className="text-purple-500 font-semibold text-sm">→</span>
        )}
      </div>
    </>
  );

  // Unlocked and attempted: render as a clickable Link
  if (question.state === "attempted" || question.state === "unlocked") {
    return (
      <Link
        to={`/question-bank/${question.questionId}`}
        className={`${base} border-purple-300 bg-purple-50 hover:bg-purple-100 cursor-pointer`}
      >
        {inner}
      </Link>
    );
  }

  // Locked: plain div, not interactive (AC-4.8)
  return (
    <div
      className={`${base} border-gray-200 bg-gray-50 opacity-60 cursor-default`}
    >
      {inner}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * QuestionBankPage — the QB home screen.
 *
 * Layout:
 *   ┌─ Header ────────────────────────────────────────────────────────────┐
 *   │  Question Bank                                                       │
 *   │  Free practice on unlocked questions                                │
 *   └─────────────────────────────────────────────────────────────────────┘
 *   ┌─ Question list ─────────────────────────────────────────────────────┐
 *   │  [attempted] Full text          3 attempts  →                       │
 *   │  [unlocked]  Full text                      →                       │
 *   │  [locked]    First 8 words…  Unlock after Unit N                   │
 *   └─────────────────────────────────────────────────────────────────────┘
 */
export default function QuestionBankPage({ loaderData }: Route.ComponentProps) {
  const { questions } = loaderData;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
          <p className="text-sm text-gray-500 mt-1">
            Free practice on unlocked questions
          </p>
        </div>

        {/* ── Question list ────────────────────────────────────────────── */}
        {/*
          Each question is rendered as a QuestionCard.
          The loader already sorted by unlockedBySequencePosition (asc),
          so attempted/unlocked questions appear before locked ones naturally.
        */}
        <div className="flex flex-col gap-3">
          {questions.map((q) => (
            <QuestionCard key={q.questionId} question={q} />
          ))}
        </div>

        {/* ── Empty state ──────────────────────────────────────────────── */}
        {/*
          Shown only if the QB has no questions at all (e.g. data not ingested yet).
          In normal operation this won't appear.
        */}
        {questions.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">
            No questions available yet.
          </p>
        )}

        {/* ── Back link ────────────────────────────────────────────────── */}
        <Link
          to="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back to Dashboard
        </Link>

      </div>
    </div>
  );
}
