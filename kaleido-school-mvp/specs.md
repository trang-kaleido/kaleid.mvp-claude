# Kaleido School Implementation — Requirements

  

**Feature Name**: school-implementation

**Version**: 1.0

**Created**: 2026-03-12

**Status**: ✅ **Ready for Implementation** — Lab P2/P3 complete, data contract finalized

  

---

  

## 1. Overview

  

This spec defines the complete implementation of the Kaleido School (Remix web app) after the Lab's P2 and P3 pipelines are rebuilt to output the new 7-table relational schema. The School is content-agnostic and renders whatever the Lab produces through a clean data contract.

  

**✅ Prerequisite Met**: Lab has completed P2/P3 rebuild and produced the finalized data contract with TypeScript interfaces and Zod validators (see `LAB-SCHOOL-CONTRACT.md`).

  

**Scope**: Features F01 through F15 from `features.json`, organized into 5 implementation phases.

  

---

  

## 2. User Stories

  

### 2.1 As a Student

  

**US-1**: As a student, I want to choose between a 50-unit or 80-unit learning path at onboarding so I can commit to the right amount of content for my exam timeline.

  

**US-2**: As a student, I want to write a cold essay (P0) before seeing any model content so my teacher can see my baseline writing ability.

  

**US-3**: As a student, I want to work through 10 sequential encoding practices (P1) that force me to engage with a model essay from multiple angles so I internalize high-quality writing patterns.

  

**US-4**: As a student, I want access to a "peek" modal during encoding practices so I can reference the model essay when I'm stuck, without penalty.

  

**US-5**: As a student, I want immediate retry with different content (V2) when I get a question wrong so I can learn from a fresh perspective without seeing the correct answer.

  

**US-6**: As a student, I want to be forced forward after 3 failed attempts so I don't get stuck on a single item indefinitely.

  

**US-7**: As a student, I want to write the same essay again after encoding (P2) so I can apply what I learned and my teacher can compare my before/after writing.

  

**US-8**: As a student, I want to see which new Question Bank questions unlocked after completing a unit so I know what additional practice is now available.

  

**US-9**: As a student, I want to practice writing on unlocked Question Bank questions at any time so I can get extra repetitions on topics I've learned.

  

**US-10**: As a student, I want my progress to save at phase boundaries (after P0, P1, P2) so I can return later and resume where I left off.

  

### 2.2 As a Teacher

  

**US-11**: As a teacher, I want to see each student's P0 cold essay immediately after they submit it so I can assess their baseline before they finish the unit.

  

**US-12**: As a teacher, I want to compare a student's P0 and L4W essays side-by-side (both on the same question) so I can measure their learning growth.

  

**US-13**: As a teacher, I want to see how much time each student spent on each practice so I can identify where they struggled.

  

**US-14**: As a teacher, I want to see a total accumulated time metric per student so I can verify they're putting in sufficient effort.

  

**US-15**: As a teacher, I want to see which practices a student failed and was forced forward on so I can identify knowledge gaps.

  

**US-16**: As a teacher, I want to see numbered Free Practice essays from the Question Bank so I can track how much extra writing practice each student is doing.

  

---

  

## 3. Acceptance Criteria

  

### 3.1 Phase 1: Infrastructure & Data Ingestion

  

**AC-1.1**: Database schema includes all 7 tables (PrepUnit, DirectionRef, TierUnitSequence, QBankUnlocks, StudentPath, StudentUnitProgress, StudentAttempt) with correct field types and constraints.

  

**AC-1.2**: TierUnitSequence has composite unique constraint on `(batch_id, tier, sequence_position)` to prevent duplicate units in the same slot.

  

**AC-1.3**: TierUnitSequence has composite unique constraint on `(batch_id, tier, unit_id)` to prevent the same unit appearing twice in a tier.

  

**AC-1.4**: Ingestion script successfully parses `data.json` and writes all 4 top-level arrays (prep_units, tier_sequences, qbank_unlocks, direction_ref) to their respective tables.

  

**AC-1.5**: Ingestion uses Prisma upsert to handle units that appear in multiple tiers — unit is stored once in PrepUnit, referenced multiple times in TierUnitSequence.

  

**AC-1.6**: Ingestion is idempotent — running it twice with the same `batch_id` does not create duplicates.

  

**AC-1.7**: Environment variables include both `DATABASE_URL` (pooled connection for serverless) and `DIRECT_URL` (direct connection for migrations).

  

**AC-1.8**: `npx prisma validate` passes without errors.

  

