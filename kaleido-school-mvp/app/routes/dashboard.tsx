/**
 * Dashboard — Student home page (F05)
 *
 * The student's home base after onboarding. Shows:
 *   1. UnitList — all units in sequence with locked / in-progress / complete status
 *   2. QuestionBankEntry — entry point to free practice questions
 *
 * Key rules enforced here:
 *   Rule A — PrepUnit is fetched with `select` — never pulls the full practices /
 *             sentences JSONB blobs (they're large and not needed for a list view).
 *   Rule B — StudentPath is queried by clerkUserId (the Clerk string like
 *             "user_2aB3…"), NOT by studentId (the Supabase UUID).
 *   Rule C — All data merging (tierSequence + prepUnits + unitProgress) happens
 *             inside the loader using Maps. The component receives a clean
 *             pre-shaped array and just renders.
 */
import { redirect, Link } from "react-router";
import { requireStudent } from "~/lib/auth.server";
import { prisma } from "~/lib/prisma.server";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/dashboard";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Truncates a question string to the first 9 words, adding "…" if longer.
 * IELTS questions can be 40–80 words — we only want a short preview per card.
 */
function truncateQuestion(text: string): string {
  const words = text.split(" ");
  if (words.length <= 9) return text;
  return words.slice(0, 9).join(" ") + "…";
}

// ─── Loader ──────────────────────────────────────────────────────────────────

export async function loader(args: Route.LoaderArgs) {
  // requireStudent checks Clerk auth + role — redirects to /sign-in or
  // /unauthorized if the checks fail. Returns the Clerk userId string.
  const userId = await requireStudent(args);

  // Rule B: query by clerkUserId — the string Clerk gives us.
  // StudentPath.studentId is a separate Supabase UUID — do NOT use that here.
  const path = await prisma.studentPath.findUnique({
    where: { clerkUserId: userId },
    include: {
      // unitProgress gives us status (locked/in_progress/complete) per unit
      unitProgress: true,
    },
  });

  if (!path) {
    // No StudentPath = onboarding not completed — send them back to start
    throw redirect("/onboarding/tier");
  }

  // Fetch the ordered unit sequence for this student's tier + content version
  const tierSequence = await prisma.tierUnitSequence.findMany({
    where: { batchId: path.batchId, tier: path.tier },
    orderBy: { sequencePosition: "asc" },
  });

  const unitIds = tierSequence.map((seq) => seq.unitId);

  // Rule A: use `select` — we only need unitId, question, structureType.
  // Do NOT omit this select — practices and sentences are large JSONB blobs
  // that would be fetched for all 50–80 units and thrown away immediately.
  const prepUnits = await prisma.prepUnit.findMany({
    where: { unitId: { in: unitIds } },
    select: { unitId: true, question: true, structureType: true },
  });

  // Rule C: merge all three data sources here in the loader.
  // Use Maps for O(1) lookups — no nested .find() calls in the component.
  const unitMap = new Map(prepUnits.map((u) => [u.unitId, u]));
  const progressMap = new Map(path.unitProgress.map((p) => [p.unitId, p]));

  const units = tierSequence.map((seq) => ({
    unitNumber: seq.sequencePosition,
    unitId: seq.unitId,
    // questionPreview is computed once here — the component just renders the string
    questionPreview: truncateQuestion(unitMap.get(seq.unitId)!.question),
    structureType: unitMap.get(seq.unitId)!.structureType,
    // status drives all clickability + styling decisions in UnitCard
    status: progressMap.get(seq.unitId)!.status as
      | "locked"
      | "in_progress"
      | "complete",
    completedAt: progressMap.get(seq.unitId)!.completedAt,
  }));

  // completedCount drives the Question Bank lock state — computed once here
  const completedCount = units.filter((u) => u.status === "complete").length;

  // The component receives only this clean payload — no raw Prisma objects
  return { units, completedCount };
}

// ─── Types ───────────────────────────────────────────────────────────────────

// Derived from the loader return shape — keeps sub-components type-safe
type Unit = {
  unitNumber: number;
  unitId: string;
  questionPreview: string;
  structureType: string;
  status: "locked" | "in_progress" | "complete";
  completedAt: Date | null;
};

// ─── UnitCard ────────────────────────────────────────────────────────────────

/**
 * UnitCard — one card per unit in the list.
 *
 * Only "in_progress" units are clickable (AC-2.9).
 * Locked and complete cards are plain divs — no Link, no cursor pointer.
 */
