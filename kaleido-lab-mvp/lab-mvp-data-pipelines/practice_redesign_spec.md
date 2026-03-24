# Encoding Redesign Spec v3.0

_Kaleido Lab · 2026 · Status: Locked_

> **What this file is:** The authoritative production spec for Pipeline 3 assembly of the encoding phase. It defines every rule P3 must follow to produce a valid `practices` JSONB array that the School can render without ambiguity. Read alongside the LAB→SCHOOL CONTRACT for the exact output shape each practice must conform to.

---

## 1. Overview

This spec documents two changes to the P1 encoding phase:

1. **Question trim** — reducing from ~114 to ~61 questions per unit by dropping redundant templates and capping practices.
2. **PoV Encoding phase** — a new phase inserted between P0 Cold Write and Essay Encoding that anchors the early part of the unit explicitly in the essay's Points of View before the student studies rhetoric and language.

The result is a four-part unit flow:

```
P0 — Cold Write         (unchanged baseline capture)
PoV Intro Screen        (new — read + confirm, no questions)
PoV Encoding            (new — L3M_POV + L2M_POV)
Essay Encoding          (renamed from P1 — trimmed)
L4W — Essay Write gate  (unchanged)
```

---

## 2. Full Practice Order and `practice_code` Values

The `practices` JSONB array contains **14 items** in this fixed order. The School switches on `practice_code` to know what to render. Every item must carry exactly the `practice_code` string listed here.

|Index|`practice_code`|Name|Phase|Has `versions[]`?|~Questions|
|---|---|---|---|---|---|
|0|`P0`|Cold Write|Cold Write|No|1|
|1|`POV_INTRO`|PoV Introduction Screen|PoV Intro|No|0 (read + confirm only)|
|2|`L3M_POV`|Paragraph MCQ — PoV|PoV Encoding|Yes (V1, V2)|4–6|
|3|`L2M_POV`|Sentence MCQ — PoV|PoV Encoding|Yes (V1, V2)|3–5 per direction|
|4|`L4M`|Essay MCQ|Essay Encoding|Yes (V1, V2)|2|
|5|`L2M`|Sentence MCQ — Rhetoric|Essay Encoding|Yes (V1, V2)|≤6|
|6|`L1M`|Lexical MCQ|Essay Encoding|Yes (V1, V2)|~8|
|7|`L1S`|Lexical Scramble|Essay Encoding|Yes (V1, V2)|≤10|
|8|`L2S`|Sentence Scramble|Essay Encoding|Yes (V1, V2)|~14|
|9|`L3S`|Paragraph Scramble|Essay Encoding|Yes (V1, V2)|~3|
|10|`L4S`|Essay Scramble|Essay Encoding|Yes (V1, V2)|1|
|11|`L1F`|Phrase Fill|Essay Encoding|Yes (V1, V2)|≤10|
|12|`L2F`|Sentence Fill|Essay Encoding|No|≤5|
|13|`L4W`|Essay Write|Write Gate|No|1|

> **Array length change:** The old contract specified 12 items (`P0` through `L4W`). This spec adds 2 new items (`POV_INTRO` at index 1 and `L2M_POV` at index 3; `L3M_POV` replaces what was `L3M` in the old Essay Encoding phase). The School must update its fixed-length assumption from 12 to 14. See the contract update for the revised `PracticeSchema` union.

---

## 3. Shared Definitions

### 3.1 Body sentences

"Body sentences" means all sentences where `paragraph_type` starts with `body_` — i.e. `body_1`, `body_2`, `body_3`. Introduction and conclusion sentences are excluded unless a practice explicitly states otherwise.

### 3.2 V1 / V2 versioning

For all versioned practices: V1 and V2 contain **the same questions** (same prompts, same correct answers) with **different wrong options** drawn from the tier pool. The correct answer is never changed between versions. This gives the student a fresh attempt angle on retry without changing what they are learning.

### 3.3 Distractor pool

All distractor sourcing uses **the tier pool the student enrolled in** (`tier_50` or `tier_80`). The same-essay pool is used first where specified; the tier pool is the fallback (and in most cases the primary source). Null-`direction_tag` sentences are never eligible as distractors in any direction-based practice.

