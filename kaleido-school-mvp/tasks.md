# Kaleido School Implementation — Tasks

  

**Feature Name**: school-implementation

**Version**: 1.0

**Created**: 2026-03-12

**Status**: Ready for Implementation

  

---

  

## Task Organization

  

Tasks are organized by implementation phase, matching the requirements document structure. Each task maps to one or more acceptance criteria in specs.md

  

**Phases**:

1. Infrastructure & Data Ingestion (AC-1.x)

2. Student Onboarding & Pathing (AC-2.x)

3. Practice Engine (AC-3.x)

4. Unit Completion & Question Bank (AC-4.x)

5. Educator Console (AC-5.x)

  

---

  

## Phase 1: Infrastructure & Data Ingestion

  

### 1. Database Schema Setup

  

- [x] 1.1 Create Prisma schema with all 8 models (PrepUnit, DirectionRef, TierUnitSequence, QBankUnlocks, Teacher, StudentPath, StudentUnitProgress, StudentAttempt)

- [x] 1.1.1 Define PrepUnit model with unitId as primary key (no extra id field)

- [x] 1.1.2 Define DirectionRef model

- [x] 1.1.3 Define TierUnitSequence model with composite unique constraints

- [x] 1.1.4 Define QBankUnlocks model

- [x] 1.1.5 Define Teacher model with clerkUserId unique constraint

- [x] 1.1.6 Define StudentPath model

- [x] 1.1.7 Define StudentUnitProgress model

- [x] 1.1.8 Define StudentAttempt model

- [x] 1.1.9 Define all enums (Tier, UnitStatus, CurrentPhase, ArtifactType)

  

- [x] 1.2 Add database indexes for performance

- [x] 1.2.1 Create index on tier_unit_sequence(batch_id, tier)

- [x] 1.2.2 Create index on qbank_unlocks(batch_id, tier)

- [x] 1.2.3 Create index on student_unit_progress(student_id)

- [x] 1.2.4 Create index on student_attempt(student_id)

- [x] 1.2.5 Create index on student_attempt(unit_id)

  

- [x] 1.3 Validate schema and create initial migration

- [x] 1.3.1 Run `npx prisma validate` (AC-1.8)

- [x] 1.3.2 Run `npx prisma db push` (used instead of migrate dev per F01 bug fix log)

- [x] 1.3.3 Verify migration creates all tables correctly (db already in sync)

  

### 2. Data Ingestion Script

  

- [x] 2.1 Create ingestion script structure

- [x] 2.1.1 Create `scripts/ingest.ts` file

- [x] 2.1.2 Set up Prisma client import (with @prisma/adapter-pg driver adapter — required by Prisma 7)

- [x] 2.1.3 Add CLI argument parsing for data.json path

- [x] 2.1.4 Add environment variable support for data path (DIRECT_URL)



- [x] 2.2 Implement data validation

- [x] 2.2.1 Create Zod schema for Lab output validation

- [x] 2.2.2 Validate batch_id exists

- [x] 2.2.3 Validate all 4 arrays exist (prep_units, tier_sequences, qbank_unlocks, direction_ref)

- [x] 2.2.4 Add error handling for malformed JSON




- [x] 2.3 Implement atomic transaction ingestion (AC-1.4, AC-1.6)

- [x] 2.3.1 Wrap all writes in Prisma transaction

- [x] 2.3.2 Upsert direction_ref by direction_id

- [x] 2.3.3 Upsert prep_units by unit_id (AC-1.5)

- [x] 2.3.4 Delete old tier_sequences for batch_id, insert new

- [x] 2.3.5 Delete old qbank_unlocks for batch_id, insert new

- [x] 2.3.6 Add field mapping layer (snake_case to camelCase)



- [x] 2.4 Add logging and error handling

- [x] 2.4.1 Log progress for each table insert

- [x] 2.4.2 Log final counts (X prep_units, Y tier_sequences, etc.)

- [x] 2.4.3 Handle transaction rollback on error

- [x] 2.4.4 Add success confirmation message



- [x] 2.5 Create npm script and test ingestion

- [x] 2.5.1 Add `"ingest": "tsx scripts/ingest.ts"` to package.json

