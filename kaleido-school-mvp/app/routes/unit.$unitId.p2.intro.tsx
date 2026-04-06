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
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">

        {/* ── Step indicator ──────────────────────────────────────────── */}
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">
          Step 3 of 3
        </p>

        {/* ── Guiding content ─────────────────────────────────────────── */}
        <div className="rounded-lg border-2 border-gray-500 bg-white p-5 shadow-[3px_3px_0px_0px_rgba(17,24,39,0.5)]">
          <p className="text-sm text-gray-700 leading-relaxed">
            You&apos;ve understood the PoVs and the essay structure. Now try to answer
            the question again.
          </p>
        </div>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <div className="flex justify-end">
          <Link
            to={`/unit/${unitId}/p2`}
            className="rounded-lg bg-blue-600 border-2 border-gray-500 px-6 py-2 text-sm font-bold text-white shadow-[2px_2px_0px_0px_rgba(17,24,39,0.5)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            Start Writing →
          </Link>
        </div>

      </div>
    </div>
  );
}