### 3.4 Dominant direction of a paragraph

The `direction_tag` that appears on the most sentences in that paragraph. On a tie, use the `direction_tag` of the earliest sentence (lowest `order`) in that paragraph.

---

## 4. PoV Introduction Screen (`POV_INTRO`)

### 4.1 Purpose

Sits immediately after P0. The student has submitted their cold write and has not yet seen the model essay. This screen introduces the PoVs the essay develops, giving the student a conceptual frame before they read.

### 4.2 Assembly rule

Collect all unique `direction_tag` values present on any sentence in the essay. Order by first appearance (lowest `paragraph_type` + `order`). For each, look up `argument`, `logic`, and `blog_url` from `DIRECTION_LOOKUP`.

### 4.3 `DIRECTION_LOOKUP` — new field

One new field added to each entry in `DIRECTION_LOOKUP`:

|Field|Type|Description|
|---|---|---|
|`argument`|string|The PoV's core claim — shown as card heading and MCQ option text|
|`logic`|string|Short explanation of the reasoning behind the argument|
|`blog_url`|`string \| null`|URL of the deep-dive blog post. `null` until blog is authored.|

```python
# Example entry
"collective_progress_forward": {
    "argument": "Human progress is driven by collective cooperation and shared knowledge.",
    "logic":    "When individuals pool effort and ideas, outcomes exceed what any one person could achieve alone.",
    "blog_url": None  # set to URL once blog post is published
}
```

### 4.4 Output shape

```json
{
  "practice_code": "POV_INTRO",
  "directions": [
    {
      "direction_tag": "collective_progress_forward",
      "argument": "Human progress is driven by collective cooperation and shared knowledge.",
      "logic": "When individuals pool effort and ideas, outcomes exceed what any one person could achieve alone.",
      "blog_url": null
    }
  ]
}
```

**School rendering contract:** The School renders one PoV card per item in `directions[]`. Each card shows `argument` as heading, `logic` as body, and a deep-dive button linked to `blog_url`. The button is always rendered; it is disabled when `blog_url` is `null`. A CTA button — "I have understood these PoVs — ready to study the essay" — gates forward to `L3M_POV`. No `versions[]` array. No questions array. No `pass` tracking.

---

## 5. PoV Encoding

The school app renders the model essay for the student to read before the first question in this phase.

### 5.1 L3M_POV — Paragraph MCQ

Two question types. Combined 4–6 questions. Uses the standard MCQ output shape with `practice_code: "L3M_POV"`.

#### Question type P1 — which PoV does this paragraph develop?

|Field|Value|
|---|---|
|Context shown|Full paragraph text (all sentences of that paragraph, in order)|
|Prompt|"Which PoV argument is this paragraph based on?"|
|Options|5 × `direction.argument` strings|
|Correct answer|`direction.argument` of this paragraph's dominant `direction_tag`|
|Count|One question per body paragraph — ~2–3 per unit|
|Distractors|`direction.argument` texts from tier pool with a different `direction_tag`|

#### Question type P2 — which paragraph develops this PoV?

|Field|Value|
|---|---|
|Context shown|`direction.argument` + `direction.logic` for one `direction_tag`|
|Prompt|"Which paragraph is developing this PoV?"|
|Options|5 × paragraph texts (full paragraph, all sentences joined)|
|Correct answer|The body paragraph whose dominant `direction_tag` matches the target|
|Count|One question per unique `direction_tag` in essay — ~2–3 per unit|
|Distractors|Other body paragraphs from the same essay first; fall back to body paragraphs from tier pool essays if fewer than 4 same-essay options exist. Filter: different dominant `direction_tag` than the target. Note: since an essay has at most 3 body paragraphs, tier pool fallback is always required.|

#### V1 / V2 for L3M_POV

Same questions, different distractor sets drawn from tier pool.

---

### 5.2 L2M_POV — Sentence MCQ

Up to 4 prompt types. **Cap: maximum 2 questions per direction_tag.** Generation is per direction — for each `direction_tag` in the essay, generate up to 2 questions using whichever prompt types are valid, in priority order: P1 → P2 → P3 → P4. Stop once 2 questions have been generated for that direction.