- [ ] 2.5.2 Test with sample data.json — DEFERRED: the real Lab output was already ingested into Supabase in a prior session (2026-03-12) — the local data.json is just a stale partial backup; blocked on Lab pipeline re-run

- [ ] 2.5.3 Verify idempotency (run twice, check no duplicates) — blocked by same issue as 2.5.2

- [x] 2.5.4 Fix `app/lib/prisma.server.ts` adapter (Debt 2, DATABASE_URL) — added Pool + PrismaPg adapter; uses DATABASE_URL (port 6543 PgBouncer) not DIRECT_URL

  

### 3. Environment Configuration

  

- [x] 3.1 Set up environment variables (AC-1.7)

- [x] 3.1.1 Add DATABASE_URL (pooled connection)

- [x] 3.1.2 Add DIRECT_URL (direct connection for migrations)

- [x] 3.1.3 Add CLERK_PUBLISHABLE_KEY

- [x] 3.1.4 Add CLERK_SECRET_KEY

- [ ] 3.1.5 Add CLERK_WEBHOOK_SECRET

- [ ] 3.1.6 Add ARCJET_KEY

- [ ] 3.1.7 Create .env.example with all required variables

  

---

  

## Phase 2: Student Onboarding & Pathing

  

### 4. Authentication Setup

  

- [x] 4.1 Configure Clerk integration

- [x] 4.1.1 Install @clerk/remix package

- [x] 4.1.2 Set up Clerk provider in root.tsx

- [x] 4.1.3 Create sign-in route

- [x] 4.1.4 Create sign-up route




- [x] 4.2 Create auth helper functions

- [x] 4.2.1 Implement requireStudent() in app/lib/auth.server.ts

- [x] 4.2.2 Implement requireTeacher() in app/lib/auth.server.ts

- [x] 4.2.3 Add role checking logic (Clerk metadata)



- [x] 4.3 Set up Clerk webhook

- [x] 4.3.1 Create POST /api/webhooks/clerk route

- [x] 4.3.2 Implement webhook signature verification

- [x] 4.3.3 Handle user.created event

- [x] 4.3.4 Handle user.updated event

  

### 5. Onboarding Flow (AC-2.1 - AC-2.6)

  

- [x] 5.1 Create tier selection route

- [x] 5.1.1 Create /onboarding/tier route

- [x] 5.1.2 Add loader with duplicate path guard

- [x] 5.1.3 Create UI with 2 tier options (50 units, 80 units)

- [x] 5.1.4 Tier passed to screen 2 via URL param (?tier=tier_50) — simpler than cookie, same result

- [x] 5.1.5 Add Zod validation for tier selection



- [x] 5.2 Create teacher code entry route

- [x] 5.2.1 Create /onboarding/teacher-code route

- [x] 5.2.2 Add loader with duplicate path guard

- [x] 5.2.3 Create UI with teacher code input (required field)

- [x] 5.2.4 Tier read from URL param (loader reads ?tier= and embeds as hidden form field)

- [x] 5.2.5 Query TierUnitSequence to get current batch_id — lock this to StudentPath permanently (AC-2.4)

- [x] 5.2.6 Wrap steps 5.2.7–5.2.9 in a single Prisma $transaction() — if any write fails, all roll back (prevents orphaned StudentPath with no units)

- [x] 5.2.7 Create StudentPath inside transaction (clerkUserId, tier, batch_id, teacher_code, currentSequencePosition: 1)

- [x] 5.2.8 Create all StudentUnitProgress rows inside same transaction (query TierUnitSequence filtered by batch_id + tier to get ordered unit_ids)

- [x] 5.2.9 Set first unit to status: 'in_progress' + current_phase: 'p0'; set all others to status: 'locked' (current_phase not set for locked units)

- [x] 5.2.10 Add Zod validation for teacher code format

- [x] 5.2.11 Validate teacher code exists in Teacher table (database lookup)

- [x] 5.2.12 Show inline error message on form if teacher code is not found (do not redirect)



- [x] 5.3 Create onboarding complete route

- [x] 5.3.1 Create /onboarding/complete route

- [x] 5.3.2 Display confirmation message

- [x] 5.3.3 Add "Go to Dashboard" button

  

### 6. Dashboard (AC-2.7 - AC-2.9)

  

- [x] 6.1 Create dashboard route

- [x] 6.1.1 Create /dashboard route