**AC-1.9**: `npx prisma migrate dev` successfully creates the initial migration.

  

### 3.2 Phase 2: Student Onboarding & Pathing

  

**AC-2.1**: Onboarding flow has 3 screens: tier selection → teacher code entry → path assigned confirmation.

  

**AC-2.2**: Tier selection screen shows exactly 2 options: "50 units" and "80 units" with clear descriptions.

  

**AC-2.3**: Teacher code is required — no skip option exists.

  

**AC-2.4**: On path assignment, a StudentPath record is created with the current `batch_id` (latest content version) locked permanently.

  

**AC-2.5**: On path assignment, StudentUnitProgress rows are created for all units in the selected tier (50 or 80 rows), all with `status: 'locked'` except Unit 1 which is `status: 'in_progress'`.

  

**AC-2.6**: StudentPath.current_sequence_position is set to 1 on path assignment.

  

**AC-2.7**: Dashboard shows the full unit list with correct status indicators (locked/in-progress/complete).

  

**AC-2.8**: Dashboard shows Question Bank entry point (initially empty until first unit is completed).

  

**AC-2.9**: Locked units cannot be clicked — only the current in-progress unit is accessible.

  

### 3.3 Phase 3: Practice Engine (P0, P1, P2)

  

**AC-3.1**: Clicking an in-progress unit loads the correct phase based on StudentUnitProgress.current_phase (p0, p1, p2).

  

**AC-3.2**: P0 (Cold Write) shows the IELTS question, a text editor, and a 40-minute countdown timer.

  

**AC-3.3**: P0 timer counts down from 40:00, freezes at 0:00, and submission remains available after timer expires.

  

**AC-3.4**: P0 timer cannot be paused — it runs continuously until it reaches 0:00.

  

**AC-3.5**: P0 submit creates a StudentAttempt record with `practice_code: 'P0'`, `artifact_type: 'artifact_1'`, and essay text in `artifact_content`.

  

**AC-3.6**: After P0 submit, StudentUnitProgress.current_phase updates to 'p1' and a save point is set. If student leaves mid-P1, they restart P1 from the beginning (no mid-practice save state).

  

**AC-3.7**: P1 loads the first practice (L4M) from the `practices` JSONB column.

  

**AC-3.8**: P1 displays a stopwatch (counts up from 0:00) that can be paused.

  

**AC-3.9**: P1 shows a "Peek" button that opens a modal with the model essay (color-coded: noun phrases = emerald + semibold, verbs = red, adverbs = blue), PoV cards (with rhetoric tag tooltips on sentence hover), and lexical items panel.

  

**AC-3.10**: Peek modal is available throughout all 10 P1 practices with no rate limit.

  

**AC-3.11**: Each practice type (MCQ, Scramble, Fill) renders correctly based on `practice_code`:

- L4M, L3M, L2M, L1M: 5-option MCQ, one question at a time

- L1S, L2S: Click-to-place word bank

- L3S, L4S: Drag-to-order sentences/paragraphs

- L1F: Fill blanks with POS hints and similar_phrases visible

- L2F: Fill blanks with hint_sentences visible, no grading

  

**AC-3.12**: MCQ wrong answer shows red X indicator, no correct answer revealed, V2 auto-loads immediately. After 2nd failure, V1 reloads for 3rd attempt (retry cycle: V1 → V2 → V1).

  

**AC-3.13**: Scramble wrong arrangement shows red X indicator, same items reload for retry.

  

**AC-3.14**: L1F wrong answers show red X on specific blanks that were incorrect, same section reloads for retry.

  

**AC-3.15**: L2F always advances on submit regardless of input (no pass/fail, output discarded). A StudentAttempt record is created for time tracking purposes with `practice_code: 'L2F'` and `artifact_type: null`.

  

**AC-3.16**: After 3 failed attempts on any item, "Continue →" button appears with copy "You've used all attempts — keep going."

  

**AC-3.17**: Forced advance after 3 failures creates StudentAttempt record with `failed_advanced: true`.

  

**AC-3.18**: "Next →" button appears when an item is answered 100% correctly.

  

**AC-3.19**: All 10 P1 practices must be completed in sequence before P2 is accessible.

  

**AC-3.19a**: P1 has no mid-practice save state. If student leaves during P1 (closes browser, navigates away), they restart P1 from the beginning on return (UX Spec §13 "one sit" rule).

  

