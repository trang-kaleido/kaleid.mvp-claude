# Implementation Plan: Direction Expansion + P1 Encoding Trim

**Date:** March 2026 | **Version:** 1.0

---

## Design Principle

**Minimum chain effect.** School app touches nothing. Data contract shape stays identical. Only the *values* inside `direction_tag` fields change (43 old IDs → 131 new IDs), and question counts inside practices get trimmed.

---

## Current State → Target State

| Component | Current | After |
|---|---|---|
| Poles | 6 | 7 (adds Flourishing) |
| Pole pairs | 15 | 21 |
| Directions | 43 (old naming) | 131 (`[pole_a]_[pole_b]_[connection_type]`) |
| Rhetoric tags | 33 | 33 (unchanged) |
| Structure templates | 7 (`structure_1`–`structure_7`) | 7 (unchanged) |
| `paragraph_type` | `introduction / body_1 / body_2 / body_3 / conclusion` | Same (unchanged) |
| `structure_type` | Present | Present (unchanged) |
| Questions per unit | ~114 | ~61 |

---

## What We Do NOT Change

- **Structure templates** — all 7 stay as-is
- **`structure_type` field** — remains in output and Prisma schema
- **`paragraph_type` values** — stays as `introduction / body_1 / body_2 / body_3 / conclusion`
- **Rhetoric tags** — all 33 unchanged
- **Practice shapes** — all 12 TypeScript interfaces identical
- **LAB-SCHOOL-CONTRACT.md** — data contract shape unchanged
- **School app** — zero changes to Prisma schema, ingest.ts, routes, or components
- **P2 greedy algorithm logic** — direction-agnostic, only the lookup table grows
- **L2M (Sentence MCQ)** — deferred (`^937088`), left as-is

---

## Execution Steps

### Step 1: Build Hybrid Framework Files

Create three hybrid files that combine *only* the direction system from v3.0 with everything else from v1.

**Hybrid Reference-v2.md:**
- Section 1 (Directions): from new Reference.md v3.0 — all 131 directions across 21 pairs, new naming
- Section 2 (Rhetoric Tags): verbatim from Reference-v1.md — all 33 tags
- Section 3 (Structure Templates): verbatim from Reference-v1.md — all 7 templates

**Hybrid Thinking-v2.md:**
- Part 1 (Poles): from new Thinking.md v3.0 — adds 7th pole (Flourishing)
- Part 2 (Connection Engine): from new Thinking.md v3.0 — 9 connection types needed for 131 directions
- Everything structural (how to pick structure templates, paragraph reasoning): from Thinking-v1.md

**Hybrid Prompt-v2.md:**
- Direction selection steps: reference the 131-direction pool and 9 connection types
- Structure selection steps: still reference the 7 structure templates (not modules)
- Output schema: still includes `structure_type`, `paragraph_type` as `body_1/body_2/body_3`
- Validation guardrails: check `direction_tag` against 131 valid IDs

### Step 2: Run P1 with Hybrid Framework

Run existing P1 pipeline notebook with the three hybrid framework files.

**Output shape:** identical to current `data.json` — only `direction_tag` values use new 131-ID naming.

**Verification checklist:**
- [ ] All `direction_tag` values are in the 131 valid set
- [ ] `structure_type` is present on every essay
- [ ] `paragraph_type` values are the old set (`introduction`, `body_1`, etc.)
- [ ] `rhetoric_tag` values are from the 33-tag set
- [ ] Sentence-level `direction_tag` quality is inspectable (decision gate for `^937088`)

### Step 3: Update P2 `DIRECTION_LOOKUP` (43 → 131)

Single code change in Pipeline 2: replace the 43-entry `DIRECTION_LOOKUP` dict with 131 entries sourced from hybrid Reference-v2.md Section 1.

| P2 Component | Change? | Why |
|---|---|---|
| `DIRECTION_LOOKUP` dict | **YES — 43 → 131** | Maps new IDs to argument text |
| Greedy algorithm | No | Counts set overlaps; direction-agnostic |
| `direction_ref` table write | No (auto-expands) | Iterates `DIRECTION_LOOKUP`; 131 rows instead of 43 |
| `tier_unit_sequence` | No | References `unit_id`s, not directions |
| `qbank_unlocks` | No | `shared_directions` stores whatever strings P1 produced |

