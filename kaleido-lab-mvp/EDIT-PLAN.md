# Edit Plan: Hybrid Framework Files + Pipeline 1 Updates

**Implements:** IMPLEMENTATION-PLAN.md Steps 1 & 2
**Creates:** Reference-v2.md, Thinking-v2.md, Prompt-v2.md (hybrid files) + updated Pipeline 1 notebook

---

## Big Picture

The goal is to swap in the new 131-direction system (from v3.0) while keeping everything structural from v1 — the 7 structure templates, the 33 numbered rhetoric tags, the structure_type field, and the paragraph_type values. Think of it as transplanting a new engine (directions) into the existing car body (essay structure system).

---

## File 1: Reference-v2.md

**Source recipe:** v3.0 Section 1 + v1 Section 2 + v1 Section 3

### Section 1 — Precomputed Directions: COPY FROM v3.0

Take the entire Section 1 from the current Reference.md (v3.0) verbatim. This gives us:
- 131 directions across 21 pole pairs (including 6 Flourishing pairs)
- New naming convention: `[pole_a]_[pole_b]_[connection_type]`
- Each direction has NAME, ARGUMENT, LOGIC fields
- Pairs 1–21 in full

**No edits needed** to this section — it's a straight copy.

### Section 2 — Rhetoric Tags: COPY FROM v1

Take Section 2 from Reference-v1.md verbatim. This gives us the **33 numbered tags** that match the structure templates:
- Numbered tags like `example_1`, `example_2`, `cause_1`, `cause_2`, `advantage_1`, `disadvantage_2`, etc.
- Tags like `opinion_topic_sentence`, `reason_1`, `reason_2`, `synthesis` that are specific to the structure templates

**Why v1 not v3.0:** The v3.0 rhetoric tags use generic names (`example`, `cause`, `effect`) designed for its module system. The v1 tags use numbered names (`example_1`, `example_2`) that map to specific slots in the 7 structure templates. Since we're keeping structure templates, we need the numbered tags.

**Key difference to watch:** v3.0 has tags like `topic_sentence`, `explanation`, `example`, `cause`, `effect`, `solution`, `advantage`, `disadvantage`, `reason`. v1 has `topic_sentence`, `explanation`, `example_1`, `example_2`, `cause_1`, `cause_2`, `effect_1`, `effect_2`, `solution_1`, `solution_2`, `advantage_1`, `advantage_2`, `disadvantage_1`, `disadvantage_2`, `opinion_topic_sentence`, `reason_1`, `reason_2`, `synthesis`, `problem_1`, `problem_2`.

### Section 3 — Structure Templates: COPY FROM v1

Take Section 3 from Reference-v1.md verbatim. All 7 structure templates:
- Structure 1: 4-Para Discuss Both Views
- Structure 2: 5-Para Discuss Both Views + Opinion
- Structure 3: 4-Para Opinion-Led
- Structure 4: 5-Para Opinion + Counterargument
- Structure 5: 4-Para Advantages–Disadvantages
- Structure 6: 4-Para Problem–Solution
- Structure 7: 5-Para Causes–Effects–Solutions

**Why not v3.0 modules:** v3.0 replaced these with a flexible module assembly system (POSITION, VIEW, CAUSE, EFFECT, SOLUTION, EVALUATE). But the school app, P2 pipeline, and P3 practice generators all depend on the fixed structure templates. The module system would require downstream code changes we're explicitly avoiding.

### Assembly instructions:

```
Reference-v2.md =
  Header (update to "Version: 2.0")
  + Section 1 from Reference.md v3.0 (131 directions, all 21 pairs)
  + Section 2 from Reference-v1.md (33 numbered rhetoric tags)
  + Section 3 from Reference-v1.md (7 structure templates)
```

---

## File 2: Thinking-v2.md

**Source recipe:** v3.0 Parts 1–2 + v1 Parts 3–6