**Context shown (all prompt types):** `direction.argument` + `direction.logic` of the target PoV. The student sees the PoV description and selects among sentence options. The sentence is never context — it is always an option.

**Options format:** Each option is the full `canonical_text` of a sentence.

|Code|Prompt|Valid when|Correct answer|Wrong options|
|---|---|---|---|---|
|P1 — evidence|"Which sentence supports this PoV with a concrete example?"|Essay has ≥1 sentence with this `direction_tag` AND `rhetoric_tag` ∈ {`example_1`, `example_2`, `advantage_1`, `advantage_2`}|One such sentence's `canonical_text`|Sentences from tier pool with a different non-null `direction_tag`|
|P2 — mechanism|"Which sentence develops the reasoning behind this PoV?"|Essay has ≥1 sentence with this `direction_tag` AND `rhetoric_tag` ∈ {`explanation`, `cause_1`, `cause_2`, `effect_1`, `effect_2`}|One such sentence's `canonical_text`|Sentences from tier pool with a different non-null `direction_tag`|
|P3 — problem|"Which sentence identifies a problem or downside related to this PoV?"|Essay has ≥1 sentence with this `direction_tag` AND `rhetoric_tag` ∈ {`problem_1`, `problem_2`, `disadvantage_1`, `disadvantage_2`}|One such sentence's `canonical_text`|Sentences from tier pool with a different non-null `direction_tag`|
|P4 — not related|"Which sentence is arguing for a different point of view?"|Essay has ≥1 sentence with a different non-null `direction_tag` (always true in a multi-PoV essay)|One sentence's `canonical_text` where `direction_tag` ≠ target and is not null|Sentences from tier pool with the same `direction_tag` as the target PoV|

> **Note on P2:** P2 subsumes both explanation-type and cause/effect tags into one prompt. There is no separate cause prompt. This prevents two questions sharing the same correct answer.

#### Generation algorithm

```
for each direction_tag D in essay (ordered by first appearance):
    questions_generated = 0
    for each prompt_type in [P1, P2, P3, P4]:
        if questions_generated >= 2: break
        if prompt_type is valid for D in this essay:
            generate question → append to L2M_POV questions list
            questions_generated += 1
```

#### V1 / V2 for L2M_POV

Same questions (same prompts, same correct answers), different wrong options drawn from tier pool.

---

## 6. Essay Encoding — Changes vs Old Spec

|`practice_code`|Change|New scope|
|---|---|---|
|`L4M`|Reduced from 3 to 2 questions; essay structure question dropped (`structure_type` field removed from prompt)|Q1: Which IELTS question? · Q2: Which pair of directions?|
|`L2M`|Template B (PoV identification) dropped — that work is now in `L2M_POV`. Template A (rhetoric role) retained, capped at 6. Context shown: the sentence itself. Options: `rhetoric_label` texts.|Rhetoric role only; body sentences; cap 6|
|`L1M`|One question per body sentence (was one per lexical item); noun-phrase items only|First noun-phrase `lexical_item` per body sentence blanked; ~8 questions|
|`L1S`|Capped at 10|First 10 multi-word lexical items in essay order|
|`L2S`|Clause-based chunking via spaCy (was word-level)|Body sentences only; ~14 questions|
|`L3S`|Unchanged|One question per body paragraph; ~3 questions|
|`L4S`|Unchanged|1 question|
|`L1F`|Capped at 10|First 10 body sentences with lexical items, in essay order|
|`L2F`|Body paragraphs only (was all paragraphs); capped at 5|First 5 body sentences in essay order|

> **L3M is removed entirely from Essay Encoding.** The old `L3M` item at index 2 of the practices array no longer exists. Its PoV-per-paragraph work now lives in `L3M_POV` (index 2 in the new ordering). See Section 2 for the updated index map.

---

## 7. Question Count Summary

