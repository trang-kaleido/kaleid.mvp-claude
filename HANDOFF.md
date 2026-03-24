# HANDOFF — Kaleido MVP (Master)

_Last updated: 2026-03-23_

> **Start here.** This is the single entry point for any agent or session picking up this project.
> Read this first, then follow the link to the workstream you're working on.

---

## What this project is

Kaleido is an IELTS Writing Task 2 prep platform. Two decoupled systems:

- **The Lab** — Python pipelines (Google Colab) that generate and structure content
- **The School** — Remix web app that delivers content to students and records attempts

The Lab writes. The School reads. Their interface is a single file: `data.json` (the prep-unit JSON contract).

---

## Current project state — 2026-03-23

| Workstream | Status | Last active |
|---|---|---|
| Lab — P1 | ✅ Complete — v5, validates against 126 directions (Reference-v2.md) | 2026-03-22 |
| Lab — P2 | 🟡 **`DIRECTION_LOOKUP` updated** (39 old → 126 new). Needs re-run against P1 v5 data to verify greedy + Q Bank | 2026-03-23 |
| Lab — P3 | 🔴 **Rebuild needed** — still outputs 12 practices, needs 14. Missing `POV_INTRO`, `L3M_POV`, `L2M_POV` assemblers | 2026-03-23 |
| Lab → School contract | ✅ **v3 complete** — 14 practices, `POV_INTRO` + `L3M_POV` + `L2M_POV`, `direction_ref` gains `logic` + `blog_url` | 2026-03-23 |
| UX Spec | ✅ **v3 complete** — 12 P1 practices across PoV Encoding + Essay Encoding sub-phases, new locked design rules | 2026-03-23 |
| Dev Brief | 🟡 **Stale** — §5.4 and §8.1 still say "12 practices" with old sequence. Contract v3 and UX Spec v3 are the SSOTs | 2026-03-11 |
| Data schema redesign | ✅ **Design complete** — 7-table relational schema agreed (see Dev Brief §5 + §8) | 2026-03-11 |
| School — `features.json` | ✅ **Current** — 16 features (F00–F15), matches Dev Brief + UX Spec + Lab-School Contract | 2026-03-12 |
| School — F01 (DB schema) | ✅ Complete | 2026-03-13 |
| School — F02 (Clerk auth) | ✅ Complete | 2026-03-14 |
| School — F03 (Data ingestion) | 🟡 Script complete; `prisma.server.ts` adapter fixed — tasks 2.5.2–2.5.3 deferred to Lab re-run | 2026-03-15 |
| Doc hierarchy + CLAUDE.md | ✅ **Complete** — 6-rank hierarchy model encoded in root CLAUDE.md | 2026-03-12 |

---

## Active blockers

**P3 rebuild blocks School rendering.** P3 v4 still outputs 12 practices. Contract v3 and UX Spec v3 require 14 (adds `POV_INTRO`, `L3M_POV`, `L2M_POV`). Until P3 is rebuilt, no valid `data.json` can be produced for the School.

**P2 needs a live data run.** `DIRECTION_LOOKUP` is updated (126 entries, correct format), but P2 has not been run against P1 v5 data yet. Greedy convergence and Q Bank unlock behavior with fine-grained directions are untested.

**Dev Brief is stale.** §5.4 and §8.1 still describe the old 12-practice pipeline. Contract v3 and UX Spec v3 are the authorities — Dev Brief is informational only until updated.

**Resolved blockers (2026-03-23):** P2 `DIRECTION_LOOKUP` replaced — 39 old-name flat-string entries → 126 new-name entries with `{argument, logic, blog_url}`. `direction_ref` write updated to include `logic` and `blog_url`. UX Spec updated to v3.0. Contract already at v3.
**Resolved blockers (2026-03-12):** `features.json` updated — added `DirectionRef` to F01 + F03, fixed `current_phase` enum to `p0 / p1 / p2` (was `p1_encoding / p2_applying`), confirmed Clerk auth and Prisma ORM are correct. P2 + P3 pipelines rebuilt and verified. `LAB-SCHOOL-CONTRACT.md` rewritten with TS interfaces + Zod validators. All 5 open questions resolved (rhetoric_label stays in JSONB, direction_ref owned by P2, Q Bank two-rows-per-tier confirmed, cosine thresholds locked for MVP).
**Resolved blockers (2026-03-11):** Data schema redesign complete — 7-table relational schema agreed. P1 confirmed as untouched. Old P2/P3 `data.json` audited and confirmed unusable as-is (see Lab HANDOFF session 2026-03-11).
**Resolved blockers (2026-03-08):** Dev Brief updated; `features.json` updated (F07/F11/F13 fixed, Q Bank F14, Arcjet F15).