- [x] 6.1.2 Implement loader to fetch StudentPath and progress

- [x] 6.1.3 Redirect to onboarding if no path exists

- [x] 6.1.4 Fetch tier sequence and prep units

- [x] 6.1.5 Optimize query with Prisma select (only needed fields)




- [x] 6.2 Create dashboard UI components

- [x] 6.2.1 Create UnitList component

- [x] 6.2.2 Create UnitCard component with status indicators

- [x] 6.2.3 Implement locked unit styling (not clickable)

- [x] 6.2.4 Implement in-progress unit styling (clickable)

- [x] 6.2.5 Implement complete unit styling

- [x] 6.2.6 Create QuestionBankEntry component

  

---

  

## Phase 3: Practice Engine (P0, P1, P2)

  

### 7. Business Logic Services

  

**Note**: These services must be created first as they are used by P0, P1, and P2 implementations.

  

- [x] 7.1 Create GradingService

- [x] 7.1.1 Implement gradeMCQ(selectedIndex, correctIndex)

- [x] 7.1.2 Implement gradeScramble(arrangement, correctOrder)

- [x] 7.1.3 Implement gradeFillBlanks(userAnswers, correctAnswers)

- [x] 7.1.4 Add case-insensitive matching for fill blanks



- [x] 7.2 Create PhaseTransitionService

- [x] 7.2.1 Implement completeP0(studentId, unitId, essayText)

- [x] 7.2.2 Implement completeP1(studentId, unitId)

- [x] 7.2.3 Implement completeP2(studentId, unitId, essayText)

- [x] 7.2.4 Use Prisma transactions for atomic updates

  

  

### 8. Study Unit Route & Phase Routing (AC-3.1)

  

- [x] 7.1 Create study unit route (duplicate of 8.1 — implemented as /unit/:unitId per dashboard.tsx)

- [x] 7.1.1 Create /unit/:unitId route (NOTE: was /study/:unitId — see 8.1.1)

- [x] 7.1.2 Implement loader to fetch unit progress and prep unit

- [x] 7.1.3 Redirect to dashboard if unit is locked

- [x] 7.1.4 Determine current phase (p0, p1, p2)

- [x] 7.1.5 Route to correct phase component

  

- [x] 8.1 Create study unit route

- [x] 8.1.1 Create /unit/:unitId route (NOTE: was /study/:unitId — updated to match dashboard.tsx link)

- [x] 8.1.2 Implement loader to fetch unit progress and prep unit

- [x] 8.1.3 Redirect to dashboard if unit is locked

- [x] 8.1.4 Determine current phase (p0, p1, p2)

- [x] 8.1.5 Route to correct phase component

  

### 9. Timer Components

  

- [x] 9.1 Create CountdownTimer component (AC-3.3, AC-3.4)

- [x] 9.1.1 Implement countdown from specified minutes

- [x] 9.1.2 Freeze at 0:00 (no negative values)

- [x] 9.1.3 NO pause button (runs continuously)

- [x] 9.1.4 Call onExpire callback when timer reaches 0

- [x] 9.1.5 Display in MM:SS format

  

- [x] 9.2 Create StopwatchTimer component (AC-3.8)

- [x] 9.2.1 Implement count up from 0:00

- [x] 9.2.2 Add pause/resume functionality

- [x] 9.2.3 Display in MM:SS format

- [x] 9.2.4 Track elapsed time for submission

  

### 10. Phase P0: Cold Write (AC-3.2 - AC-3.6)

  

- [x] 9.1 Create P0 route and UI

- [x] 9.1.1 Create /unit/:unitId/p0 route (NOTE: was /study/:unitId/p0 — updated to match dashboard.tsx)

- [x] 9.1.2 Display IELTS question from PrepUnit

- [x] 9.1.3 Add essay text editor (textarea)

- [x] 9.1.4 Add CountdownTimer (40 minutes)

- [x] 9.1.5 Add submit button (enabled even after timer expires)




- [x] 9.2 Implement P0 submit action (AC-3.5, AC-3.6)

- [x] 9.2.1 Create action to handle P0 submission

- [x] 9.2.2 Validate essay text (min 100 characters)

- [x] 9.2.3 Create StudentAttempt with artifact_type: 'artifact_1'

- [x] 9.2.4 Update StudentUnitProgress.current_phase to 'p1'

