# Kaleido Migration Runbook
## New Supabase Project → School App Re-Point

Use this when: pointing the School app at a new Supabase database after re-running the Lab pipelines.

---

## Architecture Note

Lab pipelines and the School app share **the same Supabase project**:
- P2 writes `tier_unit_sequence`, `qbank_unlocks`, `direction_ref` directly to Supabase
- P3 writes `prep_unit` directly to Supabase
- **`ingest.ts` is NOT used** when Lab and School share the same project — skip it entirely
- `data.json` is a checkpoint/backup only, not the ingestion source

---

## ⚠️ MVP Limitation — Rerunning Pipelines Affects Already-Onboarded Students

**Known gap, accepted for MVP. Must be addressed before multi-cohort use.**

When pipelines are rerun for a new batch, already-onboarded students are **not isolated** from the changes. Specifically:

- `StudentPath.batch_id` is locked at onboarding and correctly tracks which batch a student is on.
- `TierUnitSequence` rows are written per `batch_id` — old batch rows survive when a new batch is written, so student sequence progression is safe.
- **However**, `prep_unit` rows are upserted in-place on `unit_id`. If the new batch reuses the same `unit_id`s with updated content (`question`, `sentences`, `practices`), existing students will silently see the new content even though their progress history was built on the old content.

**Practical consequence:** If any student has started or completed a unit, rerunning P3 (or the full pipeline) will change the content under them mid-progress. Their `StudentAttempt` records will reflect answers to old content that no longer matches what `prep_unit` now shows.

**Safe rerun conditions (MVP):**
- Run pipelines only before any students have been onboarded, OR
- Coordinate with the school to confirm no students have active progress on the affected batch.

**Future fix (post-MVP):** Version `prep_unit` content per batch — store `(unit_id, batch_id)` as a composite key, and have students read content through their `batch_id` rather than `unit_id` alone. This would give full isolation between cohorts.

---

## Step 1 — Re-run Pipeline 2 (Colab)

1. Open `kaleido-lab-mvp/lab-mvp-data-pipelines/pipeline_2_v4.ipynb` in Colab
2. In **Cell 2 (`cell-creds`)**: update `SUPABASE_URL` and `SUPABASE_KEY` to the new project
3. Run all cells top to bottom
4. Check **Cell 37 (`cell-verify`)** — all checks must pass ✅
5. Spot-check: model essays should have MORE directions (richest selection, not purest)

---

## Step 2 — Re-run Pipeline 3 (local)

1. Open `kaleido-lab-mvp/lab-mvp-data-pipelines/pipeline_3_v4.ipynb` locally
2. Ensure it points to the new Supabase (update credentials if needed)
3. Run all cells — `prep_unit` table is written to the new Supabase
4. `data.json` is saved to `kaleido-lab-mvp/outputs/data.json` (backup only)

After Steps 1 & 2: all 4 Lab tables (`prep_unit`, `tier_unit_sequence`, `qbank_unlocks`, `direction_ref`) are populated in the new Supabase.

---

## Step 3 — Create `prisma` user on new Supabase

In **Supabase → SQL Editor**, run:

```sql
create user "prisma" with password '<password>' bypassrls createdb;
grant "prisma" to "postgres";
grant usage on schema public to prisma;
grant create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;
alter default privileges for role postgres in schema public grant all on tables to prisma;
alter default privileges for role postgres in schema public grant all on routines to prisma;
alter default privileges for role postgres in schema public grant all on sequences to prisma;
```

Choose a password and keep it — you'll use it in the `.env`.

---

## Step 4 — Update `.env`

In `kaleido-school-mvp/.env`, replace the two database lines:

```env
DATABASE_URL="postgresql://prisma.<NEW-REF>:<password>@<host>:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://prisma.<NEW-REF>:<password>@<host>:5432/postgres"
```

Get connection strings from: **Supabase → Connect → Supavisor**
- Transaction mode (port 6543) → `DATABASE_URL`
- Session mode (port 5432) → `DIRECT_URL`

Change `[DB-USER]` to `prisma` in both strings.

Keep all Clerk keys, Arcjet key, and `NODE_ENV` unchanged.

