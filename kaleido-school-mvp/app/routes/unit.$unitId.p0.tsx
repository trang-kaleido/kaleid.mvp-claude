/**
 * unit.$unitId.p0 — P0 Cold Write Page (F06)
 *
 * The student's first encounter with a unit. They write a full IELTS essay
 * under timed conditions WITHOUT seeing the model essay or any hints first.
 * This "cold write" becomes Artifact 1 — the educator can compare it with
 * Artifact 2 (written after encoding) to see growth.
 *
 * Acceptance criteria covered here:
 *   AC-3.2 — Shows IELTS question + textarea + 40-minute countdown timer
 *   AC-3.3 — Submit is always enabled (even after timer expires)
 *   AC-3.4 — No pause button on the timer
 *   AC-3.5 — StudentAttempt created with practiceCode:'P0', artifactType:'artifact_1'
 *   AC-3.6 — currentPhase updated to 'p1' in same transaction as artifact write
 */
import { useState, useEffect } from "react";
import { redirect, Form, useActionData } from "react-router";
import { z } from "zod";
import { requireStudent } from "~/lib/auth.server";
import { prisma } from "~/lib/prisma.server";
import { PhaseTransitionService } from "~/services/phase-transition.server";
import { CountdownTimer } from "~/components/ui/CountdownTimer";
import type { Route } from "./+types/unit.$unitId.p0";

// ─── Loader ──────────────────────────────────────────────────────────────────

/**
 * Loader: fetches the IELTS question for this unit.
 *
 * Also performs several guard checks — if any fail, the student is redirected
 * before the page renders.
 */
export async function loader(args: Route.LoaderArgs) {
  const clerkUserId = await requireStudent(args);

  // Look up the student's path to get their internal UUID.
  const path = await prisma.studentPath.findUnique({
    where: { clerkUserId },
    select: { studentId: true },
  });

  if (!path) {
    throw redirect("/onboarding/tier");
  }

  const { unitId } = args.params;

  // Check this unit is accessible (not locked) and that we're actually on p0.
  const progress = await prisma.studentUnitProgress.findUnique({
    where: {
      studentId_unitId: { studentId: path.studentId, unitId },
    },
    select: { status: true, currentPhase: true },
  });

  if (!progress || progress.status === "locked") {
    throw redirect("/dashboard");
  }

  // If the student is past P0, send them through the phase router to the right place.
  // (They might have bookmarked this URL or navigated back in the browser.)
  if (progress.currentPhase !== "p0") {
    throw redirect(`/unit/${unitId}`);
  }

  // Fetch just the question text — we don't need the large JSONB blobs here.
  const prepUnit = await prisma.prepUnit.findUnique({
    where: { unitId },
    select: { question: true },
  });

  if (!prepUnit) {
    // This would mean bad data — a progress row pointing to a non-existent unit.
    throw redirect("/dashboard");
  }

  return { question: prepUnit.question };
}

// ─── Action ──────────────────────────────────────────────────────────────────

/**
 * Zod schema for the P0 submit form.
 *
 * We validate the essay has at least 100 characters before accepting it.
 * This is a basic guard — not a quality check, just a minimum effort signal.
 */
const P0SubmitSchema = z.object({
  essay: z.string().min(100, "Your essay must be at least 100 characters."),
});

/**
 * Action: processes the P0 essay submission.
 *
 * If validation fails → returns error data (page re-renders with error message).
 * If validation passes → calls PhaseTransitionService.completeP0() and redirects.
 */
export async function action(args: Route.ActionArgs) {
  const clerkUserId = await requireStudent(args);

  const { unitId } = args.params;

  // Parse the form data from the POST request.
  const formData = await args.request.formData();
  const rawEssay = formData.get("essay");

  // Validate with Zod.
  const result = P0SubmitSchema.safeParse({ essay: rawEssay });

  if (!result.success) {
    // Return validation error — the component will display it inline.
    // We use `return` (not `throw`) so the page re-renders with the error.
    return {
      error: result.error.issues[0].message,
    };
  }

  // Delegate all database writes to the service (keeps the action thin).
  await PhaseTransitionService.completeP0(
    clerkUserId,
    unitId,
    result.data.essay
  );

  // Redirect through the phase router — completeP0 advanced the phase to
  // p1_pov_intro, so the router will land the student on /p1/pov-intro.
  throw redirect(`/unit/${unitId}`);
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * P0ColdEssayPage — the page the student sees when doing their cold write.
 *
 * Layout:
 *   - Question text (read-only, displayed prominently)
 *   - 40-minute countdown timer (no pause)
 *   - Textarea for essay
 *   - Submit button (always enabled)
 *   - Inline error message if essay < 100 chars
 */
export default function P0ColdEssayPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { question } = loaderData;

  // actionData is set when the action returns a validation error.
  // It's undefined on the initial page load (before any submission).
  const error = actionData?.error;

  // startedAt is recorded client-side on mount.
  // WHY hidden input instead of Date.now() in the action?
  // The action runs on the server — by the time it runs, it has no idea
  // when the student actually started writing. We capture it in the browser
  // and submit it with the form so it can be stored in StudentAttempt.startedAt.
  const [startedAt, setStartedAt] = useState<string>("");

  useEffect(() => {
    // Set startedAt once on mount — this is the moment the page first loaded.
    setStartedAt(new Date().toISOString());
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-gray-900">
            Cold Write
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Step 1 of 3</p>
            {/* CountdownTimer is a client component — counts from 40:00 to 00:00 */}
            <CountdownTimer durationMinutes={40} />
          </div>
        </div>

        {/* ── IELTS Question ──────────────────────────────────────────── */}
        {/*
          The question is shown read-only in a styled box — not in the form.
          It provides context but is not editable or submitted.
        */}
        <div className="rounded-lg border-2 border-gray-500 bg-white p-4 shadow-[3px_3px_0px_0px_rgba(17,24,39,0.5)]">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
            IELTS Task 2 Question
          </p>
          <p className="text-sm text-gray-800 leading-relaxed">{question}</p>
        </div>

        {/* ── Essay Form ──────────────────────────────────────────────── */}
        <Form method="post" className="flex flex-col gap-4">
          {/* Hidden field: captures the start time on the client side */}
          <input type="hidden" name="startedAt" value={startedAt} />

          {/* Essay textarea */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="essay"
              className="text-sm font-bold text-gray-700"
            >
              Your Essay
            </label>
            <textarea
              id="essay"
              name="essay"
              rows={20}
              placeholder="Write your IELTS Task 2 essay here..."
              className="rounded-lg border-2 border-gray-500 bg-white p-3 text-sm text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y shadow-[3px_3px_0px_0px_rgba(17,24,39,0.5)]"
            />
          </div>

          {/* Inline validation error — shown only after a failed submission */}
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {/*
            Submit button — AC-3.3 says it must remain enabled even after
            the timer expires. We never disable it.
          */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 border-2 border-gray-500 px-6 py-2 text-sm font-bold text-white shadow-[2px_2px_0px_0px_rgba(17,24,39,0.5)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              Submit Essay →
            </button>
          </div>
        </Form>

      </div>
    </div>
  );
}
