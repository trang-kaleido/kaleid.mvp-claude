# Kaleido School MVP — UX Specification

_Version 3.0 · 2026 · SSOT for student-facing UX_

> **v3 changes:** P1 Encoding restructured into two sub-phases — PoV Encoding (new) and Essay Encoding (renamed). Practice count increases from 10 to 12. New `POV_INTRO` screen added. Practice codes `L3M_POV` and `L2M_POV` replace the old `L3M`. All references to old practice order updated throughout.

---

## 1. What This Document Is

The single source of truth for all student-facing behaviour in Kaleido School MVP. It defines every flow, screen, interaction rule, and practice mechanic.

It does not cover the Lab pipeline, data contract, or tech stack — those live in the Dev Brief and the Lab→School Contract.

Companion documents: `_kaleido-MVP-dev-brief.md` · `LAB-SCHOOL-CONTRACT-v3.md` · `P1_encoding_redesign_spec_v3.md`

---

## 2. The Student

One user type: an individual IELTS test-taker preparing for Writing Task 2. They have a real exam date. They are time-pressured. They want to achieve their target band score and feel confident before their exam — not read about IELTS, not watch videos, not study passively.

The School's job: make them produce language under pressure, repeatedly, on content that builds.

---

## 3. System Context

Kaleido has two systems. The Lab (Python pipeline) generates all content — model essays, tagged sentences, practice questions — and outputs a single `data.json` file. The School (Remix web app) consumes that file and delivers a structured learning experience.

The student never sees the Lab. The School is content-agnostic: it renders whatever the Lab produces. The only interface between them is the data contract (JSON schema).

---

## 4. The Four Phases at a Glance

Every prep-unit (one IELTS essay) is worked through in four phases. P0, P1, and P2 are sequential and required. P3 is optional and cross-unit.

|Phase|Name|What the student does|EC artifact|
|---|---|---|---|
|P0|Cold Write|Free essay on model essay question. No scaffold. 40-min countdown. One sit.|Artifact 1 — immediately on submit|
|P1|Encoding|PoV Intro screen + 12 sequential practices split across two sub-phases: **PoV Encoding** (`L3M_POV` → `L2M_POV`) then **Essay Encoding** (`L4M` → `L2M` → `L1M` → `L1S` → `L2S` → `L3S` → `L4S` → `L1F` → `L2F`). Peek modal available from `L3M_POV` onward. Stopwatch. One sit.|None|
|P2|Applying|L4W — full essay on model essay question. 40-min countdown. No peek. L4W = unit gate. One sit.|Artifact 2 — L4W essay, on unit complete|
|P3|Question Bank|Optional free practice. Student picks any unlocked question from Lab-determined pool. Free essay write. 40-min. No scaffold.|Numbered Free Practice artifact — on each submit|

---

## 5. Full UX Flow — Eraser.io Diagram

Paste the code block below into a new Eraser flowchart (Diagram as Code editor) to render the full UX flow.

