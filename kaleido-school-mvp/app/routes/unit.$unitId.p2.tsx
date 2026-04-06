/**
 * unit.$unitId.p2 — P2 Applying Write Page (F11)
 *
 * The final phase of a unit. The student writes a full IELTS essay again
 * on the same question as P0, but now with two collapsible reference panels:
 *   - Lexical Items: all phrases extracted from the model essay
 *   - Syntax Patterns: all syntax patterns from the model essay
 *
 * Unlike P0, there is NO Peek button (AC-3.22).
 * Unlike P1, there is NO Pause button — the 40-minute timer runs continuously.
 *
 * On submit: saves Artifact 2, marks the unit complete, unlocks the next unit,
 * and redirects to /unit-complete/:unitId (F12 builds that screen).
 *
 * Acceptance criteria covered:
 *   AC-3.20 — After P1, currentPhase is 'p2'; this route loads correctly
 *   AC-3.21 — Shows IELTS question, textarea, lexical + syntax panels, 40-min timer
 *   AC-3.22 — NO Peek button
 *   AC-3.23 — StudentAttempt: practiceCode: 'L4W', artifactType: 'artifact_2'
 *   AC-3.24 — Unit gate: status → 'complete', next unit unlocks
 *   AC-3.25 — StudentPath.currentSequencePosition increments (+1, or → null if last)
 */
import { useState, useEffect } from "react";
import { redirect, Form, useActionData } from "react-router";
import { z } from "zod";
import { requireStudent } from "~/lib/auth.server";
import { prisma } from "~/lib/prisma.server";
import { PhaseTransitionService } from "~/services/phase-transition.server";
import { safeParseJson } from "~/lib/json.server";
import { CountdownTimer } from "~/components/ui/CountdownTimer";
import type { Route } from "./+types/unit.$unitId.p2";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Sentence shape — matches LAB-SCHOOL-CONTRACT §6.
 * We only need the lexical_items and syntax_items fields for the panels,
 * but we type the full shape for safety.
 */
interface Sentence {
  sentence_id: string;
  paragraph_type: string;
  order: number;
  canonical_text: string;
  rhetoric_tag: string;
  rhetoric_label: string;
  direction_tag: string;
  lexical_items: { phrase: string; pos: string }[];
  syntax_items: string[];
}

// ─── Loader ──────────────────────────────────────────────────────────────────

/**
 * Loader: fetches the question and builds the two reference panels.
 *
 * Guard checks (in order):
 *   1. requireStudent → redirect /sign-in if not authenticated
 *   2. StudentPath must exist → redirect /onboarding/tier
 *   3. Unit must not be locked → redirect /dashboard
 *   4. currentPhase must be 'p2' → redirect to the correct phase if not
 *
 * Server-side derivations (cheaper than sending raw sentences to the client):
 *   - lexicalItems: flatMap all s.lexical_items, deduplicated by phrase
 *   - syntaxPatterns: flatMap all s.syntax_items, deduplicated
 *
 * WHY deduplicate on the server?
 * The same phrase or pattern can appear in multiple sentences.
 * Deduplication here keeps the panels clean and avoids sending duplicate data
 * over the wire. The derived arrays are small and safe to include in loaderData.
 */
export async function loader(args: Route.LoaderArgs) {
  const clerkUserId = await requireStudent(args);

  const path = await prisma.studentPath.findUnique({
    where: { clerkUserId },
    select: { studentId: true },
  });

  if (!path) {
    throw redirect("/onboarding/tier");
  }

  const { unitId } = args.params;

  const progress = await prisma.studentUnitProgress.findUnique({
    where: {
      studentId_unitId: { studentId: path.studentId, unitId },
    },
    select: { status: true, currentPhase: true },
  });

  if (!progress || progress.status === "locked") {
    throw redirect("/dashboard");
  }

  // If the student is not on p2, send them through the phase router.
  // (Handles browser back-button or bookmarked URL edge cases.)
  if (progress.currentPhase !== "p2") {
    throw redirect(`/unit/${unitId}`);
  }

  // Fetch the question AND sentences — we need both.
  // question → displayed in the question box (same as P0)
  // sentences → used server-side to build the two reference panels
  const prepUnit = await prisma.prepUnit.findUnique({
    where: { unitId },
    select: { question: true, sentences: true },
  });

  if (!prepUnit) {
    throw redirect("/dashboard");
  }

  const sentences = safeParseJson<Sentence[]>(prepUnit.sentences);

  // Build deduplicated lexical items list.
  // We use a Map keyed by phrase — if the same phrase appears twice, the first
  // occurrence wins (Map.set() on an existing key is a no-op here because we
  // use has() to skip duplicates, preserving the first pos we encounter).
  const seenPhrases = new Set<string>();
  const lexicalItems: { phrase: string; pos: string }[] = [];

  for (const sentence of sentences) {
    for (const item of (sentence.lexical_items ?? [])) {
      if (!seenPhrases.has(item.phrase)) {
        seenPhrases.add(item.phrase);
        lexicalItems.push(item);
      }
    }
  }

  // Build deduplicated syntax patterns list.
  // Using Set to remove duplicates, then spreading back into an array.
  const syntaxPatterns = [
    ...new Set(sentences.flatMap((s) => s.syntax_items ?? [])),
  ];

  return { unitId, question: prepUnit.question, lexicalItems, syntaxPatterns };
}

