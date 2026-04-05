/**
 * Onboarding Screen 0 — Intro
 *
 * First screen shown after sign-up, before tier selection.
 * Explains the Kaleido methodology and what the product does.
 *
 * No form / no action — student reads and clicks "Get started →" to proceed.
 *
 * Guard: if StudentPath already exists (student already onboarded), redirect
 * to /dashboard. This prevents re-viewing the intro on subsequent sign-ins.
 */
import { redirect, Link } from "react-router";
import { getAuth } from "@clerk/react-router/server";
import { prisma } from "~/lib/prisma.server";
import type { Route } from "./+types/onboarding.intro";

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);

  if (!userId) {
    throw redirect("/sign-in");
  }

  const existingPath = await prisma.studentPath.findUnique({
    where: { clerkUserId: userId },
  });

  if (existingPath) {
    throw redirect("/dashboard");
  }

  return null;
}

export default function OnboardingIntro() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">

        {/* ── Brand ───────────────────────────────────────────────────── */}
        <h1 className="text-3xl font-bold text-gray-900">kaleido</h1>

        {/* ── Concept ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-700 leading-relaxed">
            kaleido is a work inspired by a toy called kaleidoscope
          </p>
          <ul className="flex flex-col gap-2 pl-4">
            <li className="text-sm text-gray-700 leading-relaxed">
              — kaleidoscope allows a child to create infinite complex images using a small set of lenses of colors
            </li>
            <li className="text-sm text-gray-700 leading-relaxed">
              — kaleido allows a test taker to tackle a test that covers all topics in life via a small set of lenses of structure
            </li>
          </ul>
        </div>

        {/* ── What we do ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-gray-900">What we do?</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            We help you be ready for the test in weeks, not in months.
          </p>
        </div>

        {/* ── How we do it ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-gray-900">How we do it — differently?</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Traditionally, when you study for IELTS, you have to learn seemingly endless topics
            and subjects. We understand that you have very little time. Therefore, our solution
            is never simply &apos;study more to be more ready&apos;. Our solution allows you to study less
            to be more ready.
          </p>
        </div>

        {/* ── Starting point ──────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-gray-900">Starting with IELTS Writing Task 2</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            We choose to help you with Writing Task 2 because its questions can be very
            unpredictable.
          </p>
        </div>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <Link
          to="/onboarding/tier"
          className="self-start rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Get started →
        </Link>

      </div>
    </div>
  );
}
