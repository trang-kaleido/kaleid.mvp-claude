/**
 * question-bank.$questionId — Question Bank Write Screen (F14)
 *
 * Free practice essay page for a single Q Bank question.
 * The student writes a timed IELTS essay with:
 *   - 40-minute countdown timer (same component as P2)
 *   - The IELTS question text
 *   - A textarea for the essay
 *   - NO peek, NO scaffold, NO hints (AC-4.12)
 *
 * Each submission creates a NEW StudentAttempt row — there is no "one per question"
 * limit, allowing students to practice as many times as they like (AC-4.14).
 *
 * After submit → redirect to /question-bank (AC-4.15 — no save state on this page).
 *
 * Acceptance criteria covered: AC-4.12, AC-4.13, AC-4.14, AC-4.15
 */
import { useState, useEffect } from "react";
import { redirect, Form, useActionData } from "react-router";
import { z } from "zod";
import { requireStudent } from "~/lib/auth.server";
import { prisma } from "~/lib/prisma.server";
import { CountdownTimer } from "~/components/ui/CountdownTimer";
import type { Route } from "./+types/question-bank.$questionId";

// ─── Loader ──────────────────────────────────────────────────────────────────

/**
 * Loader: verifies access and returns the question text.
 *
 * Guard order:
 *   1. requireStudent → redirect /sign-in if not authenticated
 *   2. StudentPath must exist → redirect /onboarding/tier
 *   3. QBankUnlocks row must exist for this questionId + batchId + tier
 *      → redirect /question-bank if not found (bad/unknown questionId)
 *   4. Access guard: effectivePosition >= unlockedBySequencePosition
 *      → redirect /question-bank if student hasn't reached this question yet
 *
 * Why redirect to /question-bank instead of a 404?
 * Redirecting to the list is friendlier and keeps the student in the app.
 * A 404 would be confusing — they can just pick an unlocked question from the list.
 */
export async function loader(args: Route.LoaderArgs) {
  // Step 1: authenticate.
  const clerkUserId = await requireStudent(args);

  // Step 2: load the student's path for batchId, tier, and sequence position.
  const path = await prisma.studentPath.findUnique({
    where: { clerkUserId },
    select: {
      batchId: true,
      tier: true,
      currentSequencePosition: true,
    },
  });

  if (!path) {
    throw redirect("/onboarding/tier");
  }

  const { questionId } = args.params;

  // Step 3: look up this specific question in the QB for this student's batch + tier.
  // If it doesn't exist, the URL is invalid — send back to the QB list.
  const question = await prisma.qBankUnlocks.findUnique({
    where: {
      batchId_tier_questionId: {
        batchId: path.batchId,
        tier: path.tier,
        questionId,
      },
    },
    select: {
      questionText: true,
      unlockedBySequencePosition: true,
    },
  });

  if (!question) {
    // questionId doesn't exist in this batch/tier — bad URL.
    throw redirect("/question-bank");
  }

  // Step 4: access guard — is this question actually unlocked for this student?
  // Same effectivePosition logic as the QB home loader:
  // null currentSequencePosition = path complete = all questions unlocked.
  const effectivePosition =
    path.currentSequencePosition ??
    (path.tier === "tier_50" ? 50 : 80);

  if (effectivePosition < question.unlockedBySequencePosition) {
    // Student navigated to a locked question directly (e.g. via URL bar).
    // Send them back to the list where they can pick an unlocked one.
    throw redirect("/question-bank");
  }

  return {
    questionId,
    questionText: question.questionText,
  };
}

// ─── Action ──────────────────────────────────────────────────────────────────

/**
 * Zod schema for the QB write form.
 *
 * Same 100-character minimum as P0 and P2 — ensures meaningful effort before
 * we store the attempt.
 */
const QBWriteSchema = z.object({
  essay: z.string().min(100, "Your essay must be at least 100 characters."),
});

/**
 * Action: saves the free-practice essay as a new StudentAttempt.
 *
 * Every submission creates a NEW row — no deduplication. (AC-4.14)
 * This is intentional: students should be able to practice the same question
 * multiple times, and each attempt is independently stored for the educator.
 *
 * If validation fails → returns { error } for inline display.
 * If validation passes → creates the attempt, then redirects to /question-bank.
 */
