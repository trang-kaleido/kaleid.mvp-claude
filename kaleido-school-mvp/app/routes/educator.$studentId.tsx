/**
 * educator.$studentId — Educator Console: Student Detail View (F15)
 *
 * Shows a single student's full learning record:
 *   - Header: email, tier, total practice time
 *   - Per-unit sections (collapsible with native <details>):
 *     - Status badge (complete / in_progress / locked)
 *     - Essays: P0 cold write (artifact_1) and P2 L4W write (artifact_2) side-by-side
 *     - Practice signals: time, pass/fail counts, forced-advance warning
 *   - Free Practice section: QB essays submitted outside unit flow
 *
 * Security: teacher can only view students enrolled with their own teacher code.
 * Navigating to another teacher's student redirects to /educator/students. (AC-5.2)
 *
 * Acceptance criteria covered: AC-5.2, AC-5.4–AC-5.14
 */
import { redirect, Link } from "react-router";
import { clerkClient } from "@clerk/react-router/server";
import { requireTeacher } from "~/lib/auth.server";
import { prisma } from "~/lib/prisma.server";
import type { Route } from "./+types/educator.$studentId";

// ─── Loader ──────────────────────────────────────────────────────────────────

export async function loader(args: Route.LoaderArgs) {
  // ── Step 1: Authenticate as teacher ─────────────────────────────────────
  const teacherClerkUserId = await requireTeacher(args);

  // ── Step 2: Get teacher's code (needed for ownership check) ─────────────
  const teacher = await prisma.teacher.findUnique({
    where: { clerkUserId: teacherClerkUserId },
    select: { teacherCode: true },
  });

  if (!teacher) {
    // Teacher not provisioned in DB — send them back to the list.
    throw redirect("/educator/students");
  }

  // ── Step 3: Load the student's path record ───────────────────────────────
  const { studentId } = args.params;

  const student = await prisma.studentPath.findUnique({
    where: { studentId },
    select: {
      studentId: true,
      clerkUserId: true,
      tier: true,
      batchId: true,
      currentSequencePosition: true,
      teacherCode: true,
    },
  });

  // If the student doesn't exist, or belongs to a different teacher → redirect.
  // This prevents teachers from viewing each other's students. (AC-5.2)
  if (!student || student.teacherCode !== teacher.teacherCode) {
    throw redirect("/educator/students");
  }

  // ── Step 4: Parallel fetches (independent of each other) ────────────────
  //
  // We use Promise.all so all four queries run at the same time instead of
  // one after another — this is significantly faster.
  const [tierSeq, progressRows, allAttempts, studentClerkUser] =
    await Promise.all([
      // 4a: The ordered list of unit IDs for this student's tier + batch.
      //     This tells us the sequence positions (1, 2, 3...) and which unitId is at each.
      prisma.tierUnitSequence.findMany({
        where: { batchId: student.batchId, tier: student.tier },
        orderBy: { sequencePosition: "asc" },
        select: { sequencePosition: true, unitId: true },
      }),

      // 4b: Per-unit progress status (locked / in_progress / complete) + current phase.
      prisma.studentUnitProgress.findMany({
        where: { studentId: student.studentId },
        select: { unitId: true, status: true, currentPhase: true },
      }),

      // 4c: Every attempt this student has ever made, sorted oldest → newest.
      //     This includes: MCQ answers, fill-in, scramble, P0 essays, P2 essays, QB essays.
      prisma.studentAttempt.findMany({
        where: { studentId: student.studentId },
        orderBy: { startedAt: "asc" },
        select: {
          id: true,
          unitId: true,
          qbankQuestionId: true,
          practiceCode: true,
          pass: true,
          failedAdvanced: true,
          startedAt: true,
          completedAt: true,
          artifactType: true,
          artifactContent: true,
        },
      }),

      // 4d: Clerk user record — needed to display the student's email address.
      clerkClient(args).users.getUser(student.clerkUserId),
    ]);

  // ── Step 5: Second round of fetches (depend on Step 4 results) ──────────

  // 5a: Get question text for each unit in this student's sequence.
  const unitIds = tierSeq.map((s) => s.unitId);

  // 5b: Collect QB question IDs from free_practice attempts (if any).
  //     We need these to look up question text for the Free Practice section.
  const qbankIds = [
    ...new Set(
      allAttempts
        .filter(
          (a) => a.artifactType === "free_practice" && a.qbankQuestionId != null
        )
        .map((a) => a.qbankQuestionId!)
    ),
  ];

  // Run both fetches in parallel.
  const [prepUnits, qbankRows] = await Promise.all([
    unitIds.length > 0
      ? prisma.prepUnit.findMany({
          where: { unitId: { in: unitIds } },
          select: { unitId: true, question: true },
        })
      : Promise.resolve([]),

    qbankIds.length > 0
      ? prisma.qBankUnlocks.findMany({
          where: { questionId: { in: qbankIds } },
          select: { questionId: true, questionText: true },
        })
      : Promise.resolve([]),
  ]);

  // ── Step 6: Build lookup maps ────────────────────────────────────────────
  //
  // Maps let us look up related data in O(1) instead of scanning arrays each time.
  const prepUnitMap = new Map(prepUnits.map((u) => [u.unitId, u.question]));
  const progressMap = new Map(progressRows.map((p) => [p.unitId, p.status]));
  const qbankMap = new Map(qbankRows.map((q) => [q.questionId, q.questionText]));

  // ── Step 7: Compute total practice time ──────────────────────────────────
  //
  // Sum the duration of every attempt (completedAt - startedAt) in milliseconds,
  // then convert to hours and minutes for display. (AC-5.10)
  const totalMs = allAttempts.reduce(
    (sum, a) =>
      sum + (a.completedAt.getTime() - a.startedAt.getTime()),
    0
  );
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const totalTime = `${hours}h ${minutes}m`;

  // ── Step 8: Group attempts by unit ──────────────────────────────────────
  //
  // Build a map from unitId → all attempts for that unit.
  // We'll use this when shaping per-unit data below.
  const unitAttemptsMap = new Map<
    string,
    Array<(typeof allAttempts)[number]>
  >();
  for (const attempt of allAttempts) {
    if (!attempt.unitId) continue; // QB attempts have no unitId — skip here
    if (!unitAttemptsMap.has(attempt.unitId)) {
      unitAttemptsMap.set(attempt.unitId, []);
    }
    unitAttemptsMap.get(attempt.unitId)!.push(attempt);
  }

  // ── Step 9: Shape per-unit data ──────────────────────────────────────────
  //
  // For each unit in the sequence, we build a combined object with:
  //   - position, question text, status
  //   - artifact1 (P0 cold write), artifact2 (P2 L4W write)
  //   - signals (one entry per practice code, aggregated)
  const units = tierSeq.map((seq) => {
    const unitAttempts = unitAttemptsMap.get(seq.unitId) ?? [];

    // Essay artifacts: one attempt with the matching artifactType per unit.
    const artifact1Attempt = unitAttempts.find(
      (a) => a.artifactType === "artifact_1"
    );
    const artifact2Attempt = unitAttempts.find(
      (a) => a.artifactType === "artifact_2"
    );

    // Practice signals: all non-essay, non-QB attempts grouped by practiceCode.
    // practiceCode is something like "L4M", "L1S", "L2_fill", etc.
    // We aggregate pass count, fail count, and time per code. (AC-5.9, AC-5.11, AC-5.12)
    const practiceAttempts = unitAttempts.filter(
      (a) => a.artifactType == null // Regular practice items have no artifactType
    );

    // Group practice attempts by practiceCode.
    const practiceGroupMap = new Map<
      string,
      Array<(typeof allAttempts)[number]>
    >();
    for (const attempt of practiceAttempts) {
      if (!practiceGroupMap.has(attempt.practiceCode)) {
        practiceGroupMap.set(attempt.practiceCode, []);
      }
      practiceGroupMap.get(attempt.practiceCode)!.push(attempt);
    }

    // For each practice code, compute aggregated stats.
    const signals = [...practiceGroupMap.entries()].map(
      ([practiceCode, attempts]) => {
        const timeMs = attempts.reduce(
          (sum, a) =>
            sum + (a.completedAt.getTime() - a.startedAt.getTime()),
          0
        );
        // Convert to seconds for display (e.g. "2m 30s")
        const timeSeconds = Math.round(timeMs / 1000);
        const passCount = attempts.filter((a) => a.pass === true).length;
        const failCount = attempts.filter((a) => a.pass === false).length;
        // failedAdvanced = true means the student hit the retry limit and was
        // forced forward to the next item (AC-5.11)
        const failedAdvanced = attempts.some((a) => a.failedAdvanced === true);

        return { practiceCode, timeSeconds, passCount, failCount, failedAdvanced };
      }
    );

    return {
      sequencePosition: seq.sequencePosition,
      unitId: seq.unitId,
      question: prepUnitMap.get(seq.unitId) ?? "",
      status: progressMap.get(seq.unitId) ?? "locked",
      artifact1: artifact1Attempt
        ? {
            content: artifact1Attempt.artifactContent ?? "",
            submittedAt: artifact1Attempt.completedAt.toISOString(),
          }
        : null,
      artifact2: artifact2Attempt
        ? {
            content: artifact2Attempt.artifactContent ?? "",
            submittedAt: artifact2Attempt.completedAt.toISOString(),
          }
        : null,
      signals,
    };
  });

  // ── Step 10: Shape free practice essays ─────────────────────────────────
  //
  // Free Practice essays are QB attempts — artifactType === "free_practice".
  // We number them 1, 2, 3... in chronological order (allAttempts is already sorted asc).
  // (AC-5.8)
  const freePractice = allAttempts
    .filter((a) => a.artifactType === "free_practice")
    .map((a, i) => ({
      number: i + 1,
      questionText: a.qbankQuestionId
        ? (qbankMap.get(a.qbankQuestionId) ?? "")
        : "",
      content: a.artifactContent ?? "",
      submittedAt: a.completedAt.toISOString(),
    }));

  // ── Step 11: Resolve student email and display name ─────────────────────
  const email =
    studentClerkUser.emailAddresses.find(
      (e) => e.id === studentClerkUser.primaryEmailAddressId
    )?.emailAddress ??
    studentClerkUser.emailAddresses[0]?.emailAddress ??
    studentClerkUser.id; // Fallback: just show the Clerk ID if no email found

  // Build a display name from firstName + lastName.
  // filter(Boolean) drops null/undefined/empty string before joining.
  // If the student signed up without a name, we fall back to email.
  const name =
    [studentClerkUser.firstName, studentClerkUser.lastName]
      .filter(Boolean)
      .join(" ") || email;

  const tierLabel = student.tier === "tier_50" ? "Tier 50" : "Tier 80";

  return {
    student: { studentId: student.studentId, email, name, tierLabel, totalTime },
    units,
    freePractice,
  };
}