// ─── Action ──────────────────────────────────────────────────────────────────

/**
 * Zod schema for the P2 submit form.
 *
 * Same 100-character minimum as P0 — ensures meaningful effort before accepting.
 */
const P2SubmitSchema = z.object({
  essay: z.string().min(100, "Your essay must be at least 100 characters."),
});

/**
 * Action: processes the P2 essay submission.
 *
 * If validation fails → returns error data (page re-renders with inline error).
 * If validation passes → calls PhaseTransitionService.completeP2(), which:
 *   - Saves Artifact 2
 *   - Marks unit complete
 *   - Unlocks next unit (or sets path complete)
 *   - Increments sequence position
 *   Then redirects to /unit-complete/:unitId (F12 builds that screen).
 */
export async function action(args: Route.ActionArgs) {
  const clerkUserId = await requireStudent(args);

  const { unitId } = args.params;

  const formData = await args.request.formData();
  const rawEssay = formData.get("essay");

  // Validate with Zod.
  const result = P2SubmitSchema.safeParse({ essay: rawEssay });

  if (!result.success) {
    // Return validation error — the component will display it inline.
    return {
      error: result.error.issues[0].message,
    };
  }

  // Delegate all four database writes to the service (keeps the action thin).
  await PhaseTransitionService.completeP2(
    clerkUserId,
    unitId,
    result.data.essay
  );

  // Redirect to the submission confirmation screen before unit-complete.
  throw redirect(`/unit/${unitId}/p2/submitted`);
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * P2ApplyingPage — the page the student sees when writing their post-encoding essay.
 *
 * Layout:
 *   ┌─ Header ────────────────────────────────────────────────────────────────┐
 *   │  "P2 — Applying"                           CountdownTimer (40 min)      │
 *   │  (no peek button, no pause toggle)                                      │
 *   └─────────────────────────────────────────────────────────────────────────┘
 *   ┌─ Content (max-w-2xl, centered, scrollable) ─────────────────────────────┐
 *   │  Question box (same style as P0)                                        │
 *   │  <details> Lexical Items collapsible panel                              │
 *   │  <details> Syntax Patterns collapsible panel                            │
 *   │  <Form method="post">                                                   │
 *   │    <input type="hidden" name="startedAt" />                             │
 *   │    <textarea name="essay" rows=16 />                                    │
 *   │    {error && <p role="alert">{error}</p>}                               │
 *   │    <button type="submit">Submit Essay →</button>                        │
 *   │  </Form>                                                                │
 *   └─────────────────────────────────────────────────────────────────────────┘
 *
 * WHY native <details>/<summary> for collapsible panels?
 * No JavaScript state or event handlers needed — the browser handles open/close.
 * This is the simplest correct solution for a "show/hide" toggle.
 */
export default function P2ApplyingPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { question, lexicalItems, syntaxPatterns } = loaderData;

  // actionData is set when the action returns a validation error.
  // It's undefined on the initial page load (before any submission).
  const error = actionData?.error;

  // startedAt is captured client-side on mount — same pattern as P0.
  // We record WHEN the student opened this page so it can be stored
  // in StudentAttempt.startedAt (even though completeP2 uses new Date() server-side).
  const [startedAt, setStartedAt] = useState<string>("");

  useEffect(() => {
    // Record the exact moment the page first loaded as the "start time".
    setStartedAt(new Date().toISOString());
  }, []);

  return (
    <div className="min-h-screen bg-stone-50">

      {/* ── Sticky header ────────────────────────────────────────────── */}
      {/*
        Deliberately simpler than P1's header:
        - No Peek button (AC-3.22)
        - No Pause toggle
      */}
      <div className="sticky top-0 z-10 border-b-2 border-gray-500 bg-white px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-sm font-extrabold uppercase tracking-widest text-gray-900">
            Write Your Answer
          </h1>
          <p className="text-xs font-semibold text-gray-400">Step 3 of 3</p>
        </div>
      </div>

      {/* ── Two-column body ───────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8 items-start">

        {/* LEFT — question + essay form */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">

          {/* ── IELTS Question ──────────────────────────────────────── */}
          {/*
            Same question as P0 (fetched from PrepUnit.question in the loader).
            Displayed read-only — not inside the form, not editable.
          */}
          <div className="rounded-lg border-2 border-gray-500 bg-white p-4 shadow-[3px_3px_0px_0px_rgba(17,24,39,0.5)]">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
              IELTS Task 2 Question
            </p>
            <p className="text-sm text-gray-800 leading-relaxed">{question}</p>
          </div>

          {/* ── Essay Form ────────────────────────────────────────────── */}
          <Form method="post" className="flex flex-col gap-4">
            {/* Hidden field: captures the start time on the client side */}
            <input type="hidden" name="startedAt" value={startedAt} />

            {/* Essay textarea */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="essay"
                className="text-sm font-bold text-gray-700"
              >
                Your Essay
              </label>
              <textarea
                id="essay"
                name="essay"
                rows={22}
                placeholder="Write your IELTS Task 2 essay here..."
                className="rounded-lg border-2 border-gray-500 bg-white p-3 text-sm text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y shadow-[3px_3px_0px_0px_rgba(17,24,39,0.5)]"
              />
            </div>

            {/* Inline validation error — shown only after a failed submission */}
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            {/*
              Submit button — always enabled (same rule as P0: AC-3.3 pattern).
              The timer expiring does not disable submission.
            */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 border-2 border-gray-500 px-6 py-2 text-sm font-bold text-white shadow-[2px_2px_0px_0px_rgba(17,24,39,0.5)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              >
                Submit Essay →
              </button>
            </div>
          </Form>

        </div>

        {/* RIGHT SIDEBAR — timer + reference panels */}
        <aside className="w-full lg:w-96 shrink-0 flex flex-col gap-4 lg:sticky lg:top-[57px]">

          {/* Timer card */}
          <div className="rounded-lg border-2 border-gray-500 bg-white p-4 shadow-[3px_3px_0px_0px_rgba(17,24,39,0.5)] flex flex-col items-center gap-1">
            <p className="text-xs font-black uppercase tracking-widest text-gray-500">Time Remaining</p>
            {/* CountdownTimer counts down from 40:00 to 00:00, no pause */}
            <CountdownTimer durationMinutes={40} />
          </div>

          {/* Key Vocabulary accordion */}
          {/*
            Native <details> element — no JS state needed.
            Deduplication happened in the loader, so each phrase appears once.
          */}
          <details className="rounded-lg border-2 border-gray-500 bg-white shadow-[3px_3px_0px_0px_rgba(17,24,39,0.5)]">
            <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-gray-900 select-none">
              Key Vocabulary ({lexicalItems.length})
            </summary>
            <ul className="px-4 pb-3 flex flex-col gap-1">
              {lexicalItems.map((item, i) => (
                <li key={i} className="flex gap-2 items-baseline text-sm">
                  {/* The phrase itself — main item */}
                  <span className="font-medium text-gray-800">{item.phrase}</span>
                  {/* Part-of-speech tag — small, muted, uppercase */}
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                    {item.pos}
                  </span>
                </li>
              ))}
            </ul>
          </details>

          {/* Sentence Structures accordion */}
          {/*
            syntaxPatterns is a string array — each entry is one pattern description.
          */}
          <details className="rounded-lg border-2 border-gray-500 bg-white shadow-[3px_3px_0px_0px_rgba(17,24,39,0.5)]">
            <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-gray-900 select-none">
              Sentence Structures ({syntaxPatterns.length})
            </summary>
            <ul className="px-4 pb-3 flex flex-col gap-1">
              {syntaxPatterns.map((pattern, i) => (
                <li key={i} className="text-sm text-gray-700">
                  {pattern}
                </li>
              ))}
            </ul>
          </details>

        </aside>

      </div>
    </div>
  );
}
