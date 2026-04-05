/**
 * unit.$unitId.p2.intro — P2 Entry Screen (F11)
 *
 * Shown before the applying write. Displays guiding content and a Start button.
 * No phase change — just navigates to /unit/:unitId/p2.
 *
 * Guard: if currentPhase !== "p2", redirect through phase router.
 */
import { redirect, Link } from "react-router";
import { requireStudent } from "~/lib/auth.server";
import { prisma } from "~/lib/prisma.server";
import type { Route } from "./+types/unit.$unitId.p2.intro";

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

  if (progress.currentPhase !== "p2") {
    throw redirect(`/unit/${unitId}`);
  }

  return { unitId };
}

export default function P2IntroPage({ loaderData }: Route.ComponentProps) {
  const { unitId } = loaderData;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* ── Step indicator ──────────────────────────────────────────── */}
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Step 3 of 3
        </p>

        {/* ── Guiding content ─────────────────────────────────────────── */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 flex flex-col gap-2">
          <p className="text-sm text-gray-700 leading-relaxed">
            These questions are to help you deepen your understanding, not to earn a score.
            Use it as a tool, not a test.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            Record on your effort will be sent for teacher to review.
          </p>
        </div>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <div className="flex justify-end">
          <Link
            to={`/unit/${unitId}/p2`}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Start Writing →
          </Link>
        </div>

      </div>
    </div>
  );
}