```
direction down

// ─── ONBOARDING ─────────────────────────────────────────────────────
arrive [shape: oval, label: "Student arrives"]
chooseTier [label: "Choose tier\n50 units or 80 units"]
teacherCode [label: "Enter teacher code"]
pathAssigned [label: "Path assigned · content_version locked\nUnit 1 unlocked"]

arrive -> chooseTier -> teacherCode -> pathAssigned

// ─── DASHBOARD ──────────────────────────────────────────────────────
dashboard [label: "Dashboard"]
unitPath [label: "Unit Path\nlocked / in-progress / complete"]
qBank [label: "Question Bank\nfree practice on Lab-unlocked questions"]

pathAssigned -> dashboard
dashboard -> unitPath
dashboard -> qBank

// ─── PER-UNIT LOOP ──────────────────────────────────────────────────
unitPath -> p0Start: "start unit N"

p0Start [shape: oval, label: "P0 — Cold Write"]
p0Q [label: "Show model essay question\nno scaffold · no peek"]
p0T [label: "40-min countdown (guide)"]
p0S [label: "Submit · Artifact 1 → EC · save point"]

p0Start -> p0Q -> p0T -> p0S

// ─── P1 — POV INTRO ─────────────────────────────────────────────────
povIntro [label: "POV_INTRO screen\nPoV cards (argument + logic + deep-dive link)\nno questions · no peek · no stopwatch"]
povCTA [label: "\"I have understood these PoVs — ready to study the essay\"\nCTA button gates forward"]

p0S -> povIntro -> povCTA

// ─── P1 — ESSAY SHOWN ───────────────────────────────────────────────
essayShown [label: "Model essay rendered for reading\nPeek modal now available · Stopwatch starts"]

povCTA -> essayShown

// ─── P1 — POV ENCODING ──────────────────────────────────────────────
p1PovStart [shape: oval, label: "PoV Encoding\nL3M_POV → L2M_POV"]
p1Item [label: "Current item\n(one MCQ question)"]
p1Pass [shape: diamond, label: "100% correct?"]
p1Attempt [shape: diamond, label: "3rd attempt on this item?"]
p1Next [label: "Next → (next item or next practice)"]
p1Adv [label: "Continue → · failed_advanced: true on this item"]

essayShown -> p1PovStart -> p1Item -> p1Pass
p1Pass -> p1Next: "Yes — correct indicator shown"
p1Pass -> p1Attempt: "No — wrong indicator (red X) · V2 loads"
p1Attempt -> p1Item: "No — V2 of same item"
p1Attempt -> p1Adv: "Yes"

// ─── P1 — ESSAY ENCODING ────────────────────────────────────────────
p1EssayStart [shape: oval, label: "Essay Encoding\nL4M → L2M → L1M → L1S → L2S → L3S → L4S → L1F → L2F"]
p1EItem [label: "Current item\n(one question / one scramble / one fill section / one L2F sentence)"]
p1EPass [shape: diamond, label: "100% correct?"]
p1EAttempt [shape: diamond, label: "3rd attempt on this item?"]
p1ENext [label: "Next → (next item or next practice)"]
p1EAdv [label: "Continue → · failed_advanced: true on this item"]
p1End [label: "All 12 practices complete · save point"]

p1Next -> p1EssayStart: "PoV Encoding done"
p1Next -> p1Item: "more PoV Encoding items"
p1Adv -> p1Item: "more PoV Encoding items"
p1Adv -> p1EssayStart: "PoV Encoding done"

p1EssayStart -> p1EItem -> p1EPass
p1EPass -> p1ENext: "Yes — correct indicator shown"
p1EPass -> p1EAttempt: "No — wrong indicator (red X) · V2 loads"
p1EAttempt -> p1EItem: "No — V2 of same item"
p1EAttempt -> p1EAdv: "Yes"
p1ENext -> p1End: "last item done"
p1ENext -> p1EItem: "more items"
p1EAdv -> p1EItem: "more items"
p1EAdv -> p1End: "last item done"

// ─── P2 ─────────────────────────────────────────────────────────────
p2Start [shape: oval, label: "P2 — Applying · one sit"]
l4w [label: "L4W — Essay write · 40-min countdown\nmodel essay question\ncollapsible: lexical + syntax panels · no peek"]
l4wA [label: "Submit → Artifact 2 to EC\nUNIT GATE · save point"]

p1End -> p2Start -> l4w -> l4wA

unitComplete [label: "Unit N complete\nnext unit unlocks (if not last)\nLab-determined questions added to Question Bank"]

l4wA -> unitComplete
unitComplete -> unitPath: "more units → unit N+1"
unitComplete -> pathComplete: "last unit done"

pathComplete [shape: oval, label: "PATH COMPLETE\nAll [50/80] units done · congrats screen\nQ Bank remains open for free practice"]
pathComplete -> qBank: "continue free practice"

// ─── P3 — QUESTION BANK ─────────────────────────────────────────────
qbPick [label: "Pick any unlocked question"]
qbWrite [label: "Free write · 40-min timer · no scaffold · no peek"]
qbSubmit [label: "Submit · Numbered Free Practice artifact → EC"]

qBank -> qbPick -> qbWrite -> qbSubmit
qbSubmit -> qbPick: "pick another"

// ─── EDUCATOR CONSOLE ───────────────────────────────────────────────
ec [shape: oval, label: "Educator Console · read-only"]
ecArt [label: "Per student · per unit:\nArtifact 1 — P0 cold essay\nArtifact 2 — L4W post-encoding essay\nFree Practice #N — numbered, optional extra writes"]
ecSig [label: "Signals: time per practice · total time accumulated · pass/fail · failed_advanced"]

ec -> ecArt
ec -> ecSig
```

