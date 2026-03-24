/**
 * educator.students — Educator Console: Student List (F15)
 *
 * Shows all students enrolled under this teacher's code.
 * Each row displays: email, tier, and progress (completed / max units).
 * Rows link to /educator/:studentId for the detail view.
 *
 * Access guard: requireTeacher → only Clerk users with role "teacher" can load this.
 *
 * Acceptance criteria covered: AC-5.1, AC-5.3, AC-5.13, AC-5.14
 */
import { redirect, Link } from "react-router";
import { clerkClient } from "@clerk/react-router/server";
import { requireTeacher } from "~/lib/auth.server";
import { prisma } from "~/lib/prisma.server";
import type { Route } from "./+types/educator.students";

// ─── Loader ──────────────────────────────────────────────────────────────────

/**
 * Loader: fetches all students enrolled under this teacher and shapes them
 * for display.
 *
 * Guard order:
 *   1. requireTeacher → redirect /sign-in or /unauthorized if not a teacher
 *   2. Teacher record must exist in DB → redirect /sign-in if not provisioned
 *
 * Progress derivation (no extra DB query — uses currentSequencePosition):
 *   - currentSequencePosition = the NEXT unit number the student will work on.
 *     So completedUnits = currentSequencePosition - 1.
 *   - When currentSequencePosition is null, the student finished the entire path,
 *     so completedUnits = maxUnits.
 */
export async function loader(args: Route.LoaderArgs) {
  // Step 1: authenticate. Returns Clerk user ID string.
  // Throws redirect(/sign-in) if not logged in, redirect(/unauthorized) if not teacher.
  const clerkUserId = await requireTeacher(args);

  // Step 2: look up the Teacher record to get the teacher's unique enrollment code.
  // A teacher can only see students who enrolled with their specific code.
  const teacher = await prisma.teacher.findUnique({
    where: { clerkUserId },
    select: { teacherCode: true },
  });

  if (!teacher) {
    // Teacher is authenticated in Clerk but not yet provisioned in the DB.
    // Redirect to sign-in so they can contact support.
    throw redirect("/sign-in");
  }

  // Step 3: fetch all students enrolled under this teacher's code.
  // currentSequencePosition tells us how far along in the sequence the student is.
  const students = await prisma.studentPath.findMany({
    where: { teacherCode: teacher.teacherCode },
    select: {
      studentId: true,
      clerkUserId: true,
      tier: true,
      currentSequencePosition: true,
    },
  });

  // Step 4: fetch Clerk user records to get email addresses and display names.
  // getUserList accepts an array of userId strings and returns matching User objects.
  // We build a Map so we can look up both email and name in O(1) per student.
  // Each entry now stores { email, name } instead of just a string.
  const clerkUserMap = new Map<string, { email: string; name: string }>(); // clerkUserId → { email, name }

  if (students.length > 0) {
    const clerkUserList = await clerkClient(args).users.getUserList({
      userId: students.map((s) => s.clerkUserId),
    });
    for (const user of clerkUserList.data) {
      const email =
        user.emailAddresses.find(
          (e) => e.id === user.primaryEmailAddressId
        )?.emailAddress ??
        user.emailAddresses[0]?.emailAddress ??
        user.id;
      // Build a display name from firstName + lastName.
      // filter(Boolean) removes null/undefined/empty strings before joining.
      // If no name fields exist, fall back to the email address.
      const name =
        [user.firstName, user.lastName].filter(Boolean).join(" ") || email;
      clerkUserMap.set(user.id, { email, name });
    }
  }

  // Step 5: shape each student into a clean display object.
  // maxUnits: the total number of units in their tier path (50 or 80).
  // completedUnits: derived from currentSequencePosition.
  const shapedStudents = students.map((s) => {
    const maxUnits = s.tier === "tier_50" ? 50 : 80;

    // currentSequencePosition is the *next* unit to work on.
    // Example: position 5 means units 1-4 are done (4 complete).
    // When null, the path is fully finished — all units are done.
    const completedUnits =
      s.currentSequencePosition !== null
        ? (s.currentSequencePosition ?? 1) - 1
        : maxUnits;

    const progressText = `${completedUnits} / ${maxUnits}`;

    // Pull both fields out of the map entry (or fall back to the Clerk ID string).
    const clerkData = clerkUserMap.get(s.clerkUserId);
    return {
      studentId: s.studentId,
      email: clerkData?.email ?? s.clerkUserId,
      // name falls back to email, which itself falls back to the Clerk ID.
      name: clerkData?.name ?? clerkData?.email ?? s.clerkUserId,
      tier: s.tier,
      completedUnits,
      maxUnits,
      progressText,
    };
  });

  return { students: shapedStudents };
}

// ─── Types ───────────────────────────────────────────────────────────────────

// Shape of a single student row, derived from the loader return.
type StudentRow = {
  studentId: string;
  email: string;
  name: string; // display name (firstName + lastName, or email as fallback)
  tier: string;
  completedUnits: number;
  maxUnits: number;
  progressText: string;
};

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * EducatorStudentsPage — the Educator Console home screen.
 *
 * Layout:
 *   ┌─ Header ─────────────────────────────────────────────────────────────┐
 *   │  Educator Console                                                     │
 *   │  Your students                                                        │
 *   └──────────────────────────────────────────────────────────────────────┘
 *   ┌─ Student list ───────────────────────────────────────────────────────┐
 *   │  student@email.com    Tier 50   12 / 50 units  →                     │
 *   │  other@email.com      Tier 80    5 / 80 units  →                     │
 *   └──────────────────────────────────────────────────────────────────────┘
 *
 * Fully read-only — no action buttons (AC-5.13, AC-5.14).
 */
export default function EducatorStudentsPage({
  loaderData,
}: Route.ComponentProps) {
  const { students } = loaderData;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Educator Console
          </h1>
          <p className="text-sm text-gray-500 mt-1">Your students</p>
        </div>

        {/* ── Student list ───────────────────────────────────────────── */}
        {/*
          Each student row is a Link to the detail page.
          The teacher can read all student data but cannot modify anything.
        */}
        <div className="flex flex-col gap-3">
          {students.map((student) => (
            <StudentRow key={student.studentId} student={student} />
          ))}
        </div>

        {/* ── Empty state ────────────────────────────────────────────── */}
        {students.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <p className="text-sm text-gray-400">
              No students have enrolled with your teacher code yet.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── StudentRow ──────────────────────────────────────────────────────────────

/**
 * StudentRow — one clickable row in the student list.
 * Links to the full detail view for that student.
 */
function StudentRow({ student }: { student: StudentRow }) {
  // Human-readable tier label (tier_50 → "Tier 50", tier_80 → "Tier 80")
  const tierLabel = student.tier === "tier_50" ? "Tier 50" : "Tier 80";

  return (
    <Link
      to={`/educator/${student.studentId}`}
      className="rounded-lg border border-gray-200 bg-white p-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
    >
      {/* Left: name (primary) + email (secondary) stacked */}
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-800 truncate">
          {student.name}
        </span>
        <span className="text-xs text-gray-400 truncate">{student.email}</span>
      </div>

      {/* Right: tier + progress + arrow */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <span className="text-xs text-gray-500 font-medium">{tierLabel}</span>
        <span className="text-xs text-gray-500">
          {student.progressText} units
        </span>
        <span className="text-gray-400 text-sm">→</span>
      </div>
    </Link>
  );
}