- [x] 9.2.5 Use PhaseTransitionService.completeP0()

- [x] 9.2.6 Redirect to /unit/:unitId/p1 (NOTE: was /study/:unitId/p1)

  

### 10. Phase P1: Encoding Practices (AC-3.7 - AC-3.20)

  

- [x] 11.1 Create P1 route structure

- [x] 11.1.1 Create /unit/:unitId/p1 route

- [x] 11.1.2 Load 10 practices from PrepUnit.practices JSONB

- [x] 11.1.3 Add StopwatchTimer component

- [x] 11.1.4 Add Peek button



- [x] 11.2 Create PracticeRenderer orchestrator component (AC-3.19)

- [x] 11.2.1 Manage current practice index (0-9)

- [x] 11.2.2 Track completed practices

- [x] 11.2.3 Display progress indicator ("Practice X of 10")

- [x] 11.2.4 Route to correct practice component by practice_code

- [x] 11.2.5 Handle practice completion callback

- [x] 11.2.6 Trigger PhaseTransitionService.completeP1() after practice #10



- [x] 11.3 Create MCQPractice component (AC-3.11, AC-3.12)

- [x] 11.3.1 Display question prompt and 5 options

- [x] 11.3.2 Handle answer selection

- [x] 11.3.3 Implement grading logic (compare to correct_index)

- [x] 11.3.4 Show red X on wrong answer (no correct answer revealed)

- [x] 11.3.5 Implement retry cycle: V1 → V2 → V1

- [x] 11.3.6 Track attempt count per question

- [x] 11.3.7 Show "Continue →" after 3 failures (AC-3.16)

- [x] 11.3.8 Show "Next →" on correct answer (AC-3.18)

- [x] 11.3.9 Create StudentAttempt records for each attempt

- [x] 11.3.10 Set failed_advanced: true on forced advance (AC-3.17)

  

- [x] 11.4 Create ScramblePractice component (AC-3.11, AC-3.13)

- [x] 10.4.1 Implement for L1S/L2S (click-to-place word bank)

- [x] 10.4.2 Implement for L3S/L4S (drag-to-order sentences/paragraphs)

- [x] 10.4.3 Handle arrangement submission

- [x] 10.4.4 Implement grading logic (compare to correct order)

- [x] 10.4.5 Show red X on wrong arrangement

- [x] 10.4.6 Implement retry cycle: V1 → V2 → V1

- [x] 10.4.7 Track attempt count

- [x] 10.4.8 Handle forced advance after 3 failures

- [x] 10.4.9 Create StudentAttempt records

  
  

- [x] 10.5 Create FillPractice component for L1F (AC-3.11, AC-3.14)

- [x] 11.5.1 Display context sentences with blanks

- [x] 11.5.2 Show POS hints below each blank

- [x] 11.5.3 Show similar_phrases below each blank

- [x] 11.5.4 Handle blank input

- [x] 11.5.5 Implement grading logic (case-insensitive match)

- [x] 11.5.6 Show red X on specific incorrect blanks

- [x] 11.5.7 Implement retry cycle: V1 → V2 → V1

- [x] 11.5.8 Track attempt count per section

- [x] 11.5.9 Handle forced advance after 3 failures

- [x] 11.5.10 Create StudentAttempt records

  

- [x] 11.6 Create SentFillPractice component for L2F (AC-3.11, AC-3.15)

- [x] 11.6.1 Display context sentences with blanks

- [x] 11.6.2 Show hint_sentences (NOT similar_phrases)

- [x] 11.6.3 Handle blank input

- [x] 11.6.4 NO grading logic (always advances)

- [x] 11.6.5 NO retry logic

- [x] 11.6.6 NO pass/fail indicators

- [x] 11.6.7 Create StudentAttempt with version: null, pass: null, artifact_type: null

- [x] 11.6.8 Track time for Educator Console

  

- [x] 11.7 Create Peek Modal (AC-3.9, AC-3.10)

- [x] 11.7.1 Create PeekModal component

- [x] 11.7.2 Display model essay with color-coded lexical items

- [x] 11.7.3 Color-code: noun phrases (emerald + semibold), verbs (red), adverbs (blue)

- [x] 11.7.4 Add rhetoric tag tooltips on sentence hover