function UnitCard({ unit }: { unit: Unit }) {
  // Shared base styles for all three states
  const cardBase =
    "rounded-lg border-2 p-4 flex flex-col gap-1 transition-all";

  // Inner content is the same regardless of state — only the wrapper changes
  const cardContent = (
    <>
      {/* Unit number — e.g. "Unit 1", "Unit 14" */}
      <span className="text-xs font-black uppercase tracking-widest text-gray-400">
        Unit {unit.unitNumber}
      </span>

      {/* Truncated question preview — first 9 words from the loader */}
      <p className="text-sm font-medium text-gray-800 leading-snug">
        {unit.questionPreview}
      </p>

      {/* Status label — colour-coded per state */}
      <span
        className={cn(
          "text-xs mt-1",
          unit.status === "complete" && "text-green-600",
          unit.status === "in_progress" && "text-blue-600 font-bold",
          unit.status === "locked" && "text-gray-400"
        )}
      >
        {unit.status === "complete" && "✓ Complete"}
        {unit.status === "in_progress" && "Continue →"}
        {unit.status === "locked" && "Locked"}
      </span>
    </>
  );

  // in_progress — the only state that gets a Link (AC-2.9)
  // /unit/:unitId will be implemented in F06+; clicking 404s for now (expected)
  if (unit.status === "in_progress") {
    return (
      <Link
        to={`/unit/${unit.unitId}`}
        className={cn(
          cardBase,
          "border-blue-700 bg-blue-50 cursor-pointer shadow-[3px_3px_0px_0px_rgb(29,78,216)] hover:shadow-[1px_1px_0px_0px_rgb(29,78,216)] hover:translate-x-[1px] hover:translate-y-[1px]"
        )}
      >
        {cardContent}
      </Link>
    );
  }

  if (unit.status === "complete") {
    return (
      <div
        className={cn(
          cardBase,
          "border-emerald-700 bg-emerald-50 cursor-default"
        )}
      >
        {cardContent}
      </div>
    );
  }

  // locked — greyed out, no interaction
  return (
    <div
      className={cn(
        cardBase,
        "border-gray-400 bg-gray-50 cursor-default opacity-60"
      )}
    >
      {cardContent}
    </div>
  );
}

// ─── UnitList ────────────────────────────────────────────────────────────────

/**
 * UnitList — renders all units in sequence order as a responsive grid.
 */
function UnitList({ units }: { units: Unit[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {units.map((unit) => (
        <UnitCard key={unit.unitId} unit={unit} />
      ))}
    </div>
  );
}

// ─── QuestionBankEntry ───────────────────────────────────────────────────────

/**
 * QuestionBankEntry — entry point card below the unit list.
 *
 * Locked (greyed, not clickable) until at least one unit is complete.
 * completedCount is computed in the loader — no DB query needed here.
 */
function QuestionBankEntry({ completedCount }: { completedCount: number }) {
  const isUnlocked = completedCount > 0;

  if (isUnlocked) {
    return (
      <Link
        to="/question-bank"
        className="text-sm font-semibold text-purple-700 hover:text-purple-900 transition-colors"
      >
        Question Bank →
      </Link>
    );
  }

  return (
    <p className="text-sm text-gray-400 cursor-default">
      Question Bank — unlocks after your first unit
    </p>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage({ loaderData }: Route.ComponentProps) {
  const { units, completedCount } = loaderData;

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">
            Your Learning Path
          </h1>
          <p className="text-sm text-gray-500 mt-1">{completedCount} of {units.length} units complete</p>
        </div>

        {/* Two-column layout: units left, sidebar right */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Left: Unit list */}
          <div className="flex-1 min-w-0">
            <UnitList units={units} />
          </div>

          {/* Right sidebar: guiding banner + Question Bank entry */}
          <div className="lg:w-72 shrink-0 lg:sticky lg:top-[57px] flex flex-col gap-4">
            {/* Guiding content banner */}
            <div className="rounded-lg border-2 border-dashed border-gray-400 bg-white p-4 flex flex-col gap-3">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">How prep-units work</p>
              <ol className="flex flex-col gap-2">
                <li className="flex gap-2 text-sm text-gray-700">
                  <span className="font-black text-gray-400 shrink-0">1.</span>
                  <span><span className="font-semibold text-gray-900">Answer cold</span> — write your essay before studying anything.</span>
                </li>
                <li className="flex gap-2 text-sm text-gray-700">
                  <span className="font-black text-gray-400 shrink-0">2.</span>
                  <span><span className="font-semibold text-gray-900">Study &amp; practise</span> — read the model essay and complete 10 exercises.</span>
                </li>
                <li className="flex gap-2 text-sm text-gray-700">
                  <span className="font-black text-gray-400 shrink-0">3.</span>
                  <span><span className="font-semibold text-gray-900">Answer again</span> — your teacher receives both essays to track your progress.</span>
                </li>
              </ol>
            </div>

            {/* Question Bank entry point — locked until first unit complete */}
            <QuestionBankEntry completedCount={completedCount} />
          </div>

        </div>
      </div>
    </div>
  );
}
