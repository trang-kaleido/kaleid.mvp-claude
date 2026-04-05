/**
 * unit.$unitId.p0.intro — P0 Entry Screen (F06)
 *
 * Shown before the cold write. Displays guiding content + the IELTS question
 * so the student knows what they're about to write, then a CTA to start.
 *
 * No form / no action — just navigation. No phase change.
 *
 * Guard: if currentPhase !== "p0", redirect through phase router (student
 * already past this screen — prevent going back to the intro mid-unit).
 */
import { redirect, Link } from "react-router";
import { requireStudent } from "~/lib/auth.server";
import { prisma } from "~/lib/prisma.server";
import type { Route } from "./+types/unit.$unitId.p0.intro";

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

  // If already past P0, send through phase router to the right place.
  if (progress.currentPhase !== "p0") {
    throw redirect(`/unit/${unitId}`);
  }

  const prepUnit = await prisma.prepUnit.findUnique({
    where: { unitId },
    select: { question: true },
  });

  if (!prepUnit) {
    throw redirect("/dashboard");
  }

  return { unitId, question: prepUnit.question };
}

export default function P0IntroPage({ loaderData }: Route.ComponentProps) {
  const { unitId, question } = loaderData;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* ── Step indicator ──────────────────────────────────────────── */}
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Step 1 of 3
        </p>

        {/* ── Guiding content ─────────────────────────────────────────── */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 flex flex-col gap-2">
          <p className="text-sm text-gray-700 leading-relaxed">
            Try to answer the question with your own original thinking.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            Your essay will be sent to your teacher to review but there will be no
            scoring so try your best with what you already have.
          </p>
        </div>

        {/* ── IELTS Question preview ───────────────────────────────────── */}
        <div className="rounded-lg border border-gray-300 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            IELTS Task 2 Question
          </p>
          <p className="text-sm text-gray-800 leading-relaxed">{question}</p>
        </div>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <div className="flex justify-end">
          <Link
            to={`/unit/${unitId}/p0`}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Start Cold Write →
          </Link>
        </div>

      </div>
    </div>
  );
}