**AC-3.20**: After completing all P1 practices, StudentUnitProgress.current_phase updates to 'p2' and a save point is set. If student leaves mid-P2, they restart P2 from the beginning (no mid-practice save state).

  

**AC-3.21**: P2 (L4W) shows the same IELTS question as P0, a text editor, collapsible lexical items panel, collapsible syntax patterns panel, and a 40-minute countdown timer.

  

**AC-3.22**: Peek button is NOT available during P2 L4W.

  

**AC-3.23**: P2 L4W submit creates StudentAttempt record with `practice_code: 'L4W'`, `artifact_type: 'artifact_2'`, and essay text in `artifact_content`.

  

**AC-3.24**: P2 L4W submit is the unit gate — StudentUnitProgress.status updates to 'complete', StudentUnitProgress.completed_at is set, and the next unit unlocks.

  

**AC-3.25**: StudentPath.current_sequence_position increments by 1 after unit completion.

  

### 3.4 Phase 4: Unit Completion & Question Bank

  

**AC-4.1**: After L4W submit, student sees a unit complete screen (not the dashboard).

  

**AC-4.2**: Unit complete screen shows which new Question Bank questions were unlocked (query QBankUnlocks by `batch_id + tier + unlocked_by_sequence_position`).

  

**AC-4.3**: Unit complete screen has two buttons: "Go to Question Bank" and "Next Unit →".

  

**AC-4.4**: If the completed unit was the last in the tier, student sees a path complete screen instead of unit complete screen.

  

**AC-4.5**: Path complete screen acknowledges completion and shows that Question Bank remains open.

  

**AC-4.6**: Path complete screen has buttons: "Go to Question Bank" and "Back to Dashboard".

  

**AC-4.7**: After path completion, StudentPath.current_sequence_position is set to null.

  

**AC-4.8**: Question Bank home shows all questions in 3 states: attempted (with attempt count), unlocked (no attempts yet), locked (shows "Unlock after completing Prep-Unit [N]").

  

**AC-4.9**: Locked questions show only first ~8 words followed by "…".

  

**AC-4.10**: Clicking an unlocked or attempted question loads the Question Bank write screen.

  

**AC-4.11**: Question Bank write shows the question, a text editor, and a 40-minute countdown timer.

  

**AC-4.12**: No peek button, no scaffold, no hints in Question Bank write.

  

**AC-4.13**: Question Bank submit creates StudentAttempt record with `practice_code: 'QB_WRITE'`, `artifact_type: 'free_practice'`, `qbank_question_id` populated, `unit_id` null.

  

**AC-4.14**: Student can submit multiple essays on the same Question Bank question — each creates a new numbered artifact.

  

**AC-4.15**: Question Bank has no save state — each session is self-contained.

  

### 3.5 Phase 5: Educator Console

  

**AC-5.1**: Teacher login uses Clerk authentication with a teacher role.

  

**AC-5.2**: Teacher sees only students who entered their `teacher_code` at onboarding.

  

**AC-5.3**: Teacher can view a list of their students with overall progress (units completed / total units).

  

**AC-5.4**: Clicking a student shows their full unit list with status indicators.

  

**AC-5.5**: For each completed unit, teacher sees Artifact 1 (P0 cold essay) and Artifact 2 (L4W post-encoding essay) side-by-side.

  

**AC-5.6**: Artifact 1 is visible immediately after student submits P0 (before unit is complete).

  

**AC-5.7**: Artifact 2 is visible after student completes the unit (L4W submit).

  

