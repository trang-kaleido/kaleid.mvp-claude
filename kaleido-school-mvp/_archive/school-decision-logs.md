# School — Decision Logs

*Design Session · Feb 2026 · School MVP architecture, data flow, practice design*

---

## Naming Convention (locked)

| Code | Meaning |
|---|---|
| L1 | Lexical (word/phrase level — lowest unit) |
| L2 | Sentence |
| L3 | Paragraph |
| L4 | Essay (whole-essay level — highest unit) |
| M | MCQ (Multiple Choice) |
| S | Scramble |
| F | Fill Blank |
| W | Write |

Practice names combine level + tool: e.g. `L4M` = Essay-level MCQ, `L1F` = Lexical Fill.

---

## Framework & Stack (locked)

| Layer | Decision |
|---|---|
| Framework | **Remix** (App Router pattern, file-based routing) |
| Server data | **Remix native loaders + actions** — no tRPC |
| Database | PostgreSQL (Supabase/Neon/Vercel Postgres) |
| ORM | Prisma |
| Validation | Zod |
| Auth | Better Auth (email/password + OAuth, self-hosted) |
| UI | Tailwind CSS + shadcn/ui |
| Security | Arcjet |
| AI (grading) | **None for MVP** — Lab precomputes all grading data |
| Deployment | Vercel |

**Dropped:** tRPC — incompatible with Remix's native data pattern; would create two competing server-side data systems.
**Dropped:** Next.js — Remix chosen for its opinionated server-first, forms-first model which reduces surface area for AI coding mistakes.

---

## Practice Sequence (locked)

**13 steps per prep-unit:** P0 (cold L4W) + 12 practices.

Practice order is fixed: `P0 → Understanding → L4M → L3M → L2M → L1M → L1S → L2S → L3S → L4S → L1F → L2W → L3W → L4W`

MCQ direction: top-down (L4→L1). Scramble direction: bottom-up (L1→L4).

---

## Write Activities (locked)

| Practice | What student does | Output |
|---|---|---|
| L2W | Rewrite target sentences from memory (paragraph shown, one sentence blanked) | Session state only — discarded after L3W |
| L3W | Write paragraph from memory without L2W scaffold visible | Assembled into reconstructed essay → Artifact 2 |
| L4W | Write a new essay on the challenge question | Artifact 3 → sent to teacher, gates unit completion |

Teacher receives per completed unit: Artifact 1 (P0 cold essay), Artifact 2 (L3W reconstructed essay), Artifact 3 (L4W challenge essay).

L3W depends on L2W: L2W sentences become the collapsible reference panel in L3W. Only L3W output stored to DB. L2W individual outputs used as scaffold, then discarded.

---

## Fill Activities (locked)

- Only `L1F` (lexical level) — fill at paragraph/sentence/essay level not pedagogically meaningful
- **Grading: deterministic, no AI inference**
- Lab precomputes `accepted_answers: string[]` for each blank — all valid variations
- School does case-insensitive string match against the accepted array
- No word bank — POS hints only

---

## Retry Logic (locked)

- Max 3 versions (V1, V2, V3) per practice — each a different angle on the same concept
- After 3 failures: **advance anyway**, record `failed_advanced: true`
- `failed_advanced` is the signal for future Educator Console intervention
- Auto-retry (no "Try again" button) — retrying is the default until pass or 3rd failure
- MCQ retry: different distractors. Scramble/Fill retry: same content.

---

## Onboarding (locked)

Practice 0 (L4W cold essay before seeing the model) replaces the mock test concept. Delivers the before/after signal the teacher needs. Added as first step of every unit.

Student flow: enter exam date + study hours → system calculates tier → enter teacher code → path assigned + content_version locked → Unit 1 unlocked.

---

## Educator Console (locked — MVP: read-only)

Scale: 200 pilot students, multiple teachers → email not viable → EC required.

MVP scope: read-only. Teacher auth, assigned student list, per-student artifact view, time/pass signals. No in-app feedback, no rubric, no response mechanism.