---

## 6. Onboarding

When a student first arrives at the School, they go through three steps before any study content is shown.

**Step 1 — Choose tier.** The student actively chooses between a 50-unit path or an 80-unit path. The Lab determines which essays belong to each tier — the School follows the assigned list. This choice is permanent.

**Step 2 — Enter teacher code.** Links the student to their teacher in the Educator Console. Required — no skip option in MVP. All pilot students are teacher-linked.

**Step 3 — Path assigned.** The School reads `TierUnitSequence` for the chosen tier and `content_version`, builds the student's ordered unit list, locks the `content_version` (never updated mid-path), and unlocks Unit 1.

---

## 7. Dashboard

The Dashboard is the student's home base after onboarding. Two sections:

**Unit Path.** The student's full unit list (50 or 80 entries) in sequence. Each unit shows its status: locked, in-progress, or complete. Strictly sequential — a unit can only be entered after the previous one is complete. Once all units are complete, the unit path shows a path complete state. The Question Bank remains accessible.

**Question Bank.** A growing pool of IELTS questions unlocked by completing units. The Lab determines how many and which questions are added per completed unit (see §14). Available at any time for free practice.

---

## 8. Per-Unit Loop

Every unit follows the same fixed structure: P0 → P1 → P2 → Unit Complete. No skipping, no reordering.

### 8.1 P0 — Cold Write

The first thing the student does on every unit. A free essay write with no preparation, no scaffold, and no peek.

|||
|---|---|
|Question shown|The model essay question for this unit|
|Scaffold|None. No hints, no structure guide, no peek button|
|Timer|40-minute countdown. Freezes at 0:00 — submission remains available. Guide, not hard cutoff|
|On submit|Output → Artifact 1 → EC immediately. Save point. P1 begins.|

### 8.2 P1 — Encoding

12 practices across two sub-phases. One sit. A stopwatch runs throughout — visible, can be paused. Records time per practice for EC. Not a pressure mechanism.

**Full practice order (fixed):**

```
POV_INTRO (screen, no questions)
  └─ PoV Encoding ──── L3M_POV → L2M_POV
  └─ Essay Encoding ── L4M → L2M → L1M → L1S → L2S → L3S → L4S → L1F → L2F
```

#### PoV Introduction Screen (`POV_INTRO`)

Before the student sees the model essay, they see a screen that introduces the PoVs the essay develops.

|||
|---|---|
|Peek|Not available — the model essay has not been shown yet|
|Stopwatch|Not running — starts when the student advances past this screen|
|Content|One PoV card per unique direction in the essay. Each card shows: the PoV argument (heading), the PoV logic (body text), and a deep-dive button linking to the full blog post. The deep-dive button is always rendered; it is greyed out and disabled when the blog post has not yet been published.|
|CTA|"I have understood these PoVs — ready to study the essay" — gates forward. No pass/fail. Not tracked in `StudentAttempt`.|
|After CTA|The model essay is rendered for reading. The stopwatch starts. Peek becomes available.|

#### PoV Encoding (`L3M_POV`, `L2M_POV`)

The student reads the model essay and then answers MCQ questions anchored in the essay's PoVs. Every question in this sub-phase uses the PoV's `argument` + `logic` as context or as options.

|Code|Level|What is tested|
|---|---|---|
|`L3M_POV`|Paragraph|PoV-to-paragraph and paragraph-to-PoV matching. 4–6 questions.|
|`L2M_POV`|Sentence|Sentence-to-PoV matching: evidence, mechanism, problem, and not-related. Max 2 questions per direction. 3–5 questions total.|

