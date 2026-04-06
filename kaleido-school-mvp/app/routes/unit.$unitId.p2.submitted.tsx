/**
 * unit.$unitId.p2.submitted — P2 Submission Confirmation Screen (F11)
 *
 * Shown immediately after the student submits their P2 essay, before
 * redirecting to the unit-complete screen. Confirms the essay was sent
 * to the teacher and gives the student a moment before continuing.
 *
 * Flow: P2 write submit → this screen → /unit-complete/:unitId
 */
import { Link } from "react-router";
import { requireStudent } from "~/lib/auth.server";
import type { Route } from "./+types/unit.$unitId.p2.submitted";

export async function loader(args: Route.LoaderArgs) {
  await requireStudent(args);
  return { unitId: args.params.unitId };
}

export default function P2SubmittedPage({ loaderData }: Route.ComponentProps) {
  const { unitId } = loaderData;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full flex flex-col items-center gap-6 text-center">

        {/* ── Icon ────────────────────────────────────────────────────── */}
        <div className="rounded-full bg-green-100 p-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* ── Heading ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Essay Submitted</h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Your essay has been sent to your teacher for review. They will be
            able to see both your cold essay from the start of this unit and
            this final essay side by side.
          </p>
        </div>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <Link
          to={`/unit-complete/${unitId}`}
          className="rounded-lg bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Continue →
        </Link>

      </div>
    </div>
  );
}