Submission flow: student submits L4W → unit marked complete → all artifacts visible in EC immediately. EC is informational, not a learning-loop gate.

Teacher-student assignment: student enters teacher code at onboarding.

---

## Time Tracking (locked)

Every `StudentAttempt` stores `started_at` + `completed_at`. Time per activity is the key analytical signal. No `timer_exceeded` flag — EC receives total time only.

**Peek tracking:** `peek_count` stored per attempt (per practice, not per question — but 1 peek per question rule enforced in UI).

---

## Peek Rules (locked)

- 1 peek per question (resets per question)
- A "peek" = opening the essay modal during an active question
- Peek NOT available during Fill (essay partially revealed — peek defeats the task)
- Peek NOT available during Write (essay not a valid cue at generation stage)

---

## Session Model (locked) — One Sit Per Part

| Part | Sit requirement |
|---|---|
| P0 | Must complete before navigating away |
| Part 1 Understanding | Flexible — student may leave and return |
| Part 2 Encoding (9 practices) | One sit — no mid-encoding save |
| Part 3 Applying (L2W→L3W→L4W) | One sit — L2W session state would be lost otherwise |

DB saves at part boundaries only. On return: resume at start of next incomplete part. No mid-practice state ever stored.

---

## Data Responsibility Split (locked)

**School defines the schema** (what shape of data it needs). **Lab implements to that schema** (selects content, generates practice items, structures output). **Lab owns content decisions** (which items to include, how to pair questions, what accepted answers to precompute) within the School's structure.

---

## Data Contract (locked) — What School Needs from Lab Per Prep-Unit

**Top-level fields:**
- `essay`: object keyed by paragraph (intro/body1/body2/conclusion), then by rhetoric tag
- `lexical_items`: per-paragraph array of `{ phrase, pos }`
- `syntax_patterns`: array of `{ tag, pattern, example }`
- `practices`: array of 12 fully pre-generated practice items

**Per practice item by tool type:**

| Tool | Required fields |
|---|---|
| MCQ | `questions[]` each with `prompt`, `options[]` (text + correct flag), `feedback` |
| Scramble (sentence) | `questions[]` each with `items[]` (id + text), `correctOrder[]`, `feedback`, `hint` |
| Scramble (word bank) | `questions[]` each with `prompt`, `wordBank[]`, `blanks[]` (correct answers), `feedback`, `hint` |
| Fill (L1F) | `sections[]` → `prompts[]` each with `text` (with __ blanks), `hints[]` (POS), `answers[]` |
| Write | `questions[]` each with `paragraph[]` (sentences + `isBlank`), `tag`, `syntaxHint`, `placeholder` |

---

## Data Storage — Minimum Fields (locked)

**`StudentAttempt`:**
`student_id`, `unit_id`, `practice_code` (e.g. "L4M"), `version` (1/2/3), `tool`, `level`, `response` (raw), `pass` (bool), `failed_advanced` (bool), `peek_count` (int), `started_at`, `completed_at`

**`StudentPath`:**
`student_id`, `content_version` (Lab's `batch_id` — locked at assignment), `unit_count` (50/100), `target_band`, `exam_date`, `created_at`

**`StudentUnitProgress`:**
`student_id`, `unit_id`, `status` (locked/in_progress/complete), `current_practice_code`, `unlocked_at`, `completed_at`

---

## MCQ Pass Threshold (locked)

100% for all tools. Binary: pass or retry. No partial credit. Advancing with known gaps is worse than retrying at a different angle.

---

## Scramble Interaction (locked)

- L1S, L2S (word/phrase level): click-to-place word bank — simple, mobile-friendly
- L3S, L4S (sentence/essay level): drag-to-order stacked cards — appropriate for full-sentence length items

---

## PoV Deep-Dive Links (locked)

Format: `kaleido.io/blog/[direction-slug]`. Opens in new tab. Kaleido-hosted static blog posts, published before School launch.

---

## Version Isolation (locked)

Active students locked to `content_version` assigned at onboarding. New Lab output (`batch_id`) only applies to new students. No mid-path content updates. Content is immutable once assigned. Student attempts are append-only.