Peek is available throughout. Standard MCQ retry mechanics apply (see §9.1 and §10).

#### Essay Encoding (`L4M` → `L2M` → `L1M` → `L1S` → `L2S` → `L3S` → `L4S` → `L1F` → `L2F`)

The student encodes the essay's structure, rhetoric, and language. Nine practices, working top-down (MCQ) then bottom-up (Scramble) then recall (Fill).

Peek is available throughout. On completion of all 12 practices: save point set.

### 8.3 P2 — Applying

One practice. One sit.

**L4W — Essay Write.** Full IELTS essay on the model essay question — the same question as P0. Two collapsible reference panels: lexical items, syntax patterns. No peek. 40-minute countdown.

On submit: output → Artifact 2 → EC. This is the unit gate — next unit unlocks immediately. Save point set.

### 8.4 Unit Complete Screen

After L4W is submitted, the student sees a unit complete screen. New questions from the broader question pool (as determined by the Lab) have been added to their Question Bank.

Buttons: Go to Question Bank / Next Unit →

### 8.5 Path Complete Screen

When the student submits L4W on the last unit in their tier, they reach the path complete screen instead of the regular unit complete screen.

The screen acknowledges completion and signals that the Q Bank remains open for ongoing free practice. The tone should be direct and honest — students have done real work (50 or 80 essays worked through from cold write to post-encoding write).

Buttons: Go to Question Bank / Back to Dashboard

---

## 9. Practice Mechanics

### 9.1 MCQ — `L3M_POV`, `L2M_POV`, `L4M`, `L2M`, `L1M`

|Code|Phase|Level|What is tested|Count|
|---|---|---|---|---|
|`L3M_POV`|PoV Encoding|Paragraph|PoV-to-paragraph and paragraph-to-PoV matching. Context = full paragraph text or PoV argument + logic. Options = `direction.argument` texts or paragraph texts.|4–6|
|`L2M_POV`|PoV Encoding|Sentence|Sentence-to-PoV matching: which sentence is evidence / mechanism / problem / not related. Context = PoV argument + logic. Options = sentence texts.|3–5|
|`L4M`|Essay Encoding|Essay|2 fixed questions: which IELTS question; which PoV pair.|2|
|`L2M`|Essay Encoding|Sentence|Rhetoric role identification — what structural role does this sentence play? Context = the sentence itself. Options = `rhetoric_label` texts. Body sentences only, cap 6.|≤6|
|`L1M`|Essay Encoding|Lexical|Identify exact phrase in blanked sentence. One question per body sentence (first noun-phrase item).|~8|

**Mechanics (all MCQ practices):**

- One question at a time. Exactly 5 options. Always exactly 5.
- Peek button available throughout P1 (see §12).
- On wrong answer: red X / "incorrect" indicator shown. No correct answer revealed. No feedback string. V2 of that question auto-loads immediately (Pattern A — per-question retry). See §10.
- V1 and V2 contain the same questions with different wrong options drawn from the tier pool.

### 9.2 Scramble — `L1S`, `L2S`, `L3S`, `L4S`

All scramble practices are in Essay Encoding. Unchanged from v2.

|Code|Items|Interaction|Student arranges|
|---|---|---|---|
|`L1S`|Individual words|Click-to-place word bank|Into a correct phrase|
|`L2S`|Phrase chunks (clause-based)|Click-to-place word bank|Into a correct sentence|
|`L3S`|Full sentences|Drag-to-order|Into correct paragraph order|
|`L4S`|Paragraph opening sentences|Drag-to-order|Into correct essay order|

- `L2S`: lexical phrase chunks are visually distinct (highlighted, pill-shaped). Syntax hint shown below chip bank at all times.
- `L3S` hint: rhetoric label sequence (e.g. "Topic → Explanation → Example → Mini-conclusion").
- `L4S` hint: structure label (e.g. "5-Paragraph Causes–Effects–Solutions").
- Pass = 100% correct order. On wrong arrangement: red X / "incorrect" shown. No correct order revealed. Same items reload immediately for retry (Pattern A). See §10.