---

## Conflicts and gaps — HANDOFFs vs specs

> **Source of truth hierarchy:** See root `CLAUDE.md` § "Document Hierarchy — Source of Truth Ranking" for the full 6-rank model.
> Quick version: Contract (Rank 1) > Dev Brief (2) > UX Spec (3) > PRD (4) > Design Doc (5) > Tasks (6). HANDOFFs are session logs, not design authorities.

---

### 🔴 Critical — blocks build

**C1 — L2F assembler** ✅ Resolved 2026-03-11

L2F assembler built and run. `data.json` in Drive includes L2F with `sentences[]` → `text` + `hint_sentences[]`. School must still exclude L2F from retry/grading (no pass/fail, always advances on submit).

**Known gap (accepted for MVP):** P2 cosine range `0.7–0.9` leaves some L2F questions with `hint_sentences: []`. School must handle empty array gracefully — not treated as an error.

**C2 — StudentAttempt granularity** ✅ Resolved 2026-03-08

Decision: **fine granularity — one row per item-attempt**. Pattern A (per-item immediate retry) means there is no clean practice-level attempt boundary — different questions within the same practice can be at different versions simultaneously. Fine granularity is the only shape that maps cleanly. `version`, `pass`, and `failed_advanced` all operate at the item level. Dev Brief §8 StudentAttempt open question note to be removed. **F01 (DB schema) is now unblocked.**

---

### 🟡 Conflicts — ✅ All resolved 2026-03-08

**CF1 — P2 naming: "Recalling" vs "Applying"** ✅ Resolved

School HANDOFF (session log, untouchable) used "Recalling" / `p2_recalling`. Dev Brief v1.2 and UX Spec v2.1 (both SSOT) use "Applying" / `p2_applying`. **Decision:** Use Dev Brief / UX Spec values throughout. Dev Brief and `features.json` already reflect this.

**CF2 — StudentUnitProgress field name and values** ✅ Resolved

School HANDOFF used `current_part` / `practice_0` / `p2_recalling`. Dev Brief v1.2 (SSOT) uses `current_phase` / `p0` / `p2_applying`. **Decision:** Use Dev Brief values. Dev Brief and `features.json` already reflect this.

**CF3 — Peek availability in P2** ✅ Resolved

School HANDOFF said "unrestricted throughout P1 and P2 including Write." UX Spec §12 (SSOT) says Peek is P1-only — not available in P0, P2 L4W, or Q Bank. **Decision:** Use UX Spec. `features.json` F07 and F11 already reflect this.

**CF4 — MCQ distractor encoding-level qualifier** ✅ Resolved

Lab HANDOFF only said "tier pool (not paired essay)." Dev Brief §5.2 specifies tier pool **at the same encoding level** (L1/L2/L3/L4). Without the encoding-level filter, L4M could draw L1 sentences as distractors — wrong. **Decision:** P3 must filter by both tier pool AND matching encoding level. Captured in P3 update requirements (Lab HANDOFF 2026-03-08).

---

### 🔵 Open questions — ✅ All resolved 2026-03-08

**OQ1 — exam_date in StudentPath** ✅ Resolved 2026-03-08

Decision: **removed**. `exam_date` is not collected at onboarding. Dev Brief §8 StudentPath and `features.json` F04 already reflect this.

**OQ2 — School HANDOFF "Next Steps" two open questions** ✅ Resolved 2026-03-08

