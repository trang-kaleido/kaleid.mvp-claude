/**
 * unit.$unitId.p1.pov-intro — PoV Introduction Screen (F16)
 *
 * Renders the POV_INTRO practice (practices[1]).
 * Shows one PoV card per direction: argument as heading, logic as body,
 * "Dive deep" button linked to blog_url (disabled when null).
 *
 * No questions, no timer, no Peek. CTA advances phase to p1_pov_encoding.
 * No StudentAttempt rows written — POV_INTRO has no pass tracking.
 */
import { redirect, Form } from "react-router";
import { requireStudent } from "~/lib/auth.server";
import { prisma } from "~/lib/prisma.server";
import { PhaseTransitionService } from "~/services/phase-transition.server";
import { safeParseJson } from "~/lib/json.server";
import type { Route } from "./+types/unit.$unitId.p1.pov-intro";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PovDirection {
  direction_tag: string;
  argument: string;
  logic: string;
  blog_url: string | null;
}

interface PovIntroPractice {
  practice_code: "POV_INTRO";
  directions: PovDirection[];
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

  if (progress.currentPhase !== "p1_pov_intro") {
    throw redirect(`/unit/${unitId}`);
  }

  const prepUnit = await prisma.prepUnit.findUnique({
    where: { unitId },
    select: { practices: true },
  });

  if (!prepUnit) {
    throw redirect("/dashboard");
  }

  const practices = safeParseJson<Practice[]>(prepUnit.practices);
  const povIntro = practices[1] as unknown as PovIntroPractice;

  return { unitId, povIntro };
}

// ─── Action ───────────────────────────────────────────────────────────────────

export async function action(args: Route.ActionArgs) {
  const clerkUserId = await requireStudent(args);
  const { unitId } = args.params;

  const formData = await args.request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "complete_pov_intro") {
    await PhaseTransitionService.completePovIntro(clerkUserId, unitId);
    throw redirect(`/unit/${unitId}/p1/pov-encoding`);
  }

  return { ok: false, error: `Unknown intent: ${intent}` };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PovIntroPage({ loaderData }: Route.ComponentProps) {
  const { unitId, povIntro } = loaderData;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <h1 className="text-xl font-bold text-gray-900">PoV Introduction</h1>

        {/* ── Guiding content ─────────────────────────────────────────── */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 flex flex-col gap-2">
          <p className="text-sm text-gray-700 leading-relaxed">
            PoVs are &quot;Point of View&quot;. There are many of them but we select the most
            reusable one for you. Try to understand the logic of the PoV itself as a
            critical way to think via the <span className="font-medium">Dive deep</span> button.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            Spend as long as you need to really understand it then move to answer questions.
          </p>
        </div>

        {/* ── PoV Cards ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {povIntro.directions.map((direction) => (
            <div
              key={direction.direction_tag}
              className="rounded-lg border border-gray-200 bg-white p-5 flex flex-col gap-3"
            >
              {/* Argument as heading + Dive Deep button */}
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-sm font-semibold text-gray-900 leading-snug">
                  {direction.argument}
                </h2>

                {direction.blog_url ? (
                  <a
                    href={direction.blog_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                  >
                    Dive deep →
                  </a>
                ) : (
                  <button
                    disabled
                    className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-400 cursor-not-allowed"
                  >
                    Dive deep →
                  </button>
                )}
              </div>

              {/* Logic as body */}
              <p className="text-sm text-gray-600 leading-relaxed">{direction.logic}</p>
            </div>
          ))}
        </div>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <Form method="post" className="flex justify-end">
          <input type="hidden" name="intent" value="complete_pov_intro" />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            I have understood these PoVs — ready to study the essay →
          </button>
        </Form>

      </div>
    </div>
  );
}
