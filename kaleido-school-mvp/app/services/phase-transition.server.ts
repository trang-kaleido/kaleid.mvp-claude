/**
 * PhaseTransitionService — server-only business logic for phase advancement.
 *
 * WHY a separate service file?
 * The route `action` function should stay thin — it validates input and redirects.
 * The actual database writes (which involve transactions across multiple tables)
 * live here so they can be tested independently and reused by future routes.
 *
 * `completeP0` handles the cold write phase.
 * `completeP1` handles phase advancement after the 10 encoding practices (F08).
 * P2 transition is deferred to a later feature.
 */
import { prisma } from "~/lib/prisma.server";

export const PhaseTransitionService = {
  /**
   * completeP0 — called when a student submits their P0 cold essay.
   *
   * Does TWO things atomically in one database transaction:
   *   1. Creates a StudentAttempt row to save the essay as Artifact 1
   *   2. Updates StudentUnitProgress.currentPhase from 'p0' → 'p1'
   *
   * WHY a transaction?
   * If the attempt write succeeds but the phase update fails (or vice versa),
   * the student would either lose their essay or be stuck on P0 forever.
   * Wrapping both in `$transaction` means either both succeed or both roll back.
   *
   * @param clerkUserId - The Clerk user ID string (from `requireStudent`)
   * @param unitId      - UUID of the prep unit being completed
   * @param essayText   - The student's raw essay text
   */
  async completeP0(
    clerkUserId: string,
    unitId: string,
    essayText: string
  ): Promise<void> {
    // Step 1: Look up the StudentPath to get the internal studentId (UUID).
    // We always receive a clerkUserId from auth — the UUID lives in StudentPath.
    const path = await prisma.studentPath.findUnique({
      where: { clerkUserId },
      select: { studentId: true },
    });

    if (!path) {
      // This should never happen if the route loader already checked for a path,
      // but we guard defensively here in case the action is called directly.
      throw new Error(`No StudentPath found for clerkUserId: ${clerkUserId}`);
    }

    const { studentId } = path;

    // Step 2: Atomic transaction — both writes or neither.
    await prisma.$transaction([
      // Write 1: Create the StudentAttempt record.
      // This is the permanent log entry for this submission.
      prisma.studentAttempt.create({
        data: {
          studentId,
          unitId,
          practiceCode: "P0",
          // itemId is 'P0' for the cold write — there's only one "item" (the whole essay).
          itemId: "P0",
          // version is null for P0 — no V1/V2 distractor variants exist for essay writes.
          // (V1/V2 versioning only applies to MCQ, scramble, and fill practices.)
          version: null,
          // response is an empty JSON object — P0 essays are stored in artifactContent.
          response: {},
          // pass is null — essay writes are not graded pass/fail.
          pass: null,
          // startedAt would ideally come from the client, but we default to now()
          // for simplicity. The action passes startedAt from the hidden form field.
          startedAt: new Date(),
          completedAt: new Date(),
          artifactType: "artifact_1",
          artifactContent: essayText,
        },
      }),

      // Write 2: Advance the phase from p0 → p1.
      // StudentUnitProgress has a composite unique key: (studentId, unitId).
      // `update` is safe here because the loader already confirmed the row exists.
      prisma.studentUnitProgress.update({
        where: {
          studentId_unitId: { studentId, unitId },
        },
        data: {
          currentPhase: "p1",
        },
      }),
    ]);
  },

  /**
   * completeP1 — called after the student finishes all 10 encoding practices.
   *
   * Does ONE thing: advances StudentUnitProgress.currentPhase from 'p1' → 'p2'.
   *
   * WHY no artifact here?
   * P1 has no output artifact — it's a pure encoding practice.
   * Only P0 (cold essay = Artifact 1) and P2 (post-encoding essay = Artifact 2)
   * write artifacts. P1 just advances the phase.
   *
   * @param clerkUserId - The Clerk user ID string (from `requireStudent`)
   * @param unitId      - UUID of the prep unit being completed
   */
  async completeP1(clerkUserId: string, unitId: string): Promise<void> {
    // Step 1: Look up the StudentPath to get the internal studentId (UUID).
    // Same pattern as completeP0 — we always receive a clerkUserId from auth.
    const path = await prisma.studentPath.findUnique({
      where: { clerkUserId },
      select: { studentId: true },
    });

    if (!path) {
      throw new Error(`No StudentPath found for clerkUserId: ${clerkUserId}`);
    }

    const { studentId } = path;

    // Step 2: Update the phase from p1 → p2.
    // Using a transaction here for consistency with completeP0, even though
    // there's only one write — makes it easier to add atomic operations later.
    await prisma.$transaction([
      prisma.studentUnitProgress.update({
        where: {
          studentId_unitId: { studentId, unitId },
        },
        data: {
          currentPhase: "p2",
        },
      }),
    ]);
  },

  /**
   * completeP2 — called when a student submits their P2 L4W essay.
   *
   * Does FOUR things atomically in one database transaction:
   *   1. Creates a StudentAttempt row to save the essay as Artifact 2
   *   2. Marks this unit's StudentUnitProgress status as 'complete'
   *   3. Unlocks the next unit (if one exists) by setting its status to 'in_progress'
   *   4. Increments (or nulls out) StudentPath.currentSequencePosition
   *
   * WHY the interactive transaction form (callback) instead of the array form?
   * We need to look up the next unit's ID BEFORE writing to it — that lookup
   * result drives a conditional write inside the same transaction. The array form
   * only works for static, pre-built queries. The callback form gives us a `tx`
   * client we can use for both the lookup AND the writes within one atomic block.
   *
   * WHY two separate pre-transaction queries?
   * Finding the path and the next unit needs to happen BEFORE we open the
   * transaction so we can decide which rows to touch. Moving these into the
   * transaction callback is safe too, but running them outside keeps the
   * transaction as short as possible (less lock contention on busy DB).
   *
   * @param clerkUserId - The Clerk user ID string (from `requireStudent`)
   * @param unitId      - UUID of the prep unit being completed
   * @param essayText   - The student's raw P2 essay text (becomes Artifact 2)
   */
  async completeP2(
    clerkUserId: string,
    unitId: string,
    essayText: string
  ): Promise<void> {
    // Step 1: Look up the student's path.
    // We need batchId + tier to find the next unit in TierUnitSequence,
    // and currentSequencePosition to know which position we're at now.
    const path = await prisma.studentPath.findUnique({
      where: { clerkUserId },
      select: {
        studentId: true,
        batchId: true,
        tier: true,
        currentSequencePosition: true,
      },
    });

    if (!path) {
      throw new Error(`No StudentPath found for clerkUserId: ${clerkUserId}`);
    }

    const { studentId, batchId, tier, currentSequencePosition } = path;

    // Step 2: Find the next unit in sequence BEFORE opening the transaction.
    // TierUnitSequence rows are ordered by sequencePosition.
    // If there is no row at position + 1, this is the last unit.
    let nextUnitId: string | null = null;

    if (currentSequencePosition !== null) {
      const nextSeq = await prisma.tierUnitSequence.findUnique({
        where: {
          batchId_tier_sequencePosition: {
            batchId,
            tier,
            sequencePosition: currentSequencePosition + 1,
          },
        },
        select: { unitId: true },
      });
      nextUnitId = nextSeq?.unitId ?? null;
    }

    // Step 3: Atomic transaction — all four writes succeed or all roll back.
    await prisma.$transaction(async (tx) => {
      // Write 1: Save Artifact 2 (the P2 post-encoding essay).
      // practiceCode 'L4W' and artifactType 'artifact_2' distinguish this from
      // Artifact 1 (P0 cold essay, practiceCode 'P0', artifactType 'artifact_1').
      await tx.studentAttempt.create({
        data: {
          studentId,
          unitId,
          practiceCode: "L4W",
          itemId: "L4W",
          version: null,
          response: {},
          pass: null,
          startedAt: new Date(),
          completedAt: new Date(),
          artifactType: "artifact_2",
          artifactContent: essayText,
        },
      });

      // Write 2: Mark this unit as complete.
      // completedAt records the exact moment the student finished the unit.
      await tx.studentUnitProgress.update({
        where: { studentId_unitId: { studentId, unitId } },
        data: { status: "complete", completedAt: new Date() },
      });

      // Write 3: Unlock the next unit (if one exists).
      // We set status: 'in_progress' and currentPhase: 'p0' so the student
      // starts fresh on P0 for the new unit.
      if (nextUnitId) {
        await tx.studentUnitProgress.update({
          where: { studentId_unitId: { studentId, unitId: nextUnitId } },
          data: { status: "in_progress", currentPhase: "p0" },
        });
      }

      // Write 4: Advance (or null out) the sequence position on StudentPath.
      // If there IS a next unit: position + 1.
      // If this WAS the last unit: null signals "path complete" (AC-4.7).
      await tx.studentPath.update({
        where: { studentId },
        data: {
          currentSequencePosition: nextUnitId
            ? (currentSequencePosition ?? 0) + 1
            : null,
        },
      });
    });
  },
};