### Part 1 — Pole Definitions: COPY FROM v3.0

Take Part 1 from Thinking.md v3.0 verbatim. This gives us **7 poles** including Flourishing, with the updated format (Essence, Human truth, Real-life manifestations, Keywords, Philosophy).

**What changes vs v1:** Adds the Flourishing pole. Removes the "Three Underlying Tensions" framing (v3.0 treats all poles as independent forces, not organized into 3 axis pairs). Same 6 original poles but slightly refined descriptions.

### Part 2 — Connection Engine: COPY FROM v3.0

Take Part 2 from Thinking.md v3.0 verbatim. This gives us the **9 connection types** with their detailed logic:
- Causal, Trade-off, Synergy, Instrument, Prerequisite, Spillover, Blocking, Transformation, Feedback Loop

**Why v3.0 not v1:** v1 Part 2 is a brief table of the same 9 types. v3.0 expands each type with Structure, Logic, and Question signals — much more useful for the LLM during generation.

### Part 3 — Direction Selection Logic: ADAPT FROM v3.0

Take Part 3 from Thinking.md v3.0 (Steps 1–4: Pole Detection → Connection Typing → Build Candidate Pool → Select Directions).

**Why v3.0:** The v1 direction selection reasoning (Part 6) assumes 43 directions with the old naming convention. v3.0's selection logic is designed for 131 directions and the new naming convention.

### Parts 3–6 (v1) — Deep Connection Knowledge: COPY FROM v1

**This is the key structural content.** Take from Thinking-v1.md:
- Part 3: Same-Axis Connection Knowledge (Material↔Sustainable, Individual↔Collective, Progress↔Preservation — deep reasoning about WHY these tensions exist)
- Part 4: Cross-Axis Connection Knowledge (12 pair analyses — essential for the LLM to understand WHY certain alliances are stable/unstable)
- Part 5: Stability Matrix (15 pairs rated stable/unstable/complex)
- Part 6: Direction Selection Reasoning (question type → pole pattern mapping, opposing alliance collisions, strategic principles)

**Gap to address — Flourishing pairs:** v1 Parts 3–5 don't cover the 6 new Flourishing pairs. Options:
1. **Option A (Recommended):** Add brief Flourishing cross-axis entries to Parts 4–5 modeled on the existing format. The directions themselves (in Reference Section 1) provide the arguments — what we need is the "essential nature" and stability assessment for each pair.
2. **Option B:** Leave Flourishing pairs covered only by their direction entries in Reference and accept that the LLM has less reasoning guidance for these pairs.

**Flourishing pairs that need entries:**
- Material ↔ Flourishing (essential nature: "The Wellbeing Economy" — stable partnership)
- Sustainable ↔ Flourishing (essential nature: "Planetary Wellbeing" — stable synergy)
- Individual ↔ Flourishing (essential nature: "Personal Wellbeing" — stable but contains freedom paradox)
- Collective ↔ Flourishing (essential nature: "Public Wellbeing" — stable, welfare state logic)
- Progress ↔ Flourishing (essential nature: "Technology and Human Experience" — complex)
- Preservation ↔ Flourishing (essential nature: "Roots and Meaning" — stable synergy)

### Assembly instructions:

```
Thinking-v2.md =
  Header (update to "Version: 2.0")
  + Part 1 from Thinking.md v3.0 (7 poles)
  + Part 2 from Thinking.md v3.0 (Connection Engine)
  + Part 3 from Thinking.md v3.0 (Direction Selection Logic — renamed to Part 3)
  + Part 4 from Thinking-v1.md Part 3 (Same-Axis Connection Knowledge — renumbered)
  + Part 5 from Thinking-v1.md Part 4 (Cross-Axis Connection Knowledge — renumbered, add Flourishing pairs)
  + Part 6 from Thinking-v1.md Part 5 (Stability Matrix — renumbered, add Flourishing rows)
  + Part 7 from Thinking-v1.md Part 6 (Direction Selection Reasoning — renumbered)
```