|`practice_code`|Phase|Min|Max|Notes|
|---|---|---|---|---|
|`P0`|Cold Write|1|1|Fixed|
|`POV_INTRO`|PoV Intro|0|0|No questions|
|`L3M_POV`|PoV Encoding|4|6|~2–3 per Q type × 2 types|
|`L2M_POV`|PoV Encoding|2|8|Max 2 per direction × directions in essay|
|`L4M`|Essay Encoding|2|2|Fixed|
|`L2M`|Essay Encoding|1|6|Body sentences; cap 6|
|`L1M`|Essay Encoding|6|10|~8 typical|
|`L1S`|Essay Encoding|10|10|Capped at 10|
|`L2S`|Essay Encoding|10|18|~14 typical|
|`L3S`|Essay Encoding|2|3|One per body paragraph|
|`L4S`|Essay Encoding|1|1|Fixed|
|`L1F`|Essay Encoding|10|10|Capped at 10|
|`L2F`|Essay Encoding|5|5|Capped at 5|
|`L4W`|Write Gate|1|1|Fixed|
|**TOTAL**|—|**55**|**81**|Typical ~63; was ~114 before redesign|

---

## 8. Design Decisions (Locked)

|#|Decision|Rule|
|---|---|---|
|1|Which directions surface on `POV_INTRO`?|All unique `direction_tag` values on any sentence in the essay, ordered by first appearance|
|2|Dominant direction of a paragraph|Most-frequent `direction_tag` in that paragraph's sentences. Tie → earliest sentence's tag|
|3|Which L2M_POV prompt types are generated?|Only types where ≥1 sentence with matching `rhetoric_tag` exists under that `direction_tag` in the essay|
|4|L2M_POV cap rule|Max 2 questions per `direction_tag`; priority order P1 → P2 → P3 → P4|
|5|L2M_POV context shown|Always `direction.argument` + `direction.logic`. Sentence is always an option, never context|
|6|L2M_POV wrong options|Sentences from tier pool. Null-`direction_tag` sentences never eligible as distractors|
|7|V1 / V2 mechanic|Same questions, same correct answers, different wrong options drawn from tier pool|
|8|`blog_url` display|Always render button on PoV card; disable (greyed out) when `blog_url` is `null`|
|9|Body sentences definition|Any sentence where `paragraph_type` starts with `body_`|
|10|L3M_POV-P2 distractor source|Same essay body paragraphs first; tier pool fallback always required (max 3 body paragraphs per essay)|
|11|Essay Encoding L2M context|Unchanged from old spec: context = the sentence itself; options = `rhetoric_label` texts|

---

## 9. Assembler Map (P3)

|`practice_code`|Assembler function|Primary data source|
|---|---|---|
|`P0`|`assemble_P0`|`prep_unit.question`|
|`POV_INTRO`|`assemble_POV_INTRO`|snapshot + `DIRECTION_LOOKUP` (argument, logic, blog_url per unique `direction_tag`)|
|`L3M_POV`|`assemble_L3M_POV`|snapshot + `DIRECTION_LOOKUP` + dominant direction rule + tier pool|
|`L2M_POV`|`assemble_L2M_POV`|snapshot + `DIRECTION_LOOKUP` + `rhetoric_tag` presence check + tier pool|
|`L4M`|`assemble_L4M`|snapshot + `DIRECTION_LOOKUP` (2 questions; structure question removed)|
|`L2M`|`assemble_L2M`|snapshot + `RHETORIC_LABEL_LOOKUP` (body sentences; cap 6)|
|`L1M`|`assemble_L1M`|snapshot (body sentences; first noun-phrase item per sentence)|
|`L1S`|`assemble_L1S`|snapshot (cap 10; first 10 multi-word items in essay order)|
|`L2S`|`assemble_L2S`|snapshot + spaCy clause chunking (body sentences)|
|`L3S`|`assemble_L3S`|snapshot + `RHETORIC_LABEL_LOOKUP` (unchanged)|
|`L4S`|`assemble_L4S`|snapshot (unchanged)|
|`L1F`|`assemble_L1F`|snapshot + `pos_tag()` (cap 10; body sentences)|
|`L2F`|`assemble_L2F`|snapshot + `RHETORIC_LABEL_LOOKUP` (cap 5; body sentences)|
|`L4W`|`assemble_L4W`|returns `{ "practice_code": "L4W" }` — unchanged|

> `assemble_L3M_POV` and `assemble_L2M_POV` are new functions. The old `assemble_L3M` is retired — it is no longer called in the encoding pipeline. The old `assemble_L2M` is retained for Essay Encoding only.

---

_END OF SPEC_