### 9.3 Fill — `L1F`

Student fills blanks in the model essay text from memory. No word bank. Scope: body sentences only, first 10 in essay order.

|||
|---|---|
|Blanks|Key lexical phrases blanked in the canonical text|
|Hints per blank|POS tag (e.g. NOUN, VERB, ADJ) + `similar_phrases` listed directly below — always visible, no toggle|
|`similar_phrases`|Similar but NOT the correct answer — recall cues only. Student must recall the exact phrase.|
|Peek|Available|

Pass condition: 100% correct across all blanks in the section. Case-insensitive exact match. On failure: each wrong blank is marked with a red X — no correct answer shown, just which blanks were wrong. Same section reloads immediately for retry (Pattern A — per-section retry). See §10.

### 9.4 Fill — `L2F`

Sentence-level fill. No pass/fail — always advances on submit. Body sentences only, first 5 in essay order.

|||
|---|---|
|Blanks|Full body sentences blanked from the model essay text, one at a time|
|Hints per blank|Semantically similar sentences displayed as recall cues (NOT the correct answer)|
|Peek|Available|
|Pass/fail|None — always advances on submit. No retry versions, no `failed_advanced` flag|
|Output|Silently discarded — nothing stored|

### 9.5 Write — `L4W`

L4W — Essay Write (P2). Unchanged.

- One question per unit — the model essay question (same as P0)
- Collapsible: lexical items panel, syntax patterns panel
- No peek
- No other scaffold
- 40-minute countdown timer
- No pass/fail — always advances on submit
- Output → Artifact 2 → EC. Submission = unit gate.

---

## 10. Retry Logic

**Retry pattern:** immediate per-item (Pattern A). When a student gets an item wrong, that same item reloads with V2 content immediately — before they move to the next item. Students never restart a whole practice session.

**Result display: wrong indicator only.** When an item is answered incorrectly, a wrong indicator is shown (red X / "incorrect"). No correct answer is revealed. No feedback string. The essay via peek is the only path to understanding.

**Fill-specific:** For `L1F`, the wrong indicator marks each specific blank that was incorrect — still no correct answer shown.

**Retry is automatic.** After the wrong indicator is shown, V2 of that item auto-loads. There is no Retry button.

|Tool|Unit of retry|Pass condition|V2 content|After 3 failures|
|---|---|---|---|---|
|MCQ (`L3M_POV`, `L2M_POV`, `L4M`, `L2M`, `L1M`)|Per question|100% correct|Same question, same correct answer, different wrong options from tier pool|Advance question. `failed_advanced: true`|
|Scramble|Per arrangement|100% correct order|Same items, same correct order, different shuffle|Advance. `failed_advanced: true`|
|Fill `L1F`|Per section|100% correct across all blanks|Same blanks, same answers|Advance section. `failed_advanced: true`|
|Fill `L2F`|N/A|No pass/fail — always advances|N/A|N/A|
|Write `L4W`|N/A|No pass/fail — always advances|N/A|N/A|

**Practice-level pass:** A practice is passed when all items were resolved without any `failed_advanced`. If any item was forced through, the practice is marked `failed_advanced: true`.

**Button states — only two:**

- "Next →" — appears when the current item is passed (100% correct).
- "Continue →" — appears after the 3rd failure on a single item (forced advance). Copy: "You've used all attempts — keep going."

---

## 11. Timer Rules

|Practice|Timer type|Behaviour|
|---|---|---|
|P0 · L4W in P2 · Question Bank|40-min countdown|Counts down from 40:00. Freezes at 0:00 — submission remains available. Guide, not hard cutoff. Student can pause.|
|`POV_INTRO` screen|None|No timer. Student reads at their own pace.|
|P1 practices (`L3M_POV` through `L2F`)|Stopwatch|Counts up from 0:00. Starts when student advances past `POV_INTRO`. Visible. Student can pause. Tracking only — no pressure.|

Time is recorded as `started_at` / `completed_at` on every `StudentAttempt`. EC receives total time per practice from these timestamps. `POV_INTRO` does not write a `StudentAttempt` record.