**Verification:** `direction_ref` table has 131 rows, greedy algorithm converges, Q Bank unlocks compute correctly.

### Step 4: Update P3 Encoding Practices

All changes are in Pipeline 3 only. Practice shapes (TypeScript interfaces) stay identical — arrays just get shorter.

| Code | Name           | Change    | What to do in P3                                                                                       | ~Qs |
| ---- | -------------- | --------- | ------------------------------------------------------------------------------------------------------ | --- |
| P0   | Cold Write     | None      | —                                                                                                      | 1   |
| L4M  | Essay MCQ      | Reduced   | Drop Q3 (structure question). Remove `STRUCTURE_LOOKUP`. Update direction distractors to 131 pool.     | 2   |
| L3M  | Para MCQ       | **Major** | Drop templates A+B. Keep C (direction per paragraph) with "None of the above". Rewrite generator cell. | ~3  |
| L2M  | Sent MCQ       | **TBD**   | Drop Template B. Keep Template A-cap at 6.                                                             | 6   |
| L1M  | Lex MCQ        | Reduced   | One per sentence, noun-phrase only, body sentences only.                                               | ~8  |
| L1S  | Lex Scramble   | Capped    | Add `[:10]` slice.                                                                                     | 10  |
| L2S  | Sent Scramble  | **Major** | Clause-based chunking via spaCy dep parse. Body only.                                                  | ~14 |
| L3S  | Para Scramble  | None      | —                                                                                                      | ~3  |
| L4S  | Essay Scramble | None      | —                                                                                                      | ~1  |
| L1F  | Phrase Fill    | Capped    | Add `[:10]` slice.                                                                                     | 10  |
| L2F  | Sent Fill      | Scoped    | Body paragraphs only. Cap at 5.                                                                        | ~5  |
| L4W  | Essay Write    | None      | —                                                                                                      | 1   |

**Verification:** each `prep_unit` has 12 practices, question counts match spec (~61 per unit).
Details in [[practice_redesign_spec]]
### Step 5: Ingest into School

Run `ingest.ts` with new data. School code is unchanged — this is a data-only update.

**Verification:** Prisma validates, app renders, practice flows work end-to-end.

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|---|---|---|
| P1 assigns noisy `direction_tag` with 131 pool | Medium | Spot-check first 5 essays before full batch (existing workflow) |
| P2 greedy converges slower with 131 directions | Low | Algorithm bounded by essay count (100); run and check |
| L2S spaCy chunking produces poor clauses | Medium | Test on 5 essays first; fall back to word-level if needed |
| School ingest breaks on new direction strings | Very low | School stores `direction_tag` as plain string, no whitelist |
| Missing `DIRECTION_LOOKUP` entry crashes P2 | Low | P2 cross-check cell flags missing entries before writing |

---

## File Change Map

### Changed

| File | Step | Change |
|---|---|---|
| `kaleido-w2-framework/Reference-v2.md` | 1 | New file: hybrid of v1 Sections 2+3 + v3.0 Section 1 |
| `kaleido-w2-framework/Thinking-v2.md` | 1 | New file: hybrid of v1 structure + v3.0 poles/connections |
| `kaleido-w2-framework/Prompt-v2.md` | 1 | New file: hybrid of v1 structure + v3.0 direction refs |
| `lab-mvp-data-pipelines/pipeline_1_v*.ipynb` | 2 | `VALID_DIRECTION_TAGS`: 43 → 131 |
| `lab-mvp-data-pipelines/pipeline_2_v4.ipynb` | 3 | `DIRECTION_LOOKUP`: 43 → 131 entries |
| `lab-mvp-data-pipelines/pipeline_3_v4.ipynb` | 4 | Practice generators (trim + L3M rewrite + L2S rewrite) |

### NOT Changed

| File / Area | Reason |
|---|---|
| `kaleido-school-mvp/` (entire app) | Data contract shape unchanged |
| `prisma/schema.prisma` | Table shapes unchanged |
| `scripts/ingest.ts` | Reads same JSON shape |
| `LAB-SCHOOL-CONTRACT.md` | Interfaces unchanged |
| `Reference-v1.md`, `Prompt-v1.md`, `Thinking-v1.md` | Preserved as archive |
| `100_questions_mvp.md` | Same 100 questions |

---

*End of plan. v1.0 — March 2026.*