- [x] 11.7.5 Display PoV cards

- [x] 11.7.6 Display lexical items panel

- [x] 11.7.7 Make available throughout all 10 P1 practices

- [x] 11.7.8 No rate limit on peek usage

  

- [x] 11.8 Implement P1 completion (AC-3.20)

- [x] 11.8.1 Detect when all 10 practices complete

- [x] 11.8.2 Call PhaseTransitionService.completeP1()

- [x] 11.8.3 Update StudentUnitProgress.current_phase to 'p2'

- [x] 11.8.4 Redirect to /study/:unitId/p2

  

### 12. Phase P2: L4W Essay Write (AC-3.21 - AC-3.25)

  

- [x] 11.1 Create P2 route and UI

- [x] 11.1.1 Create /study/:unitId/p2 route

- [x] 11.1.2 Display same IELTS question as P0

- [x] 11.1.3 Add essay text editor

- [x] 11.1.4 Add CountdownTimer (40 minutes)

- [x] 11.1.5 Add collapsible lexical items panel

- [x] 11.1.6 Add collapsible syntax patterns panel

- [x] 11.1.7 NO Peek button (AC-3.22)

  
  

- [x] 11.2 Implement P2 submit action (AC-3.23 - AC-3.25)

- [x] 11.2.1 Create action to handle L4W submission

- [x] 11.2.2 Validate essay text (min 100 characters)

- [x] 11.2.3 Create StudentAttempt with artifact_type: 'artifact_2'

- [x] 11.2.4 Update StudentUnitProgress.status to 'complete'

- [x] 11.2.5 Set StudentUnitProgress.completed_at

- [x] 11.2.6 Unlock next unit (update status to 'in_progress')

- [x] 11.2.7 Increment StudentPath.current_sequence_position

- [x] 11.2.8 Use PhaseTransitionService.completeP2()

- [x] 11.2.9 Redirect to /unit-complete/:unitId

  
## Phase 4: Unit Completion & Question Bank

  

### 13. Unit Complete Screen (AC-4.1 - AC-4.3)

  

- [x] 13.1 Create unit complete route

- [x] 13.1.1 Create /unit-complete/:unitId route

- [x] 13.1.2 Query QBankUnlocks for newly unlocked questions

- [x] 13.1.3 Display list of unlocked questions

- [x] 13.1.4 Add "Go to Question Bank" button

- [x] 13.1.5 Add "Next Unit →" button

  

### 14. Path Complete Screen (AC-4.4 - AC-4.7)

  

- [x] 14.1 Create path complete route

- [x] 14.1.1 Create /path-complete route

- [x] 14.1.2 Display completion acknowledgment

- [x] 14.1.3 Mention Question Bank remains open

- [x] 14.1.4 Add "Go to Question Bank" button

- [x] 14.1.5 Add "Back to Dashboard" button

  
  

### 15. Question Bank (AC-4.8 - AC-4.15)

  

- [x] 15.1 Create Question Bank home route (AC-4.8, AC-4.9)

- [x] 15.1.1 Create /question-bank/index route

- [x] 15.1.2 Implement loader to fetch all QB questions for tier

- [x] 15.1.3 Calculate attempt counts per question

- [x] 15.1.4 Determine question states (attempted/unlocked/locked)

- [x] 15.1.5 Handle path-complete students (use tier total as effective position)

- [x] 15.1.6 Truncate locked question text to ~8 words + "…"

- [x] 15.1.7 Display questions grouped by state



- [x] 15.2 Create Question Bank write route (AC-4.10 - AC-4.14)

- [x] 15.2.1 Create /question-bank/:questionId route

- [x] 15.2.2 Display question text

- [x] 15.2.3 Add essay text editor

- [x] 15.2.4 Add CountdownTimer (40 minutes)

- [x] 15.2.5 NO peek button, NO scaffold, NO hints

- [x] 15.2.6 Implement submit action

- [x] 15.2.7 Create StudentAttempt with artifact_type: 'free_practice'

- [x] 15.2.8 Set qbank_question_id, unit_id: null

- [x] 15.2.9 Allow multiple submissions on same question

- [x] 15.2.10 Redirect to QB home after submit

  

---

  

## Phase 5: Educator Console

  