**AC-5.8**: Teacher sees numbered Free Practice artifacts from Question Bank (Free Practice #1, #2, etc.) with question text and date.

  

**AC-5.9**: Teacher sees time spent per practice (derived from StudentAttempt.started_at and completed_at).

  

**AC-5.10**: Teacher sees total accumulated time per student (SUM of all completed_at - started_at across all StudentAttempt records for that student).

  

**AC-5.11**: Teacher sees pass/fail indicators per practice.

  

**AC-5.12**: Teacher sees which practices were marked `failed_advanced: true`.

  

**AC-5.13**: Teacher cannot edit, annotate, or reply to student work (read-only in MVP).

  

**AC-5.14**: Teacher cannot lock/unlock units or modify student progress.

  

---

  

## 4. Technical Requirements

  

### 4.1 Database Schema (Prisma)

  

**TR-1.1**: Use PostgreSQL via Supabase as the database provider.

  

**TR-1.2**: All UUIDs use `@default(uuid())` for auto-generation.

  

**TR-1.3**: All timestamps use `@default(now())` for created_at fields.

  

**TR-1.4**: JSONB columns use `Json` type in Prisma.

  

**TR-1.5**: Enums are defined for: `tier` (tier_50, tier_80), `status` (locked, in_progress, complete), `current_phase` (p0, p1, p2), `artifact_type` (artifact_1, artifact_2, free_practice).

  

**TR-1.6**: Foreign key relationships are explicitly defined with `@relation`.

  

**TR-1.7**: Composite unique constraints use `@@unique([field1, field2])`.

  

### 4.2 Data Ingestion

  

**TR-2.1**: Ingestion script is a standalone TypeScript file (`scripts/ingest.ts`) that can be run via `npm run ingest`.

  

**TR-2.2**: Script reads `data.json` from a configurable path (environment variable or CLI argument).

  

**TR-2.3**: Script validates `data.json` structure before writing (check for required top-level keys: batch_id, prep_units, tier_sequences, qbank_unlocks, direction_ref).

  

**TR-2.4**: Script uses Prisma transactions to ensure atomic writes (all-or-nothing).

  

**TR-2.5**: Script logs progress (e.g., "Inserted 50 prep_units, 100 tier_sequences, 200 qbank_unlocks, 15 direction_refs").

  

**TR-2.6**: Script handles errors gracefully and rolls back on failure.

  

### 4.3 Authentication & Authorization

  

**TR-3.1**: Use Clerk for authentication (email/password + OAuth).

  

**TR-3.2**: Student and teacher roles are managed via Clerk metadata.

  

**TR-3.3**: Clerk webhook syncs user creation to the database (creates StudentPath or Teacher record).

  

**TR-3.4**: All student routes require authentication and check that the user is a student.

  

**TR-3.5**: All teacher routes require authentication and check that the user is a teacher.

  

**TR-3.6**: Students can only access their own data (enforce via Prisma queries filtered by student_id).

  

**TR-3.7**: Teachers can only access students with their teacher_code (enforce via Prisma queries).

  

### 4.4 Remix Architecture

  

**TR-4.1**: Use Remix loaders for server-side data fetching.

  

**TR-4.2**: Use Remix actions for form submissions and mutations.

  

**TR-4.3**: Use Zod for form validation and API input validation.

  

**TR-4.4**: Use Tailwind CSS + shadcn/ui for UI components.

  

**TR-4.5**: Dynamic routes use `/study/:unitId` pattern for unit-level pages.

  

**TR-4.6**: Practice components are organized in `/app/components/practices/` directory.

  

**TR-4.7**: Shared UI components (Peek modal, Timer, etc.) are in `/app/components/ui/`.

  

### 4.5 Performance & Scalability

  

**TR-5.1**: Use Prisma connection pooling for serverless environments (DATABASE_URL with pooling).

  

**TR-5.2**: Use direct connection for migrations (DIRECT_URL without pooling).

  

**TR-5.3**: Limit JSONB queries to fetching entire PrepUnit records (no partial JSONB queries).

  

**TR-5.4**: Index foreign keys (student_id, unit_id, batch_id) for fast lookups.

  

**TR-5.5**: Use Remix's built-in caching for static content (essay text, practice definitions).

  

### 4.6 Security

  

**TR-6.1**: Use Arcjet for rate limiting on all public routes.

  

**TR-6.2**: Use Arcjet for bot detection on authentication routes.

  

**TR-6.3**: Use Arcjet for XSS/SQLi protection on all form inputs.

  

**TR-6.4**: Sanitize all user-generated content (essay text) before displaying in Educator Console.

  

**TR-6.5**: Use HTTPS only in production (enforce via Vercel deployment settings).

  

---

  

## 5. Non-Functional Requirements

  

**NFR-1**: The School must handle 100 concurrent students without performance degradation.

  

**NFR-2**: Page load time for dashboard must be under 2 seconds on 3G connection.

  

**NFR-3**: Practice transitions (next question, next practice) must feel instant (under 200ms).

  

**NFR-4**: Timer accuracy must be within 1 second over a 40-minute period.

  

**NFR-5**: Data ingestion must complete for 100 prep-units in under 5 minutes.

  

**NFR-6**: The system must be accessible (WCAG 2.1 AA compliance for keyboard navigation and screen readers).

  

**NFR-7**: The system must work on desktop browsers (Chrome, Firefox, Safari, Edge) and tablet devices (iPad).

  

**NFR-8**: Mobile phone support is not required for MVP.

  

---

  

## 6. Out of Scope (MVP)

  

**OOS-1**: Real-time collaboration or live teacher feedback during practice.

  

**OOS-2**: AI-powered grading or feedback generation.

  

**OOS-3**: Spaced repetition scheduling or adaptive difficulty.

  

**OOS-4**: Multi-language support (English only for MVP).

  

**OOS-5**: B2B features (center management, bulk student import).

  

**OOS-6**: Other IELTS tasks (Reading, Listening, Speaking, Writing Task 1).

  

**OOS-7**: Mobile native apps (iOS, Android).

  

**OOS-8**: Offline mode or progressive web app features.

  

**OOS-9**: Student-to-student interaction (forums, peer review).

  

**OOS-10**: Payment processing or subscription management.

  

---

  

## 7. Dependencies & Blockers

  

**✅ DEP-1 RESOLVED**: Lab P2 pipeline rebuilt — outputs tier_sequences, qbank_unlocks, direction_ref (completed 2026-03-12)

  

**✅ DEP-2 RESOLVED**: Lab P3 pipeline rebuilt — assembles prep_unit rows with JSONB sentences + practices (completed 2026-03-12)

  

**✅ DEP-3 RESOLVED**: Lab produced finalized data contract with TypeScript interfaces + Zod validators (completed 2026-03-12)

  

**✅ DEP-4 RESOLVED**: `LAB-SCHOOL-CONTRACT.md` created with complete TypeScript interfaces and Zod validators (completed 2026-03-12)

  

**🟢 ALL BLOCKERS CLEARED**: School implementation can now begin with F01 (Database schema)

  

---

  

## 8. Success Metrics

  

**SM-1**: 10 pilot students complete at least 5 units each within 2 weeks of launch.

  

**SM-2**: Teachers report that Artifact 1 vs Artifact 2 comparison is useful for assessing learning.

  

**SM-3**: Average time per unit is between 2-4 hours (indicates appropriate difficulty).

  

**SM-4**: Less than 5% of practice items result in forced advance (indicates content quality).

  

**SM-5**: Students use Question Bank for an average of 3+ free practice essays after path completion.

  

**SM-6**: Zero data loss incidents (all student work is saved correctly).

  

**SM-7**: Zero authentication/authorization bugs (students cannot access other students' data).

  

---

  

## 9. Open Questions

  

**OQ-1**: Should the ingestion script support incremental updates (new batch_id without deleting old data) or full replacement? (Current answer: incremental updates with new batch_id)

  

**OQ-2**: How should the system handle students who are mid-path when a new batch_id is released? (Current answer: they stay on old batch forever)

  

**OQ-3**: Should teachers be able to see in-progress units (P0 submitted but unit not complete) or only completed units? (Current answer: yes — AC-5.6 confirms Artifact 1 is visible immediately after P0 submit, before unit completion)

  

**OQ-4**: Should the Question Bank show attempt count for attempted questions? (Current answer: yes, if query is cheap)

  

**OQ-5**: Should the system track which specific V2 distractors were shown to a student for debugging purposes? (Current answer: no)

  

**OQ-6**: For L2F (no pass/fail practice), should a StudentAttempt record be created for time tracking purposes even though output is discarded? (Current answer: yes — create record with `practice_code: 'L2F'`, `artifact_type: null`, and timestamps for time tracking in Educator Console)

  

---

  

## 10. References

  

- **Dev Brief**: `_kaleido-MVP-dev-brief.md` — system architecture, data contract, tech stack

- **UX Spec**: `_kaleido-school-ux-spec.md` — student behavior, interaction rules, practice mechanics

- **Features List**: `features.json` — 15 features (F00-F15) with test commands

- **Master HANDOFF**: `HANDOFF.md` — project state, blockers, SSOT hierarchy

- **School HANDOFF**: `kaleido-school-mvp/HANDOFF.md` — session log, completed work

- **Lab HANDOFF**: `kaleido-lab-mvp/HANDOFF.md` — pipeline status, data schema decisions

  

---

  

## 11. Next Steps

  

1. **Wait for Lab P2/P3 rebuild** — monitor `kaleido-lab-mvp/HANDOFF.md` for completion status

2. **Review finalized data.json** — validate structure matches Dev Brief §5.2

3. **Create design document** — detailed component architecture, data flow diagrams, API contracts

4. **Break into implementation tasks** — one task per acceptance criterion, organized by phase

5. **Begin F01 (Database schema)** — first concrete implementation step