export async function action(args: Route.ActionArgs) {
  // Step 1: authenticate.
  const clerkUserId = await requireStudent(args);

  const { questionId } = args.params;

  // Step 2: get the student's internal UUID (studentId).
  // StudentAttempt uses the UUID, not the Clerk string.
  const path = await prisma.studentPath.findUnique({
    where: { clerkUserId },
    select: { studentId: true },
  });

  if (!path) {
    throw redirect("/onboarding/tier");
  }

  // Step 3: validate the essay.
  const formData = await args.request.formData();
  const rawEssay = formData.get("essay");

  const result = QBWriteSchema.safeParse({ essay: rawEssay });

  if (!result.success) {
    // Return the first validation error — the component will render it inline.
    return { error: result.error.issues[0].message };
  }

  // Step 4: create the StudentAttempt row.
  //
  // Fields explained:
  //   unitId: null          — this is a QB attempt, not linked to a prep unit
  //   qbankQuestionId       — links the attempt to the QB question (for groupBy queries)
  //   practiceCode: 'QB_WRITE' — identifies this as a QB free-practice write
  //   itemId: 'QB_WRITE'    — required non-null field, same value for all QB writes
  //   version: null         — QB writes are unversioned
  //   response: {}          — no structured response (it's a free-write essay)
  //   pass: null            — free practice is never graded pass/fail
  //   artifactType: 'free_practice' — used by the Educator Console (F15) to find these
  //   artifactContent       — the student's essay text
  await prisma.studentAttempt.create({
    data: {
      studentId: path.studentId,
      unitId: null,
      qbankQuestionId: questionId,
      practiceCode: "QB_WRITE",
      itemId: "QB_WRITE",
      version: null,
      response: {},
      pass: null,
      startedAt: new Date(),
      completedAt: new Date(),
      artifactType: "free_practice",
      artifactContent: result.data.essay,
    },
  });

  // Step 5: redirect back to the QB home. (AC-4.15)
  // There is no "well done" screen — students just return to the list and can
  // pick another question or re-attempt the same one.
  throw redirect("/question-bank");
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * QuestionBankWritePage — free practice essay screen.
 *
 * Layout:
 *   ┌─ Header ─────────────────────────────────────────────────────────────┐
 *   │  "Question Bank — Free Practice"           CountdownTimer (40 min)   │
 *   └──────────────────────────────────────────────────────────────────────┘
 *   ┌─ Question box ───────────────────────────────────────────────────────┐
 *   │  IELTS Task 2 Question                                                │
 *   │  {questionText}                                                       │
 *   └──────────────────────────────────────────────────────────────────────┘
 *   ┌─ Essay form ─────────────────────────────────────────────────────────┐
 *   │  <textarea name="essay" rows=16 />                                   │
 *   │  {error && <p role="alert">{error}</p>}                              │
 *   │  [Submit Essay →]                                                    │
 *   └──────────────────────────────────────────────────────────────────────┘
 *
 * Deliberately minimal — no peek, no scaffold, no hints. (AC-4.12)
 * This is a timed free-write, not a guided learning experience.
 */
export default function QuestionBankWritePage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { questionText } = loaderData;

  // actionData is set when the action returns a validation error (essay too short).
  // It's undefined on the initial page load and after a successful submit (which redirects).
  const error = actionData?.error;

  // Capture the exact moment the page first loaded.
  // Same pattern as P0 and P2 — records when the student began the attempt.
  // Even though the action uses new Date() server-side, capturing client-side
  // startedAt is good practice for future analytics.
  const [startedAt, setStartedAt] = useState<string>("");

  useEffect(() => {
    // This runs once on mount — equivalent to "page load" time.
    setStartedAt(new Date().toISOString());
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* ── Header ───────────────────────────────────────────────────── */}
        {/*
          Simple two-part header: page title on the left, timer on the right.
          No extra buttons — no Peek, no Pause, no hints. (AC-4.12)
        */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Question Bank — Free Practice
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Write your best IELTS Task 2 essay
            </p>
          </div>
          {/* 40-minute timer — same component used in P2. No pause. */}
          <CountdownTimer durationMinutes={40} />
        </div>

        {/* ── IELTS Question ───────────────────────────────────────────── */}
        {/*
          The question is displayed read-only, above the form.
          Same card style as P0 and P2.
        */}
        <div className="rounded-lg border border-gray-300 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            IELTS Task 2 Question
          </p>
          <p className="text-sm text-gray-800 leading-relaxed">{questionText}</p>
        </div>

        {/* ── Essay Form ───────────────────────────────────────────────── */}
        <Form method="post" className="flex flex-col gap-4">
          {/* Hidden field: client-side start time, for future analytics */}
          <input type="hidden" name="startedAt" value={startedAt} />

          {/* Essay textarea */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="essay"
              className="text-sm font-medium text-gray-700"
            >
              Your Essay
            </label>
            <textarea
              id="essay"
              name="essay"
              rows={16}
              placeholder="Write your IELTS Task 2 essay here..."
              className="rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-400 resize-y"
            />
          </div>

          {/* Inline validation error — only shown after a failed submission */}
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {/*
            Submit button — always enabled (same rule as P0/P2).
            The timer expiring does not lock or disable submission.
          */}
          <button
            type="submit"
            className="self-end rounded-lg bg-purple-600 px-6 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
          >
            Submit Essay →
          </button>
        </Form>

      </div>
    </div>
  );
}
