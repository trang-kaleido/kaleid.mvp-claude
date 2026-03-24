/**
 * Onboarding Screen 3 — Confirmation
 *
 * Simple confirmation page shown after path assignment completes.
 * If a student navigates here directly without a path, they're sent
 * back to screen 1 to start onboarding properly.
 */
import { redirect } from "react-router";
import { Link } from "react-router";
import { getAuth } from "@clerk/react-router/server";
import { prisma } from "~/lib/prisma.server";
import type { Route } from "./+types/onboarding.complete";

// ─── Loader ─────────────────────────────────────────────────────────────────
export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);

  if (!userId) {
    throw redirect("/sign-in");
  }

  // Make sure a StudentPath actually exists — if not, send back to start
  const path = await prisma.studentPath.findUnique({
    where: { clerkUserId: userId },
  });

  if (!path) {
    throw redirect("/onboarding/tier");
  }

  // Pass the tier label to the UI for a personalised message
  const tierLabel = path.tier === "tier_50" ? "50-unit" : "80-unit";
  return { tierLabel };
}

// ─── UI ─────────────────────────────────────────────────────────────────────
export default function OnboardingComplete() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full text-center">
        <div className="text-5xl mb-6">✓</div>
        <h1 className="text-3xl font-bold mb-4">You're all set</h1>
        <p className="text-gray-600 mb-8">
          Your learning path has been assigned. You can start your first unit
          whenever you're ready.
        </p>

        {/*
          Link (not a Form) — navigates to dashboard without any server action.
          The dashboard loader will pick up the StudentPath and show their units.
        */}
        <Link
          to="/dashboard"
          className="inline-block w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard →
        </Link>
      </div>
    </div>
  );
}