Both questions are resolved: `exam_date` removed (OQ1); Question Bank scaffold was already locked ("no scaffold — pure free write, same as P0"). No further action needed.

**OQ3 — Stale file paths in school HANDOFF** ✅ Resolved 2026-03-08

School HANDOFF (untouchable) references `kaleido-mvp-designing/kaleido-lab-mvp/...` — that prefix no longer exists. Correct paths for reference: `kaleido-lab-mvp/outputs/P3-output-schema.ts.md` and `kaleido-lab-mvp/lab-mvp-data-pipelines/P3-practice_content.md`.

---

### SSOT document locations

| Topic | Authoritative file |
|---|---|
| All student UX, interaction rules, practice mechanics, session model | `_kaleido-school-mvp-ux.md` (v3.0) |
| System architecture, data contract shape, DB schema, tech stack | `_kaleido-MVP-dev-brief.md` |
| Lab pipeline states and next steps | `kaleido-lab-mvp/HANDOFF.md` |
| School session state and feature sequence | `kaleido-school-mvp/HANDOFF.md` |
| Lab → School rendering contract | `LAB-SCHOOL-CONTRACT.md` (project root, v3) |
| Document hierarchy (AI agent context) | Root `CLAUDE.md` § "Document Hierarchy — Source of Truth Ranking" |
| ~~School Design Brief~~ | ~~`kaleido-school-mvp/_Kaleido School Design Brief.md`~~ — **archived 2026-03-08**, superseded entirely by UX Spec v2.1 |

---

## Sub-handoffs — follow these for active workstreams

| Workstream                | Handoff file                                                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 🔬 Lab (pipelines)        | [`kaleido-lab-mvp/HANDOFF.md`](kaleido-lab-mvp/HANDOFF.md)                                                                       |
| 🏫 School (Remix app)     | [`kaleido-school-mvp/HANDOFF.md`](kaleido-school-mvp/HANDOFF.md)                                                                 |
| 🔗 Lab → School interface | [`LAB-SCHOOL-CONTRACT.md`](LAB-SCHOOL-CONTRACT.md) (project root) |

---

## How to use this system

- **Starting fresh on Lab?** Read this file → follow link to `kaleido-lab-mvp/HANDOFF.md`
- **Starting fresh on School?** Read this file → follow link to `kaleido-school-mvp/HANDOFF.md`
- **Working across both?** Read this master file fully before opening either sub-handoff
- **After each session:** Update the relevant sub-handoff with what happened, then update the table above if workstream status changed

---

## File system map

```
kaleido-mvp-claude/
├── HANDOFF.md                              ← you are here (master)
├── CLAUDE.md                               ← user preferences + document hierarchy model
├── LAB-SCHOOL-CONTRACT.md                  ← Rank 1: "The Law" (moved to root 2026-03-12)
├── _kaleido-MVP-dev-brief.md               ← Rank 2: "The Constitution"
├── _kaleido-school-ux-spec.md              ← Rank 3: "The Playbook"
├── features.json                           ← Cross-cutting verification layer
│
├── kaleido-lab-mvp/
│   ├── HANDOFF.md                          ← lab session log
│   ├── outputs/
│   │   └── data.json                       ← runtime backup (not a design source)
│   └── lab-mvp-data-pipelines/
│       ├── pipeline_1_v5.ipynb             ← 126 directions, validated against Reference-v2.md
│       ├── pipeline_2_v4.ipynb             ← DIRECTION_LOOKUP updated to 126 (2026-03-23)
│       ├── pipeline_3_v4.ipynb             ← 🔴 STALE — still 12 practices, needs rebuild to 14
│       ├── practice_content_spec.md        ← assembly rules for all 14 practices
│       └── practice_redesign_spec.md       ← locked spec for practice order + question counts
│
└── kaleido-school-mvp/
    ├── HANDOFF.md                          ← school session log
    ├── specs.md                            ← Rank 4: "The Checklist" (to be added)
    ├── design.md                           ← Rank 5: "The Blueprint" (to be added)
    ├── tasks.md                            ← Rank 6: "The Execution Plan" (to be added)
    └── app/
```