### 16. Teacher Authentication & Setup

  <out of scope, intentionally left uncheck: teacher provisioning is manual (Clerk admin + direct DB row) for MVP>

- [ ] 16.1 Create teacher sign-up flow

- [ ] 16.1.1 Add teacher role option in sign-up

- [ ] 16.1.2 Generate unique teacher code on sign-up

- [ ] 16.1.3 Create Teacher record in database

- [ ] 16.1.4 Link to Clerk user via clerkUserId

  

### 17. Student List View (AC-5.1 - AC-5.3)

  

- [x] 17.1 Create educator students route

- [x] 17.1.1 Create /educator/students route

- [x] 17.1.2 Implement loader with requireTeacher()

- [x] 17.1.3 Query Teacher by clerkUserId (not id)

- [x] 17.1.4 Fetch students with matching teacher_code

- [x] 17.1.5 Calculate progress (completed units / total units)

- [x] 17.1.6 Display student list with progress indicators

  

### 18. Student Detail View (AC-5.4 - AC-5.12)

  

- [x] 18.1 Create educator student detail route

- [x] 18.1.1 Create /educator/:studentId route

- [x] 18.1.2 Fetch student path and unit progress

- [x] 18.1.3 Fetch all artifacts (artifact_1, artifact_2, free_practice)

- [x] 18.1.4 Group artifacts by unit



- [x] 18.2 Display artifacts (AC-5.5 - AC-5.8)

- [x] 18.2.1 Show Artifact 1 (P0) for in-progress and complete units

- [x] 18.2.2 Show Artifact 2 (L4W) for complete units only

- [x] 18.2.3 Display artifacts side-by-side for comparison

- [x] 18.2.4 Show Free Practice artifacts with numbering

- [x] 18.2.5 Display question text and date for each artifact



- [x] 18.3 Display practice signals (AC-5.9 - AC-5.12)

- [x] 18.3.1 Calculate time spent per practice

- [x] 18.3.2 Calculate total accumulated time per student

- [x] 18.3.3 Display pass/fail indicators per practice

- [x] 18.3.4 Highlight practices with failed_advanced: true

- [x] 18.3.5 Create SignalsPanel component



- [x] 18.4 Implement read-only constraints (AC-5.13, AC-5.14)

- [x] 18.4.1 No edit functionality on artifacts

- [x] 18.4.2 No annotation or reply features

- [x] 18.4.3 No unit lock/unlock controls

- [x] 18.4.4 No student progress modification

  

---

  

## Phase 6: Security & Performance

  

### 19. Security Implementation

  

- [ ] 19.1 Set up Arcjet

- [ ] 19.1.1 Install @arcjet/remix package

- [ ] 19.1.2 Configure rate limiting rules

- [ ] 19.1.3 Configure bot detection

- [ ] 19.1.4 Configure shield (XSS/SQLi protection)

- [ ] 19.1.5 Apply to all public routes

  

- [ ] 19.2 Input sanitization

- [ ] 19.2.1 Install DOMPurify

- [ ] 19.2.2 Create sanitizeEssay() function

- [ ] 19.2.3 Create sanitizeForDisplay() function

- [ ] 19.2.4 Apply to all user-generated content

  

- [ ] 19.3 Route protection

- [ ] 19.3.1 Apply requireStudent() to all student routes

- [ ] 19.3.2 Apply requireTeacher() to all educator routes

- [ ] 19.3.3 Verify student can only access own data

- [ ] 19.3.4 Verify teacher can only access own students

  

### 20. Performance Optimization

  

- [ ] 20.1 Database query optimization

- [ ] 20.1.1 Use Prisma select to limit fields

- [ ] 20.1.2 Add connection pooling configuration

- [ ] 20.1.3 Verify all indexes are created

- [ ] 20.1.4 Test query performance with sample data

  
  

- [ ] 20.2 Caching strategy

- [ ] 20.2.1 Add Cache-Control headers for PrepUnit data

- [ ] 20.2.2 Add Cache-Control headers for tier sequences

- [ ] 20.2.3 Add Cache-Control headers for QB unlocks

- [ ] 20.2.4 No cache for student progress data

  

---

  

## Phase 7: Testing & Validation

  

### 21. Unit Tests

  

- [ ] 21.1 Test GradingService

- [ ] 21.1.1 Test gradeMCQ with correct/incorrect answers

