/**
 * unit.$unitId — Phase Router (F06)
 *
 * This route exists purely as a dispatcher. When a student clicks a unit card
 * on the dashboard (link: `/unit/:unitId`), this loader:
 *   1. Checks that the unit is not locked
 *   2. Reads the student's currentPhase for this unit
 *   3. Redirects to the correct phase sub-route via an explicit map:
 *      - p0               → /unit/:unitId/p0/intro
 *      - p1_pov_intro     → /unit/:unitId/p1/pov-intro
 *      - p1_pov_encoding  → /unit/:unitId/p1/pov-encoding
 *      - p1_essay_encoding → /unit/:unitId/p1/essay-encoding
 *      - p2               → /unit/:unitId/p2/intro
 *
 * WHY does this file exist instead of putting the logic in each phase route?
 * The dashboard links to /unit/:unitId — it doesn't know which phase the
 * student is on. This route acts as a "smart redirect" so the dashboard
 * never needs to know about phases.
 *
 * The component below returns null — the loader always fires a redirect before
 * React renders anything.
 */
import { redirect } from "react-router";
import { requireStudent } from "~/lib/auth.server";
import { prisma } from "~/lib/prisma.server";
import type { Route } from "./+types/unit.$unitId";

export async function loader(args: Route.LoaderArgs) {
  // 1. Verify the user is a logged-in student; get their Clerk ID.
  const clerkUserId = await requireStudent(args);

  // 2. Look up their StudentPath to get the internal UUID studentId.
  const path = await prisma.studentPath.findUnique({
    where: { clerkUserId },
    select: { studentId: true },
  });

  // If no path exists, onboarding was never completed — send them back.
  if (!path) {
    throw redirect("/onboarding/tier");
  }

  // 3. Get the unitId from the URL params (e.g. /unit/abc-123 → "abc-123").
  const { unitId } = args.params;

  // 4. Look up this student's progress record for this specific unit.
  const progress = await prisma.studentUnitProgress.findUnique({
    where: {
      studentId_unitId: { studentId: path.studentId, unitId },
    },
    select: { status: true, currentPhase: true },
  });

  // If no progress row or the unit is locked, send them back to the dashboard.
  // (A student should never be able to navigate to a locked unit directly,
  //  but we guard here in case they type the URL manually.)
  if (!progress || progress.status === "locked") {
    throw redirect("/dashboard");
  }

  // 5. Redirect to the correct phase sub-route via explicit map.
  // Phase names don't directly map to URL segments (e.g. p1_pov_intro ≠ /p1_pov_intro),
  // so we maintain an explicit lookup instead of string interpolation.
  const phase = progress.currentPhase ?? "p0";

  const phaseRoutes: Record<string, string> = {
    p0:                `/unit/${unitId}/p0/intro`,
    p1_pov_intro:      `/unit/${unitId}/p1/pov-intro`,
    p1_pov_encoding:   `/unit/${unitId}/p1/pov-encoding`,
    p1_essay_encoding: `/unit/${unitId}/p1/essay-encoding`,
    p2:                `/unit/${unitId}/p2/intro`,
  };

  const destination = phaseRoutes[phase] ?? `/unit/${unitId}/p0/intro`;
  throw redirect(destination);
}

// This component never renders — the loader always redirects first.
// We export it to satisfy React Router's route module requirements.
export default function UnitPhaseRouter() {
  return null;
}
