/**
 * unit-complete.$unitId — Unit Completion Screen (F12)
 *
 * Shown after a student submits their P2 essay and completeP2() has already run.
 * At this point in the DB:
 *   - The unit's StudentUnitProgress.status = "complete"
 *   - StudentPath.currentSequencePosition has been incremented (or is null if path done)
 *
 * Two outcomes from the loader:
 *   A. currentSequencePosition === null → redirect to /path-complete (last unit done)
 *   B. currentSequencePosition > 0     → render this screen with newly unlocked QB questions
 *
 * Acceptance criteria covered: AC-4.1, AC-4.2, AC-4.3, AC-4.4
 */
import { redirect, Link } from "react-router";
import { requireStudent } from "~/lib/auth.server";
import { prisma } from "~/lib/prisma.server";
import type { Route } from "./+types/unit-complete.$unitId";

// ─── Loader ───────────────────────────────────────────────────────────────────

/**
 * Loader: collects everything the completion screen needs to show.
 *
 * Guard order:
 *   1. requireStudent → redirect /sign-in if not authenticated
 *   2. StudentPath must exist → redirect /onboarding/tier
 *   3. TierUnitSequence row for this unitId must exist → redirect /dashboard (safety)
 *   4. If path is already complete (currentSequencePosition === null) → redirect /path-complete
 *
 * Then: query QBankUnlocks to find which QB questions were unlocked by THIS unit's
 * sequence position, and return them for display.
 */
export async function loader(args: Route.LoaderArgs) {
  // Step 1: authenticate — requireStudent returns the Clerk userId string
  // or throws a redirect to /sign-in if the user isn't logged in.
  const clerkUserId = await requireStudent(args);

  // Step 2: load the student's path record.
  // We need batchId + tier to scope the QBankUnlocks query,
  // and currentSequencePosition to detect if the path is now complete.
  const path = await prisma.studentPath.findUnique({
    where: { clerkUserId },
    select: {
      batchId: true,
      tier: true,
      currentSequencePosition: true,
    },
  });

  if (!path) {
    // No StudentPath means onboarding wasn't completed — send them back.
    throw redirect("/onboarding/tier");
  }

  const { unitId } = args.params;

  // Step 3: find the sequence position for this specific unitId.
  // This is the position that was just completed (before any increment happened).
  // We query TierUnitSequence for the matching batchId + tier + unitId combo.
  const seqRow = await prisma.tierUnitSequence.findFirst({
    where: {
      batchId: path.batchId,
      tier: path.tier,
      unitId,
    },
    select: { sequencePosition: true },
  });

  if (!seqRow) {
    // The unitId doesn't exist in this student's tier — shouldn't happen,
    // but redirect to dashboard as a safety net.
    throw redirect("/dashboard");
  }

  const completedPosition = seqRow.sequencePosition;

  // Step 4: if currentSequencePosition is null, the student just finished
  // the LAST unit in their path. Redirect to the path-complete screen.
  if (path.currentSequencePosition === null) {
    throw redirect("/path-complete");
  }

  // Step 5: query QBankUnlocks for questions newly unlocked by this unit.
  // unlockedBySequencePosition === completedPosition means: "this Q Bank question
  // becomes available after the student finishes unit N".
  const newlyUnlockedQuestions = await prisma.qBankUnlocks.findMany({
    where: {
      batchId: path.batchId,
      tier: path.tier,
      unlockedBySequencePosition: completedPosition,
    },
    select: {
      questionId: true,
      questionText: true,
    },
  });

  // Return only what the component needs.
  // completedUnitNumber is used for the "Unit N Complete" heading.
  return {
    completedUnitNumber: completedPosition,
    newlyUnlockedQuestions,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Truncates question text to the first 12 words for the unlock preview list.
 * QB questions are full IELTS prompts (often 50–80 words) — we only need a
 * short preview to give the student a sense of what they've unlocked.
 */
function truncateQuestion(text: string): string {
  const words = text.split(" ");
  if (words.length <= 12) return text;
  return words.slice(0, 12).join(" ") + "…";
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * UnitCompletePage — celebrates completing a unit and shows newly unlocked questions.
 *
 * Layout:
 *   ┌─ Header ──────────────────────────────────────────────────────────┐
 *   │  ✓ Unit {N} Complete                                              │
 *   └───────────────────────────────────────────────────────────────────┘
 *   ┌─ Unlocked Questions (only rendered if newlyUnlockedQuestions > 0) ┐
 *   │  "You've unlocked {N} new Question Bank question(s):"             │
 *   │  - question preview                                               │
 *   └───────────────────────────────────────────────────────────────────┘
 *   ┌─ Actions ─────────────────────────────────────────────────────────┐
 *   │  [Go to Question Bank]    [Next Unit →]                           │
 *   └───────────────────────────────────────────────────────────────────┘
 */
export default function UnitCompletePage({ loaderData }: Route.ComponentProps) {
  const { completedUnitNumber, newlyUnlockedQuestions } = loaderData;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        {/*
          The "✓" checkmark gives a visual sense of success.
          completedUnitNumber comes from the loader (the sequencePosition of the unit just done).
        */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <p className="text-4xl mb-2">✓</p>
          <h1 className="text-2xl font-bold text-green-800">
            Unit {completedUnitNumber} Complete
          </h1>
          <p className="text-sm text-green-600 mt-1">
            Great work — you've finished all three phases.
          </p>
        </div>

        {/* ── Newly Unlocked Questions ─────────────────────────────────── */}
        {/*
          Only render this section if at least one QB question was unlocked.
          If no questions were unlocked (e.g. this unit's position had none
          mapped to it), we skip this block entirely — no empty states needed.
        */}
        {newlyUnlockedQuestions.length > 0 && (
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-5">
            <p className="text-sm font-semibold text-purple-800 mb-3">
              You've unlocked {newlyUnlockedQuestions.length} new Question Bank question
              {newlyUnlockedQuestions.length > 1 ? "s" : ""}:
            </p>
            <ul className="flex flex-col gap-2">
              {newlyUnlockedQuestions.map((q) => (
                <li
                  key={q.questionId}
                  className="text-sm text-purple-700 leading-snug"
                >
                  {/* Bullet + truncated question text */}
                  — {truncateQuestion(q.questionText)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Action Buttons ───────────────────────────────────────────── */}
        {/*
          Two links side-by-side:
            1. "Go to Question Bank" → /question-bank (will 404 until F14)
            2. "Next Unit →" → /dashboard (the in-progress card is clickable there)

          Using React Router's <Link> (not a <button> or <Form>) because we're
          just navigating — no form data to submit.
        */}
        <div className="flex gap-3">
          <Link
            to="/question-bank"
            className="flex-1 rounded-lg border border-purple-300 bg-white px-4 py-3 text-center text-sm font-semibold text-purple-700 hover:bg-purple-50 transition-colors"
          >
            Go to Question Bank
          </Link>
          <Link
            to="/dashboard"
            className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Next Unit →
          </Link>
        </div>

      </div>
    </div>
  );
}
