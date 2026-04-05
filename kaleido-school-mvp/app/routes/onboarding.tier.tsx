/**
 * Onboarding Screen 1 — Tier Selection
 *
 * The student chooses between a 50-unit or 80-unit learning path.
 *
 * On submit → redirect to /onboarding/teacher-code?tier=<tier>
 * The tier travels as a URL parameter so screen 2 can read it.
 *
 * Auth note: We use getAuth() here instead of requireStudent() because
 * a brand new user has no Clerk role set yet. requireStudent() would
 * redirect them to /unauthorized before they could complete onboarding.
 */
import { redirect } from "react-router";
import { Form, useActionData } from "react-router";
import { getAuth } from "@clerk/react-router/server";
import { z } from "zod";
import { prisma } from "~/lib/prisma.server";
import type { Route } from "./+types/onboarding.tier";

// ─── Validation ────────────────────────────────────────────────────────────────
// Zod checks that the submitted tier value is exactly one of the two valid strings.
// Note: Zod v4 uses { error: "..." } not { errorMap: ... }
const TierSchema = z.object({
  tier: z.enum(["tier_50", "tier_80"], {
    error: "Please select a learning path to continue.",
  }),
});

// ─── Loader ────────────────────────────────────────────────────────────────────
// Runs on every GET request to this page (when the browser navigates here).
// Two checks: (1) must be logged in, (2) must not already have a path.
export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);

  // Not logged in → send to sign-in
  if (!userId) {
    throw redirect("/sign-in");
  }

  // Duplicate guard: if this student already completed onboarding, skip it.
  // StudentPath stores clerkUserId, so we look up by that.
  const existingPath = await prisma.studentPath.findUnique({
    where: { clerkUserId: userId },
  });

  if (existingPath) {
    throw redirect("/dashboard");
  }

  return null;
}

// ─── Action ────────────────────────────────────────────────────────────────────
// Runs when the form is submitted (POST request).
export async function action(args: Route.ActionArgs) {
  const { userId } = await getAuth(args);

  if (!userId) {
    throw redirect("/sign-in");
  }

  // Read the form data — `tier` is the name of the radio input
  const formData = await args.request.formData();

  // Validate using Zod — safeParse returns success/error instead of throwing
  const result = TierSchema.safeParse({ tier: formData.get("tier") });

  if (!result.success) {
    // Return the error message back to the page (useActionData reads this)
    // Zod v4: error details are in .issues[] not .errors[]
    return { error: result.error.issues[0].message };
  }

  // Pass tier to screen 2 via URL parameter — simple and no cookie needed
  throw redirect(`/onboarding/teacher-code?tier=${result.data.tier}`);
}

// ─── UI ────────────────────────────────────────────────────────────────────────
export default function OnboardingTier() {
  // actionData is whatever the action() returned (our error object, if any)
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center mb-2">
          Choose your learning path
        </h1>

        {/* Guiding content */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 mb-6 flex flex-col gap-2">
          <p className="text-sm text-gray-700 leading-relaxed">
            In this pilot product, we offer you two options:
          </p>
          <ul className="flex flex-col gap-1.5 pl-3">
            <li className="text-sm text-gray-700 leading-relaxed">
              — <span className="font-medium">Option A:</span> Study 11 prep units, each ~1 hour,
              to be ready for 50% of IELTS questions. Choose this if you have 4 weeks × 4 hours/week.
            </li>
            <li className="text-sm text-gray-700 leading-relaxed">
              — <span className="font-medium">Option B:</span> Study 25 prep units, each ~1 hour,
              to be ready for 80% of IELTS questions. Choose this if you have 10 weeks × 4 hours/week.
            </li>
          </ul>
        </div>

        {/* Form method="post" sends data to our action() above */}
        <Form method="post">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

            {/* 50-unit option — radio input hidden, the label acts as the click target */}
            <label className="cursor-pointer">
              <input
                type="radio"
                name="tier"
                value="tier_50"
                className="sr-only peer" // sr-only = visually hidden but accessible
              />
              <div className="border-2 border-gray-200 rounded-xl p-6 peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:border-gray-300 transition-colors">
                <div className="text-2xl font-bold mb-2">Option A — 11 Units</div>
                <div className="text-gray-600 text-sm">
                  ~4 weeks × 4 hours/week. Ready for 50% of IELTS questions.
                </div>
              </div>
            </label>

            {/* 80-unit option */}
            <label className="cursor-pointer">
              <input
                type="radio"
                name="tier"
                value="tier_80"
                className="sr-only peer"
              />
              <div className="border-2 border-gray-200 rounded-xl p-6 peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:border-gray-300 transition-colors">
                <div className="text-2xl font-bold mb-2">Option B — 25 Units</div>
                <div className="text-gray-600 text-sm">
                  ~10 weeks × 4 hours/week. Ready for 80% of IELTS questions.
                </div>
              </div>
            </label>
          </div>

          {/* Show validation error if nothing was selected */}
          {actionData?.error && (
            <p className="text-red-500 text-sm mb-4 text-center">
              {actionData.error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Continue →
          </button>
        </Form>
      </div>
    </div>
  );
}