---

## File 3: Prompt-v2.md

**Source recipe:** Mostly v1 structure, with direction references updated to v3.0 pool

### What stays from v1 (Prompt-v1.md):

- **Role section** — identical
- **Quality Targets** — identical
- **Word count targets** — identical
- **Step 1: Question Type → Structure Assignment** — the fixed mapping table (question type → structure_1 through structure_7). This is the core thing v3.0 replaced with module assembly that we're keeping.
- **Step 5: Write the Essay** — "Follow the structure assigned in Step 1"
- **Step 6: Decompose into Sentences by Rhetoric Slot** — maps sentences to structure template slots
- **Step 7: Tag Each Sentence** — rhetoric_tag from the 33 v1 tags; direction_tag from... (updated to 131)
- **Step 8: Extract Lexical Items** — identical between v1 and v3.0
- **Self-Check** — structure stays, references updated

### What changes (updated to v3.0 system):

- **Step 2: Identify Activated Poles** — add Flourishing row to the activation table (7 poles instead of 6)
- **Step 3: Surface Relevant Directions** — update to reference "131 directions across 21 pole pairs" with new naming convention `[pole_a]_[pole_b]_[connection_type]`. Update the example to show new-style direction names.
- **Step 4: Select Directions** — update references from "43 valid direction IDs" to "131 valid direction IDs". Remove any references to stability matrix (or keep as optional reference). Update example direction names.
- **Step 7: direction_tag validation** — "one of the 131 valid direction IDs from Reference.md Section 1"
- **Self-Check** — update "Are all direction tags valid names from Reference.md Section 1?" (131 IDs)

### What gets REMOVED vs v1:

