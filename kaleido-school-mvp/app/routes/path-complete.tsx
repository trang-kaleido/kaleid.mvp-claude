/**
 * path-complete — Path Completion Screen (F12)
 *
 * Shown when a student finishes the LAST unit in their tier.
 * At this point: StudentPath.currentSequencePosition === null
 * (set by PhaseTransitionService.completeP2() when there is no next unit).
 *
 * This is a static screen — no dynamic data is needed beyond the safety check.
 * The student can navigate to the Question Bank for free practice from here.
 *
 * Acceptance criteria covered: AC-4.5, AC-4.6, AC-4.7
 */
import { redirect, Link } from "react-router";
import { requireStudent } from "~/lib/auth.server";
import { prisma } from "~/lib/prisma.server";
import type { Route } from "./+types/path-complete";

// ─── Loader ───────────────────────────────────────────────────────────────────

/**
 * Loader: verifies the student is legitimately at this screen.
 *
 * Guard order:
 *   1. requireStudent → redirect /sign-in if not authenticated
 *   2. StudentPath must exist → redirect /onboarding/tier
 *   3. currentSequencePosition must be null → redirect /dashboard if not
 *      (prevents a student from bookmarking this URL and visiting it mid-path)
 *
 * If all checks pass, return {} — the component is purely static.
 */
export async function loader(args: Route.LoaderArgs) {
  // Step 1: authenticate.
  const clerkUserId = await requireStudent(args);

  // Step 2: load the student's path — we only need currentSequencePosition.
  const path = await prisma.studentPath.findUnique({
    where: { clerkUserId },
    select: { currentSequencePosition: true },
  });

  if (!path) {
    // No StudentPath = onboarding not complete.
    throw redirect("/onboarding/tier");
  }

  // Step 3: safety guard — if the student still has units to do, send them to
  // the dashboard. This handles the case where someone navigates to /path-complete
  // via browser history or a bookmarked URL before they're actually done.
  if (path.currentSequencePosition !== null) {
    throw redirect("/dashboard");
  }

  // The student is legitimately done — return empty data (static screen).
  return {};
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * PathCompletePage — celebrates finishing the entire tier.
 *
 * Layout:
 *   ┌─ Header ──────────────────────────────────────────────────────────┐
 *   │  🎓 Path Complete!                                                │
 *   └───────────────────────────────────────────────────────────────────┘
 *   ┌─ Message ─────────────────────────────────────────────────────────┐
 *   │  "You've completed all units…"                                    │
 *   └───────────────────────────────────────────────────────────────────┘
 *   ┌─ Actions ─────────────────────────────────────────────────────────┐
 *   │  [Go to Question Bank]    [Back to Dashboard]                     │
 *   └───────────────────────────────────────────────────────────────────┘
 */
export default function PathCompletePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        {/*
          Graduation cap emoji gives a strong visual signal that the
          entire path (not just one unit) is done.
        */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
          <p className="text-5xl mb-3">🎓</p>
          <h1 className="text-2xl font-bold text-green-800">
            Path Complete!
          </h1>
        </div>

        {/* ── Message ─────────────────────────────────────────────────── */}
        {/*
          Explains what's still available — the Question Bank.
          Keeps the student from feeling like they've "hit a wall".
        */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-700 leading-relaxed">
            You've completed all units in your tier. The Question Bank remains
            open for free practice whenever you'd like.
          </p>
        </div>

        {/* ── Action Buttons ───────────────────────────────────────────── */}
        {/*
          Same two-button layout as unit-complete, for visual consistency.
          "Go to Question Bank" will 404 until F14 is built — that's expected.
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
            Back to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