// ─── Types ───────────────────────────────────────────────────────────────────

// One practice signal row (per practiceCode, per unit)
type Signal = {
  practiceCode: string;
  timeSeconds: number;
  passCount: number;
  failCount: number;
  failedAdvanced: boolean;
};

// One essay artifact (P0 or P2)
type Artifact = {
  content: string;
  submittedAt: string;
} | null;

// One unit row (all data needed to render a <details> block)
type UnitRow = {
  sequencePosition: number;
  unitId: string;
  question: string;
  status: string;
  artifact1: Artifact;
  artifact2: Artifact;
  signals: Signal[];
};

// One free practice essay
type FreePracticeRow = {
  number: number;
  questionText: string;
  content: string;
  submittedAt: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * formatSeconds — converts a total-seconds number to "Xm Ys" string.
 * Example: 150 → "2m 30s", 45 → "45s"
 */
function formatSeconds(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/**
 * formatDate — converts an ISO string to "YYYY-MM-DD" for display.
 * Keeps it short and scannable in the UI.
 */
function formatDate(isoString: string): string {
  return isoString.slice(0, 10);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function EducatorStudentDetailPage({
  loaderData,
}: Route.ComponentProps) {
  const { student, units, freePractice } = loaderData;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">

        {/* ── Back link + Header ─────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <Link
            to="/educator/students"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to Students
          </Link>

          {/* Student summary: name, email, tier, total time */}
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              {student.name}
            </h1>
            {/* Email shown smaller below the name */}
            <span className="text-sm text-gray-400">{student.email}</span>
            <span className="text-sm text-gray-500">{student.tierLabel}</span>
            <span className="text-sm text-gray-400">·</span>
            <span className="text-sm text-gray-500">
              Total practice time: {student.totalTime}
            </span>
          </div>
        </div>

        {/* ── Units ─────────────────────────────────────────────────── */}
        {/*
          Each unit is a native <details> element — no useState needed.
          The browser handles open/close natively, keeping this component simple.
        */}
        <div className="flex flex-col gap-3">
          {units.map((unit) => (
            <UnitSection key={unit.unitId} unit={unit} />
          ))}
        </div>

        {/* ── Free Practice Essays ───────────────────────────────────── */}
        {freePractice.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-gray-700">
              Free Practice Essays
            </h2>
            {freePractice.map((fp) => (
              <FreePracticeCard key={fp.number} fp={fp} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// ─── UnitSection ─────────────────────────────────────────────────────────────

/**
 * UnitSection — one collapsible unit block using native <details>/<summary>.
 *
 * States:
 *   complete    → shows both artifacts (P0 + P2) side-by-side, plus all signals
 *   in_progress → shows artifact1 (P0) only, plus any signals so far
 *   locked      → shows grey status, no content (collapsed only)
 */
function UnitSection({ unit }: { unit: UnitRow }) {
  const isLocked = unit.status === "locked";
  const isComplete = unit.status === "complete";

  // Truncate long questions to keep the summary scannable
  const shortQuestion =
    unit.question.length > 80
      ? unit.question.slice(0, 80) + "…"
      : unit.question;

  // Status badge: different colour per state
  const statusBadge = isComplete
    ? "text-xs font-semibold text-green-600 uppercase tracking-wide"
    : unit.status === "in_progress"
    ? "text-xs font-semibold text-blue-600 uppercase tracking-wide"
    : "text-xs font-semibold text-gray-400 uppercase tracking-wide";

  const statusLabel = isComplete
    ? "Complete"
    : unit.status === "in_progress"
    ? "In Progress"
    : "Locked";

  return (
    <details
      className={`rounded-lg border bg-white overflow-hidden ${
        isLocked ? "border-gray-200 opacity-60" : "border-gray-200"
      }`}
    >
      {/*
        <summary> is the always-visible clickable header.
        The browser adds a default disclosure triangle — no JS needed.
      */}
      <summary className="flex items-start gap-3 p-4 cursor-pointer select-none list-none hover:bg-gray-50 transition-colors">
        {/* Hide default browser marker and use our own layout */}
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">
              Unit {unit.sequencePosition}
            </span>
            <span className={statusBadge}>{statusLabel}</span>
          </div>
          {unit.question && (
            <p className="text-sm text-gray-500 leading-snug">{shortQuestion}</p>
          )}
        </div>
      </summary>

      {/* ── Expanded content — only shown for non-locked units ──── */}
      {!isLocked && (
        <div className="border-t border-gray-100 p-4 flex flex-col gap-5">

          {/* ── Essays ──────────────────────────────────────────── */}
          {(unit.artifact1 || unit.artifact2) && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Essays
              </h3>
              {/*
                Side-by-side grid: P0 cold write on the left,
                P2 L4W write on the right. On narrow screens they stack.
                Using CSS grid with 2 columns — same visual pattern as spec.
              */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* P0 Cold Write (artifact_1) — visible as soon as submitted */}
                <EssayCard
                  label="Cold Write (P0)"
                  artifact={unit.artifact1}
                />
                {/* P2 L4W Essay (artifact_2) — only available when unit is complete */}
                {isComplete && (
                  <EssayCard
                    label="L4W Essay (P2)"
                    artifact={unit.artifact2}
                  />
                )}
              </div>
            </div>
          )}

          {/* ── Practice Signals ─────────────────────────────────── */}
          {unit.signals.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Practice Signals
              </h3>
              <div className="flex flex-col gap-2">
                {unit.signals.map((signal) => (
                  <SignalRow key={signal.practiceCode} signal={signal} />
                ))}
              </div>
            </div>
          )}

          {/* No content state: unit is in_progress but nothing submitted yet */}
          {!unit.artifact1 && unit.signals.length === 0 && (
            <p className="text-sm text-gray-400">
              No submissions yet.
            </p>
          )}

        </div>
      )}
    </details>
  );
}

// ─── EssayCard ───────────────────────────────────────────────────────────────

/**
 * EssayCard — displays one essay artifact (P0 or P2).
 * If the artifact is null (not yet submitted), shows a placeholder.
 */
function EssayCard({
  label,
  artifact,
}: {
  label: string;
  artifact: Artifact;
}) {
  return (
    <div className="flex flex-col gap-2">
      {/* Label + submission date */}
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        {artifact && (
          <span className="text-xs text-gray-400">
            {formatDate(artifact.submittedAt)}
          </span>
        )}
      </div>

      {artifact ? (
        /*
          whitespace-pre-wrap: preserves the essay's line breaks and spacing
          as the student typed them, without requiring a <pre> tag's monospace font.
        */
        <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
          {artifact.content}
        </div>
      ) : (
        <div className="rounded border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-400 italic">
          Not submitted yet
        </div>
      )}
    </div>
  );
}

// ─── SignalRow ────────────────────────────────────────────────────────────────

/**
 * SignalRow — one row of practice telemetry for a single practiceCode.
 * Shows: code | time | pass/fail | ⚠ if forced advance
 */
function SignalRow({ signal }: { signal: Signal }) {
  return (
    <div className="flex items-center gap-4 text-sm text-gray-600 font-mono">
      {/* Practice code (e.g. "L4M", "L1S") */}
      <span className="w-16 flex-shrink-0 font-semibold text-gray-700">
        {signal.practiceCode}
      </span>

      {/* Time spent on this practice */}
      <span className="w-20 flex-shrink-0 text-gray-500">
        {formatSeconds(signal.timeSeconds)}
      </span>

      {/* Pass / fail counts */}
      <span className="flex-shrink-0">
        <span className="text-green-600">{signal.passCount} pass</span>
        <span className="text-gray-400 mx-1">/</span>
        <span className="text-red-500">{signal.failCount} fail</span>
      </span>

      {/*
        Forced-advance warning: shown when the student exhausted their retries
        and was pushed forward by the system (AC-5.11, AC-5.12)
      */}
      {signal.failedAdvanced && (
        <span className="text-yellow-600 text-xs font-semibold">
          ⚠ forced advance
        </span>
      )}
    </div>
  );
}

// ─── FreePracticeCard ─────────────────────────────────────────────────────────

/**
 * FreePracticeCard — one free practice essay from the Question Bank.
 * Shows: number, date, question, essay text.
 */
function FreePracticeCard({ fp }: { fp: FreePracticeRow }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 flex flex-col gap-3">
      {/* Header: number + date */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-gray-700">
          Free Practice #{fp.number}
        </span>
        <span className="text-xs text-gray-400">{formatDate(fp.submittedAt)}</span>
      </div>

      {/* Question text */}
      {fp.questionText && (
        <p className="text-sm text-gray-500 leading-relaxed">
          Question: {fp.questionText}
        </p>
      )}

      {/* Essay text */}
      <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
        {fp.content || <span className="italic text-gray-400">No content</span>}
      </div>
    </div>
  );
}