---

## Step 5 — Apply School schema

> **DO NOT run `npx prisma db pull`** — it overwrites the schema and strips School tables/enums.

### 5a — Temporarily switch to postgres superuser

In `.env`, replace `DATABASE_URL` with the postgres superuser direct URL:
```
postgresql://postgres.<REF>:<db-password>@<host>:5432/postgres
```
(Get from: Supabase → Settings → Database → Connection string → Direct)

### 5b — Push schema

```bash
cd kaleido-school-mvp
npx prisma db push --accept-data-loss
```

Expected output: `Your database is now in sync with your Prisma schema.`

The `--accept-data-loss` flag is needed because `db push` adds a unique constraint to `tier_unit_sequence`. Since the data is fresh from P2, there are no duplicates — this flag is safe.

> **Why superuser?** The Lab tables (`tier_unit_sequence`, `qbank_unlocks`, etc.) are owned by `postgres` (written by P2). The `prisma` user can't ALTER them to add indexes/constraints. Using the superuser for `db push` bypasses this. The `prisma` user is still used for all runtime app queries.

### 5c — Regenerate client

```bash
npx prisma generate
```

### 5d — Switch DATABASE_URL back to prisma user (port 6543)

Restore in `.env`:
```env
DATABASE_URL="postgresql://prisma.<REF>:<password>@<host>:6543/postgres?pgbouncer=true"
```

### 5e — Validate

```bash
npx prisma validate
```

Expected: `The schema at prisma/schema.prisma is valid 🚀`

---

## Step 6 — Clear Clerk users (if re-provisioning)

In Clerk dashboard: delete test student and teacher accounts.

---

## Verification Checklist

| Check | How |
|---|---|
| All 4 Lab tables populated | Supabase → Table Editor → row counts |
| School tables created | Supabase → Table Editor → see `teacher`, `student_path`, `student_unit_progress`, `student_attempt` |
| Schema valid | `npx prisma validate` → 0 errors |
| App typechecks | `npm run typecheck` → 0 errors |
| End-to-end | Sign up → onboarding → dashboard → Q Bank unlock states correct |

---

## Common Gotchas

| Gotcha | Fix |
|---|---|
| `db pull` strips School tables | Restore `schema.prisma` from git or re-add manually — never run `db pull` during migration |
| `must be owner of table` on `db push` | Temporarily use postgres superuser URL for `db push`, then switch back |
| `DIRECT_URL is not set` | `DIRECT_URL` (port 5432) must be present in `.env` alongside `DATABASE_URL` |
| `ingest.ts` fails on data.json | Not needed — pipelines write directly to Supabase. Skip Phase 6 entirely |

---

## End-to-End Test Workflow

### Part 1 — Teacher Setup

1. `localhost:5173/sign-up` → sign up with Gmail (teacher account)
2. Clerk dashboard → Users → find teacher → Edit → Public metadata: `{"role": "teacher"}` → copy Clerk User ID
3. Supabase SQL Editor → insert Teacher row:
   ```sql
   INSERT INTO teacher (clerk_user_id, teacher_code) VALUES ('<clerk-user-id>', 'TEST01');
   ```
4. Navigate to `localhost:5173/educator/students` → Educator Console loads (empty student list)

### Part 2 — Student Setup

5. Different browser / incognito → `localhost:5173/sign-up` → sign up with Gmail (student account)
6. Clerk dashboard → Users → find student → Edit → Public metadata: `{"role": "student"}`
7. `localhost:5173/onboarding/tier` → pick tier
8. `localhost:5173/onboarding/teacher-code` → enter `TEST01`
9. `localhost:5173/onboarding/complete` → confirmation screen
10. `localhost:5173/dashboard` → unit list loads, first unit in-progress, rest locked

### Part 3 — Spot Checks

| Check | URL |
|---|---|
| Q Bank unlock states | `localhost:5173/question-bank` |
| Teacher sees student | `localhost:5173/educator/students` |
| Student detail | `localhost:5173/educator/<studentId>` |

> If app doesn't auto-navigate after onboarding, navigate to `/dashboard` manually.
