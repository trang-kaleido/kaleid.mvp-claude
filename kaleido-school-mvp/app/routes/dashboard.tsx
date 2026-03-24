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
  const tierLabel = path.tier === "tier_50" ? "50-Unit Path" : "80-Unit Path";

  // The component receives only this clean payload — no raw Prisma objects
  return { tierLabel, units, completedCount };
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
    "rounded-lg border p-4 flex flex-col gap-1 transition-colors";

  // Inner content is the same regardless of state — only the wrapper changes
  const cardContent = (
    <>
      {/* Unit number — e.g. "Unit 1", "Unit 14" */}
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
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
          unit.status === "in_progress" && "text-blue-600 font-semibold",
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
          "border-blue-300 bg-blue-50 hover:bg-blue-100 cursor-pointer"
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
          "border-green-200 bg-green-50 cursor-default"
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
        "border-gray-200 bg-gray-50 cursor-default opacity-60"
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
    <div className="grid gap-3 sm:grid-cols-2">
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
        className="mt-6 block rounded-lg border border-purple-300 bg-purple-50 p-4 hover:bg-purple-100 transition-colors"
      >
        <p className="text-sm font-semibold text-purple-700">
          Question Bank →
        </p>
        <p className="text-xs text-purple-500 mt-1">
          Free practice on unlocked IELTS questions
        </p>
      </Link>
    );
  }

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 opacity-60 cursor-default">
      <p className="text-sm font-semibold text-gray-500">Question Bank</p>
      <p className="text-xs text-gray-400 mt-1">
        Unlocks after your first unit is complete
      </p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage({ loaderData }: Route.ComponentProps) {
  const { tierLabel, units, completedCount } = loaderData;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Your Learning Path
          </h1>
          <p className="text-sm text-gray-500 mt-1">{tierLabel}</p>
        </div>

        {/* Unit list — all units in sequence order */}
        <UnitList units={units} />

        {/* Question Bank entry point — locked until first unit complete */}
        <QuestionBankEntry completedCount={completedCount} />
      </div>
    </div>
  );
}