---

## 12. Peek Modal

The peek modal gives students on-demand access to the model essay at any point during P1 practices.

|||
|---|---|
|When available|From `L3M_POV` onward through all P1 practices (`L3M_POV` → `L2M_POV` → `L4M` → `L2M` → `L1M` → `L1S` → `L2S` → `L3S` → `L4S` → `L1F` → `L2F`)|
|NOT available|P0 (no model essay shown yet) · `POV_INTRO` screen (model essay not yet shown) · P2 `L4W` (essay write, no scaffold) · Question Bank (free practice, no scaffold)|
|Rate|Unlimited — no per-question rate limit|
|`peek_count`|Removed from `StudentAttempt` — EC does not receive this data|

**Modal contents:**

- Essay text — colour-coded: noun phrases (adj+n, n+n) = emerald/green + semibold · verbs = red · adverbs = blue · untagged = default. Sentence hover → rhetoric tag tooltip.
- PoV cards — one per unique direction in the essay: human-readable direction argument, `logic` summary, deep-dive link (`kaleido.io/blog/[direction-slug]`, opens in new tab).
- Lexical items panel — all key phrases grouped by type (noun phrases / verbs / adverbs).

---

## 13. Session Model

A unit is completed across three sittings. Save points exist only at phase boundaries — the system never saves mid-practice state.

```
P0  ──[save point]── P1 (one sit) ──[save point]── P2 (one sit) ──[save point / unit gate]

                     POV_INTRO
                     L3M_POV
                     L2M_POV
                     L4M
                     L2M
                     L1M                              L4W only
                     L1S
                     L2S
                     L3S
                     L4S
                     L1F
                     L2F
```

|Phase|Commitment|Rule|
|---|---|---|
|P0|One sit|Once started, essay must be submitted before navigating away. 40-min countdown is the natural enforcement.|
|P1|One sit|All 12 practices (plus `POV_INTRO`) must be completed before closing. No mid-encoding save state. On return: student resumes at start of P1 (`POV_INTRO`).|
|P2|One sit|L4W must be completed in one sitting. On return: student resumes at start of P2.|

**Resume behaviour:** Student returns → system checks last completed save point → drops student at start of next incomplete phase. No mid-practice state is ever restored.

---

## 14. Question Bank — P3

The Question Bank is a free-practice space that grows as the student completes units. Entirely optional — no gate, no required completion, no retry logic.

**How questions unlock.** The Question Bank draws from the broader IELTS question pool — questions outside the student's assigned tier essays, covered by the PoV directions the student has now learned. The Lab (Pipeline 2) determines which questions are unlocked and how many, per completed unit.

|||
|---|---|
|How questions unlock|Per completed unit: Lab-determined set of questions from the broader pool, selected because they share PoV directions with the completed unit. Not the model essay question itself.|
|Access|Available at any time from the Dashboard. Cross-unit — student can mix questions freely.|
|The practice|Student picks a question. Free write. 40-min countdown. No scaffold, no peek, no hints. Same experience as P0.|
|On submit|Output → Numbered Free Practice artifact → EC, tagged "Free Practice #N". No unit gate. No pass/fail.|
|Multiple submissions|Student can return to the same question and submit again. Each submit creates a new numbered Free Practice artifact.|
|Session model|No save state. Each Question Bank session is self-contained.|

**Question Bank home — three question states:**

|State|What student sees|Display treatment|
|---|---|---|
|Attempted|Questions the student has written on|Full question text. Attempt count shown if derivable from `StudentAttempt` records.|
|Unlocked|Questions unlocked by completing prep-units, not yet attempted|Full question text. No attempt count.|
|Locked|Questions not yet unlocked|First ~8 words + "…" + "Unlock after completing Prep-Unit [N]"|

---

## 15. Educator Console

The EC is a separate authenticated view for teachers. Read-only in MVP — no grading, no annotation, no feedback mechanism.

Access control: Teachers see only students who entered their `teacher_code` at onboarding. Per student: full unit list with status (locked / in-progress / complete).