- References to "stability matrix" or "UNSTABLE" warnings (these were v1-specific; v3.0 directions don't carry stability labels, the reasoning is in Thinking.md Parts 5–6)
- "If any selected direction is UNSTABLE, plan one sentence acknowledging its limits" (remove from Step 4)
- "If an UNSTABLE direction was used, is its limit acknowledged?" (remove from Self-Check)

### What gets REMOVED vs v3.0:

- **Step 5: Assemble Modules** — entirely removed (replaced by v1's structure assignment in Step 1)
- All references to "modules" — replaced with "structure templates"
- v3.0's generic rhetoric tags — replaced with v1's numbered tags

### Assembly instructions:

```
Prompt-v2.md =
  Header (update to "Version: 2.0")
  + Role section (from v1, identical)
  + Quality Targets (from v1, identical)
  + Step 1 (from v1: Question Type → Structure Assignment — KEEP)
  + Step 2 (from v1, ADD Flourishing row)
  + Step 3 (from v1, UPDATE direction count 43→131, new naming, new example)
  + Step 4 (from v1, UPDATE direction count, REMOVE stability references)
  + Step 5 (from v1: Write the Essay — KEEP, structure-based)
  + Step 6 (from v1: Decompose by Rhetoric Slot — KEEP)
  + Step 7 (from v1, UPDATE direction_tag count to 131)
  + Self-Check (from v1, UPDATE direction references, REMOVE UNSTABLE check)
  + Step 8 (from v1: Lexical Items — KEEP identical)
```

---

## File 4: Pipeline 1 Notebook

**File:** `lab-mvp-data-pipelines/pipeline_1_generator(ACTIVE).ipynb`

### Cell 9 — VALID_DIRECTION_TAGS: MAJOR UPDATE

Replace the 43-entry dictionary with a 131-entry set. The new valid IDs come from Reference-v2.md Section 1 (all 131 direction NAMEs).

**Format change:** The current cell uses a dict with comments grouping by pair. The new version should follow the same pattern but with 21 pairs instead of ~15, and new naming convention.

Complete list of 131 direction IDs to include (extracted from Reference.md v3.0):

```
Pair 1 (Material↔Sustainable): 8 directions
Pair 2 (Material↔Individual): 6 directions
Pair 3 (Material↔Collective): 6 directions
Pair 4 (Material↔Progress): 6 directions
Pair 5 (Material↔Preservation): 6 directions
Pair 6 (Material↔Flourishing): 7 directions
Pair 7 (Sustainable↔Individual): 6 directions
Pair 8 (Sustainable↔Collective): 6 directions
Pair 9 (Sustainable↔Progress): 6 directions
Pair 10 (Sustainable↔Preservation): 5 directions
Pair 11 (Sustainable↔Flourishing): 5 directions
Pair 12 (Individual↔Collective): 7 directions
Pair 13 (Individual↔Progress): 6 directions
Pair 14 (Individual↔Preservation): 5 directions
Pair 15 (Individual↔Flourishing): 5 directions
Pair 16 (Collective↔Progress): 6 directions
Pair 17 (Collective↔Preservation): 5 directions
Pair 18 (Collective↔Flourishing): 5 directions
Pair 19 (Progress↔Preservation): 6 directions
Pair 20 (Progress↔Flourishing): 8 directions
Pair 21 (Preservation↔Flourishing): 6 directions
```

**VALID_RHETORIC_TAGS:** No change (keep 33 v1 tags).
**VALID_STRUCTURE_TYPES:** No change (keep structure_1 through structure_7).
**VALID_PARAGRAPH_TYPES:** No change (keep introduction, body_1, body_2, body_3, conclusion).

### Cell 11 — Pydantic Schema: NO CHANGE

The EssayOutput and SentenceOutput models stay the same:
- `structure_type` field remains
- `direction_tag` validator will work because it checks against VALID_DIRECTION_TAGS (which we updated)
- `rhetoric_tag` validator will work (same 33 tags)

### Cell 13 — Framework Upload & System Prompt: MINOR UPDATE

Update the `REQUIRED_DOCS` dictionary to expect the new filenames:
- `Thinking.md` → `Thinking-v2.md`
- `Reference.md` → `Reference-v2.md`
- `Prompt.md` → `Prompt-v2.md`

The system prompt builder embeds these documents — the content change happens automatically through the new file contents. No logic change needed.

### Cell 18 — Generator Function: NO CHANGE

The function calls GPT-4o with the system prompt and parses JSON output. No logic depends on specific direction names or counts.

### All other cells: NO CHANGE

- Cell 3 (dependencies): same
- Cell 7 (embedding model): same
- Cell 15 (question upload): same
- Cell 20–21 (spot check): same
- Cell 23–29 (Supabase write + verify): same

---

## Execution Order

1. **Create Reference-v2.md** — assemble from v3.0 Section 1 + v1 Sections 2–3
2. **Create Thinking-v2.md** — assemble from v3.0 Parts 1–3 + v1 Parts 3–6 + new Flourishing entries
3. **Create Prompt-v2.md** — adapt v1 with direction count updates + Flourishing pole
4. **Update Pipeline 1 Cell 9** — replace 43 direction IDs with 131
5. **Update Pipeline 1 Cell 13** — update expected filenames
6. **Verify** — spot-check that all 131 direction NAMEs in Reference-v2.md Section 1 match VALID_DIRECTION_TAGS in Cell 9

---

## Risk / Decision Points

| Decision | Options | Recommendation |
|---|---|---|
| Flourishing cross-axis knowledge in Thinking-v2 | A: Write new entries. B: Skip, rely on direction entries. | A — write brief entries. The LLM needs "essential nature" context to select directions well. |
| v1 stability labels in Thinking-v2 | A: Keep stability matrix. B: Drop it. | A — keep it. It helps the LLM avoid structurally weak arguments. Add Flourishing rows. |
| Rhetoric tag set | v1 numbered (33) vs v3.0 generic | v1 numbered — required by structure templates. |

---

**END OF EDIT PLAN**