- [ ] 21.1.2 Test gradeScramble with correct/incorrect order

- [ ] 21.1.3 Test gradeFillBlanks with case-insensitive matching

- [ ] 21.1.4 Test gradeFillBlanks with partial correct answers

  

- [ ] 21.2 Test PhaseTransitionService

- [ ] 21.2.1 Test completeP0 creates artifact and updates phase

- [ ] 21.2.2 Test completeP1 updates phase to p2

- [ ] 21.2.3 Test completeP2 marks unit complete and unlocks next

- [ ] 21.2.4 Test completeP2 handles last unit (path complete)

  

### 22. Integration Tests

  

- [ ] 22.1 Test onboarding flow

- [ ] 22.1.1 Test tier selection → teacher code → path creation

- [ ] 22.1.2 Test duplicate path prevention

- [ ] 22.1.3 Test StudentUnitProgress creation for all units

  

- [ ] 22.2 Test practice flow

- [ ] 22.2.1 Test P0 → P1 → P2 progression

- [ ] 22.2.2 Test retry logic (V1 → V2 → V1)

- [ ] 22.2.3 Test forced advance after 3 failures

- [ ] 22.2.4 Test L2F always advances

  

- [ ] 22.3 Test Question Bank

- [ ] 22.3.1 Test question unlock after unit complete

- [ ] 22.3.2 Test multiple submissions on same question

- [ ] 22.3.3 Test path-complete students see all unlocked

  

- [ ] 22.4 Test Educator Console

- [ ] 22.4.1 Test teacher sees only own students

- [ ] 22.4.2 Test Artifact 1 visible after P0 submit

- [ ] 22.4.3 Test Artifact 2 visible after unit complete

- [ ] 22.4.4 Test time calculations

  

### 23. End-to-End Tests

  

- [ ] 23.1 Student completes full unit (P0 → P1 → P2)

- [ ] 23.2 Teacher views artifacts in EC

- [ ] 23.3 Student completes path and accesses QB

- [ ] 23.4 Retry logic with 3 failures

  
  
  

---

  

## Phase 8: Deployment & Documentation

  

### 24. Deployment Setup

  

- [ ] 24.1 Configure Vercel deployment

- [ ] 24.1.1 Create vercel.json configuration

- [ ] 24.1.2 Set up environment variables in Vercel

- [ ] 24.1.3 Configure build command

- [ ] 24.1.4 Configure regions (iad1)

  

- [ ] 24.2 Database setup

- [ ] 24.2.1 Create production database on Supabase

- [ ] 24.2.2 Run migrations on production

- [ ] 24.2.3 Verify connection pooling

- [ ] 24.2.4 Test direct connection for migrations

  

- [ ] 24.3 Clerk setup

- [ ] 24.3.1 Configure production Clerk instance

- [ ] 24.3.2 Set up webhook endpoint

- [ ] 24.3.3 Configure OAuth providers

- [ ] 24.3.4 Test authentication flow

  

### 25. Documentation

  

- [ ] 25.1 Create deployment guide

- [ ] 25.1.1 Document environment variables

- [ ] 25.1.2 Document database setup steps

- [ ] 25.1.3 Document Clerk configuration

- [ ] 25.1.4 Document ingestion script usage

  

- [ ] 25.2 Create user guides

- [ ] 25.2.1 Student onboarding guide

- [ ] 25.2.2 Practice mechanics guide

- [ ] 25.2.3 Teacher console guide

  

---

  

## Notes

  

- Tasks are organized by phase for logical progression

- Each task maps to specific acceptance criteria (AC-X.Y)

- Sub-tasks provide implementation details

- Mark tasks complete as you finish them: `- [x]`

- Some tasks have dependencies (e.g., auth must be set up before onboarding)

  

---

  

## Task Execution Order

  

Recommended execution order:

1. Phase 1 (Infrastructure) — Foundation

2. Phase 2 (Onboarding) — User entry point

3. Phase 3 (Practice Engine) — Core functionality

4. Phase 4 (Unit Completion & QB) — Extended functionality

5. Phase 5 (Educator Console) — Teacher features

6. Phase 6 (Security & Performance) — Production readiness

7. Phase 7 (Testing) — Quality assurance

8. Phase 8 (Deployment) — Launch