### Artifacts per completed unit

|Artifact|Contents|When visible in EC|
|---|---|---|
|Artifact 1|P0 cold essay — written before any study, on the model essay question|Immediately after P0 submit|
|Artifact 2|L4W post-encoding essay — written after completing P1, on the same question|After L4W submit (= unit complete)|

Artifact 1 and Artifact 2 are on the same IELTS question. The teacher can compare pre-study vs. post-encoding writing directly on identical prompts. This is the primary signal of learning in the EC.

Free Practice artifacts: Each Question Bank submission creates a new numbered Free Practice artifact (Free Practice #1, #2, etc.), tagged with the question and the date. Numbering is per-student and cumulative.

### Signals per unit

- Time spent per practice (`started_at` / `completed_at` on every `StudentAttempt`). `POV_INTRO` generates no attempt record — no time data for it in EC.
- Total accumulated time — SUM of all (`completed_at` − `started_at`) across every `StudentAttempt` record for the student. Covers P0, all P1 practice attempts (including retries), L4W essays, and Q Bank free practice writes.
- Pass / fail per practice.
- Practices where `failed_advanced: true`.

### What the EC does NOT have in MVP

No rubric or scoring · No annotation or feedback tool · No reply mechanism · No grade assignment · No ability to lock or unlock units · No push notifications

Teacher workflow in MVP: Reviews Artifact 1 and Artifact 2 side-by-side to assess growth. Coaching offline via WhatsApp, email, or in-person. EC is observation-only.

---

## 16. UI States Inventory

|State|Phase|Description|
|---|---|---|
|`onboarding.tier`|—|Student choosing tier (50 or 80 units)|
|`onboarding.teacher_code`|—|Student entering teacher code|
|`onboarding.path_assigned`|—|Confirmation screen — path and tier shown|
|`path.overview`|—|Dashboard: unit list + Question Bank entry|
|`unit.practice_0`|P0|Cold write — 40-min countdown, no scaffold|
|`unit.p1.pov_intro`|P1|PoV Introduction Screen — PoV cards shown, CTA gates forward, no timer, no peek|
|`unit.p1.pov_intro.essay_shown`|P1|Model essay rendered for reading before first PoV Encoding question. Peek becomes available. Stopwatch starts.|
|`unit.p1.active`|P1|A P1 practice question is active — stopwatch running|
|`unit.p1.result.correct`|P1|Correct indicator shown on current item — "Next →" to next item|
|`unit.p1.result.wrong`|P1|Wrong indicator shown (red X / "incorrect") — no correct answer revealed, V2 auto-loads immediately|
|`unit.p1.failed_advanced`|P1|3rd failure on current item — "Continue →" forced advance to next item|
|`unit.peek_modal`|P1|Peek modal open — available from `L3M_POV` onward|
|`unit.p2.l4w`|P2|Essay write — 40-min countdown, unit gate, no peek|
|`unit.complete`|—|Unit complete (not last) — artifacts in EC, Q Bank questions unlocked, "Next Unit →" available|
|`path.complete`|—|Last unit complete — congrats screen. Q Bank remains open, no more units.|
|`question_bank`|P3|Question Bank home — three question states: attempted / unlocked / locked|
|`question_bank.write`|P3|Free write on selected question — 40-min countdown|

---

## 17. Locked Design Rules

These are invariants. Not open to per-sprint reinterpretation.

1. **Practice order is fixed.** P0 → P1 (`POV_INTRO` → `L3M_POV` → `L2M_POV` → `L4M` → `L2M` → `L1M` → `L1S` → `L2S` → `L3S` → `L4S` → `L1F` → `L2F`) → P2 (`L4W`). No reordering, no skipping.
    
2. **PoV Encoding precedes Essay Encoding.** Within P1, the student must understand the PoVs before studying rhetoric and language. `L3M_POV` and `L2M_POV` always come first.
    
3. **MCQ direction is top-down (L4→L1).** Within Essay Encoding, comprehension starts at the whole-essay argument and zooms in to exact word choice (`L4M` → `L2M` → `L1M`).
    
4. **Scramble direction is bottom-up (L1→L4).** Construction starts from word/phrase chunks and builds up to essay structure (`L1S` → `L2S` → `L3S` → `L4S`).
    
5. **Peek is available from `L3M_POV` onward through all P1 practices.** Not available on `POV_INTRO` (essay not yet shown), P0, P2 `L4W`, or Question Bank.
    
6. **`POV_INTRO` is not tracked in `StudentAttempt`.** The CTA tap advances `current_phase` but does not create an attempt record. No time data for `POV_INTRO` in EC.
    
7. **No `peek_count` tracked.** Field removed from `StudentAttempt`. EC does not receive this data.
    
8. **`L1S`/`L2S`: click-to-place. `L3S`/`L4S`: drag-to-order.** Split based on item length — short chips are click-placed; full sentences are dragged.
    
9. **Fill: no word bank.** `L1F`: POS hints + `similar_phrases` always visible. `L2F`: semantically similar sentences as hints. Hints are similar but not correct — student must recall the exact answer.
    
10. **`L2F` follows the write-and-advance model.** No pass/fail, no retry, no `failed_advanced`. Output silently discarded.
    
11. **No `L3W` or `L3M` in the encoding pipeline.** `L3M` is retired. `L3M_POV` is its replacement and lives in PoV Encoding only. No paragraph-write practice exists.
    
12. **`L4W` uses the model essay question.** Same question shown in P0. No separate challenge question.
    
13. **`L4W` submission is the unit gate.** Next unit unlocks on L4W submit. Teacher review does not gate progression.
    
14. **EC artifacts: 2 per unit + numbered Free Practice artifacts.** Artifact 1 (P0) + Artifact 2 (L4W). Both on the same question. Free Practice artifacts are numbered cumulatively per student.
    
15. **Max 3 attempts per graded item (MCQ, Scramble, `L1F`).** After 3 failures: advance automatically, record `failed_advanced: true`. Student never actively chooses to retry — V2 auto-loads after result. No feedback string is shown.
    
16. **MCQ V1 vs V2: same questions, different wrong options.** The correct answer and question stem are identical across V1 and V2. Only the wrong options change. `correct_index` may differ between versions because the correct option sits at a different position in the options array.
    
17. **One sit per phase.** P0, P1, and P2 must each be completed in a single sitting. Save points at phase boundaries only. On return to P1, student resumes at `POV_INTRO` (start of P1).
    
18. **Question Bank: no scaffold.** Free write only — 40-min timer, no hints, no peek. Same experience as P0.
    
19. **Content is immutable once assigned.** `content_version` locked at onboarding. Active students never receive content updates mid-path.
    
20. **PoV directions shown as human-readable labels.** Internal `direction_id` never shown in UI copy. Students see the `argument` text (e.g. "Short-term profit damages long-term survival").
    
21. **Level codes: L1=Lexical, L4=Essay.** UI labels must match this direction. The prototype sample code has them inverted — that is a known prototype bug, not the canonical convention.
    
22. **Timer rule: countdown freezes at 0:00.** Submission remains available after countdown. Timer is a guide, not a hard cutoff. No `timer_exceeded` flag stored.
    
23. **Question Bank questions are Lab-determined.** The Lab determines which questions and how many are unlocked per completed unit, based on PoV directions covered. They are from outside the student's tier pool.
    
24. **EC shows total accumulated time.** Computed as SUM of all (`completed_at` − `started_at`) across every `StudentAttempt` record for the student. Derived at query time from existing timestamps — no new DB fields needed.
    
25. **Retry is per-item, immediate (Pattern A).** When a student gets an item wrong, that item reloads with V2 content immediately — not at the end of a session. Session-level retry does not exist.
    
26. **No correct answer is ever revealed on failure.** Wrong indicator only (red X / "incorrect"). The essay via peek is the only path to understanding. Applies to all graded practices: MCQ, Scramble, `L1F`.
    
27. **The path has a defined end.** When the last unit is completed, the student reaches a path complete screen. No new units unlock. The Question Bank remains open indefinitely.
    

---

_END OF SPEC_