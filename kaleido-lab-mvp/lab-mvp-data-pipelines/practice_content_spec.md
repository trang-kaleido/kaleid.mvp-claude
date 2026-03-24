# Practice Content Spec

_Kaleido Lab · Version 2.0 · 2026 · Status: Production_

> **What this file is:** The complete, self-contained assembly specification for Pipeline 3. It defines every rule P3 must follow to produce a valid `practices` JSONB array for every prep-unit. An agent or developer reading only this file and the LAB→SCHOOL CONTRACT v3 has everything needed to build P3. No other document is required.

---

## 1. The Three Dimensions of Practice

Every sentence in the model essay carries data across three dimensions:

|Dimension|Data source|What the student learns|
|---|---|---|
|**Direction**|`direction_tag`|What the essay is arguing — which PoV each sentence supports|
|**Rhetoric**|`rhetoric_tag`|How the essay is built — what structural role each sentence plays|
|**Language**|`lexical_items` + `syntax_items`|How the argument is expressed — exact phrases and sentence structures|

Direction is now introduced first. Rhetoric and language follow.

---

## 2. Shared Definitions

### 2.1 Body sentences

"Body sentences" means all sentences where `paragraph_type` starts with `body_` — i.e. `body_1`, `body_2`, `body_3`. Introduction and conclusion sentences are excluded unless a practice explicitly states otherwise.

### 2.2 Dominant direction of a paragraph

The `direction_tag` that appears on the most sentences in that paragraph. On a tie, use the `direction_tag` of the earliest sentence (lowest `order`) in that paragraph.

### 2.3 V1 / V2 versioning

All versioned practices produce exactly two versions. V1 and V2 contain the **same questions** (same prompts, same correct answers) with **different wrong options** drawn from the tier pool. The correct answer — and its question stem — never changes between versions. `correct_index` may differ between V1 and V2 because the correct option sits at a different position in each options array.

The retry cycle (`V1 → V2 → V1`) is managed by the School app. P3 outputs V1 and V2 only — no V3.

### 2.4 Distractor pool

Unless a practice states otherwise, distractors are drawn from **the tier pool the student enrolled in** (`tier_50` or `tier_80`). Always exactly 4 wrong options. If the same-essay pool is insufficient, fall back to the tier pool. Null-`direction_tag` sentences are never eligible as distractors in any direction-based practice.

### 2.5 Always 5 options

Every MCQ question has exactly 5 options (1 correct + 4 distractors). No exceptions.

---

## 3. Practice Order and `practice_code` Values

The `practices` JSONB array contains **14 items** in this fixed order. The School switches on `practice_code` to render each item.

|Index|`practice_code`|Name|Phase|Versioned?|~Questions|
|---|---|---|---|---|---|
|0|`P0`|Cold Write|Cold Write|No|1|
|1|`POV_INTRO`|PoV Introduction Screen|PoV Intro|No|0|
|2|`L3M_POV`|Paragraph MCQ — PoV|PoV Encoding|Yes|4–6|
|3|`L2M_POV`|Sentence MCQ — PoV|PoV Encoding|Yes|3–8|
|4|`L4M`|Essay MCQ|Essay Encoding|Yes|2|
|5|`L2M`|Sentence MCQ — Rhetoric|Essay Encoding|Yes|≤6|
|6|`L1M`|Lexical MCQ|Essay Encoding|Yes|~8|
|7|`L1S`|Lexical Scramble|Essay Encoding|Yes|≤10|
|8|`L2S`|Sentence Scramble|Essay Encoding|Yes|~14|
|9|`L3S`|Paragraph Scramble|Essay Encoding|Yes|~3|
|10|`L4S`|Essay Scramble|Essay Encoding|Yes|1|
|11|`L1F`|Phrase Fill|Essay Encoding|Yes|≤10|
|12|`L2F`|Sentence Fill|Essay Encoding|No|≤5|
|13|`L4W`|Essay Write|Write Gate|No|1|

---

## 4. The 7 Essay Structures — Rhetoric Tag Maps

Each structure defines which `rhetoric_tag` values appear and how many times. P3 uses this to determine valid question counts per practice per essay.

### Structure 1 — 4-Paragraph Discuss Both Views

```
INTRODUCTION    paraphrase_question (1), outline_statement (1)
BODY 1          topic_sentence (1), explanation (1), example_1 (1), example_2 (1), mini_conclusion (1)
BODY 2          topic_sentence (1), explanation (1), example_1 (1), example_2 (1), mini_conclusion (1)
CONCLUSION      opinion_statement (1)
```

Bodies: 2 | topic_sentences: 2 | mini_conclusions: 2 | examples: 4

### Structure 2 — 5-Paragraph Discuss Both Views + Opinion

```
INTRODUCTION    paraphrase_question (1), outline_statement (1)
BODY 1          topic_sentence (1), explanation (1), example_1 (1), mini_conclusion (1)
BODY 2          topic_sentence (1), explanation (1), example_1 (1), mini_conclusion (1)
BODY 3          opinion_topic_sentence (1), reason_1 (1), example_1 (1), reason_2 (1), synthesis (1)
CONCLUSION      restate_thesis (1)
```

Bodies: 3 | topic_sentences: 2 + 1 opinion | mini_conclusions: 2 | examples: 3

### Structure 3 — 4-Paragraph Opinion-Led

```
INTRODUCTION    paraphrase_question (1), clear_thesis_statement (1)
BODY 1          topic_sentence (1), explanation (1), example_1 (1), example_2 (1), link_to_thesis (1)
BODY 2          topic_sentence (1), explanation (1), example_1 (1), example_2 (1), link_to_thesis (1)
CONCLUSION      restate_thesis (1)
```

Bodies: 2 | topic_sentences: 2 | examples: 4 | link_to_thesis: 2

### Structure 4 — 5-Paragraph Opinion + Counterargument

```
INTRODUCTION    paraphrase_question (1), clear_thesis_statement (1)
BODY 1          topic_sentence (1), explanation (1), example_1 (1), link_to_thesis (1)
BODY 2          topic_sentence (1), explanation (1), example_1 (1), link_to_thesis (1)
BODY 3          acknowledge_opposing_view (1), concession (1), rebuttal (1), return_to_thesis (1)
CONCLUSION      restate_thesis (1)
```

Bodies: 3 | topic_sentences: 2 | counterargument block: 4 unique tags

### Structure 5 — 4-Paragraph Advantages–Disadvantages

```
INTRODUCTION    paraphrase_question (1), outline_statement (1)
BODY 1          topic_sentence (1), advantage_1 (1), example_1 (1), advantage_2 (1), example_2 (1)
BODY 2          topic_sentence (1), disadvantage_1 (1), example_1 (1), disadvantage_2 (1), example_2 (1)
CONCLUSION      which_outweighs_opinion (1)
```

Bodies: 2 | topic_sentences: 2 | advantages: 2 | disadvantages: 2 | examples: 4

### Structure 6 — 4-Paragraph Problem–Solution

```
INTRODUCTION    paraphrase_question (1), outline_statement (1)
BODY 1          topic_sentence (1), problem_1 (1), example_1 (1), problem_2 (1), example_2 (1)
BODY 2          topic_sentence (1), solution_1 (1), example_1 (1), solution_2 (1), example_2 (1)
CONCLUSION      summary_statement (1)
```

Bodies: 2 | topic_sentences: 2 | problems: 2 | solutions: 2 | examples: 4

### Structure 7 — 5-Paragraph Causes–Effects–Solutions

```
INTRODUCTION    paraphrase_question (1), outline_statement (1)
BODY 1          topic_sentence (1), cause_1 (1), example_1 (1), cause_2 (1)
BODY 2          topic_sentence (1), effect_1 (1), example_1 (1), effect_2 (1)
BODY 3          topic_sentence (1), solution_1 (1), example_1 (1), solution_2 (1)
CONCLUSION      summary_statement (1)
```

Bodies: 3 | topic_sentences: 3 | causes: 2 | effects: 2 | solutions: 2

---

## 5. Write Practices

### 5.1 `P0` — Cold Write

One question per prep-unit. Student writes a full essay before studying anything — the "before" baseline for the Educator Console.

**Assembly:**

```json
{
  "practice_code": "P0",
  "question": "<full IELTS question text from prep_unit.question>",
  "prompt": "Write a complete IELTS Task 2 essay in response to this question:"
}
```

- Source: `prep_unit.question`
- No versions array. No questions array. No hints.
- Output = Artifact 1, sent to Educator Console on submission.

---

### 5.2 `L4W` — Essay Write

One question per prep-unit. P3 outputs a minimal object — the School renders using `prep_unit.question` directly.

**Assembly:**

```json
{
  "practice_code": "L4W"
}
```

- No versions array. No questions array.
- School renders the `prep_unit.question` and a 40-minute countdown timer.
- Output = Artifact 2, sent to Educator Console. Submission = unit gate.

---

## 6. PoV Introduction Screen

### 6.1 `POV_INTRO` — PoV Introduction Screen

No questions. The School renders one PoV card per item in `directions[]`. A CTA button gates forward to `L3M_POV`.

**Assembly rule:** Collect all unique `direction_tag` values present on any sentence in the essay. Order by first appearance (lowest `paragraph_type` index, then lowest `order` within that paragraph). For each, look up `argument`, `logic`, and `blog_url` from `DIRECTION_LOOKUP`.

**Output shape:**

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

- `blog_url` is `null` until the blog post is authored. School renders the deep-dive button as disabled when `null`.
- No `versions[]` array. No `StudentAttempt` record written by School.

---

## 7. PoV Encoding Practices

The School renders the model essay for the student to read before the first question in this phase.

### 7.1 `L3M_POV` — Paragraph MCQ (PoV Encoding)

Two question types. Combined 4–6 questions. Uses the standard MCQ shape.

#### Question type P1 — which PoV does this paragraph develop?

|Field|Rule|
|---|---|
|Prompt|"Which PoV argument is this paragraph based on?"|
|Context|Full paragraph text — all sentences of the target paragraph joined in order|
|Options|5 × `direction.argument` strings|
|Correct answer|`direction.argument` of the paragraph's dominant `direction_tag`|
|Distractors|`direction.argument` texts from tier pool with a different `direction_tag`|
|Count|One question per body paragraph — ~2–3 per unit|
|Question `id`|`"L3M_POV-P1-<paragraph_type>"` e.g. `"L3M_POV-P1-body_1"`|

#### Question type P2 — which paragraph develops this PoV?

|Field|Rule|
|---|---|
|Prompt|"Which paragraph is developing this PoV?"|
|Context|`direction.argument` + `"\n\n"` + `direction.logic` for one `direction_tag`|
|Options|5 × paragraph texts (all sentences of that paragraph joined in order)|
|Correct answer|The body paragraph whose dominant `direction_tag` matches the target|
|Distractors|Other body paragraphs from the same essay first; tier pool body paragraphs as fallback. Filter: dominant `direction_tag` ≠ target. Note: essays have at most 3 body paragraphs, so tier pool fallback is always required.|
|Count|One question per unique `direction_tag` in essay — ~2–3 per unit|
|Question `id`|`"L3M_POV-P2-<direction_tag>"` e.g. `"L3M_POV-P2-collective_progress_forward"`|

#### V1 / V2

Same questions, different distractor sets drawn from tier pool.

---

### 7.2 `L2M_POV` — Sentence MCQ (PoV Encoding)

Up to 4 prompt types per `direction_tag`. **Cap: maximum 2 questions per `direction_tag`.** Priority order for selection: P1 → P2 → P3 → P4. Stop once 2 questions have been generated for that direction.

**Context shown (all prompt types):** `direction.argument` + `"\n\n"` + `direction.logic` of the target PoV. The student sees the PoV description and selects among sentence options. The sentence is never context — it is always an option. Options are full `canonical_text` strings.

#### Prompt types

|Code|Prompt|Valid when|Correct answer|
|---|---|---|---|
|P1 — evidence|"Which sentence supports this PoV with a concrete example?"|Essay has ≥1 sentence with this `direction_tag` AND `rhetoric_tag` ∈ {`example_1`, `example_2`, `advantage_1`, `advantage_2`}|One such sentence's `canonical_text`|
|P2 — mechanism|"Which sentence develops the reasoning behind this PoV?"|Essay has ≥1 sentence with this `direction_tag` AND `rhetoric_tag` ∈ {`explanation`, `cause_1`, `cause_2`, `effect_1`, `effect_2`}|One such sentence's `canonical_text`|
|P3 — problem|"Which sentence identifies a problem or downside related to this PoV?"|Essay has ≥1 sentence with this `direction_tag` AND `rhetoric_tag` ∈ {`problem_1`, `problem_2`, `disadvantage_1`, `disadvantage_2`}|One such sentence's `canonical_text`|
|P4 — not related|"Which sentence is arguing for a different point of view?"|Essay has ≥1 sentence with a different non-null `direction_tag` (always true in a multi-PoV essay)|One sentence's `canonical_text` where `direction_tag` ≠ target and is not null|

> P2 (mechanism) subsumes explanation-type and cause/effect tags into one prompt — there is no separate cause prompt. This prevents two questions from sharing the same correct answer.

#### Distractor rules

|Prompt type|Wrong options|
|---|---|
|P1, P2, P3|Sentences from tier pool with a different non-null `direction_tag`|
|P4|Sentences from tier pool with the same `direction_tag` as the target PoV|

#### Generation algorithm

```python
for direction_tag D in essay (ordered by first appearance):
    questions_generated = 0
    for prompt_type in [P1, P2, P3, P4]:
        if questions_generated >= 2:
            break
        if prompt_type is valid for D in this essay:
            generate question
            questions_generated += 1
```

#### Question `id` format

`"L2M_POV-<prompt_code>-<direction_tag>"` e.g. `"L2M_POV-P1-collective_progress_forward"`

#### V1 / V2

Same questions, same correct answers, different wrong options drawn from tier pool.

---

## 8. Essay Encoding — MCQ Practices

### 8.1 `L4M` — Essay MCQ

2 fixed questions per unit.

|Q|`id`|Prompt|Context|Correct answer|Distractor source|
|---|---|---|---|---|---|
|1|`"L4M-1"`|"Which IELTS question does this essay respond to?"|`""` (empty — student has read the essay)|`prep_unit.question`|4 other `question` texts from tier pool|
|2|`"L4M-2"`|"Which pair of PoVs does this essay develop?"|`""`|Pair of `direction.argument` texts from this essay joined as one option string|4 other direction pairs from tier pool via `DIRECTION_LOOKUP`|

> The old Q3 (essay structure identification) is removed. `structure_type` is no longer used as a question source.

#### V1 / V2

Same 2 questions, different distractor sets.

---

### 8.2 `L2M` — Sentence MCQ (Rhetoric)

Rhetoric role identification only. Body sentences only. Cap at 6 questions.

**Template — Rhetoric role identification**

|Field|Rule|
|---|---|
|Scope|Body sentences only (`paragraph_type` starts with `body_`)|
|Cap|First 6 body sentences in essay order|
|Prompt|"What structural role does this sentence play?"|
|Context|The sentence's `canonical_text`|
|Correct answer|`rhetoric_label` from `RHETORIC_LABEL_LOOKUP` for this sentence's `rhetoric_tag`|
|Distractors|4 other `rhetoric_label` values — drawn from tags that appear in this essay's `structure_type` only (not arbitrary from all 33)|
|Question `id`|`"L2M-<paragraph_type>-S<order>"` e.g. `"L2M-body_1-S2"`|

#### V1 / V2

Same questions, different distractor sets drawn from same-structure-type tags in tier pool.

---

### 8.3 `L1M` — Lexical MCQ

One question per body sentence. Noun-phrase items only. ~8 questions.

**Template — Exact phrase in context**

|Field|Rule|
|---|---|
|Scope|Body sentences only|
|Selection|For each body sentence, find the first lexical item where `pos` is `"NOUN"` (covers ADJ+NOUN and NOUN+NOUN compounds). If no noun-phrase item exists in the sentence, skip it.|
|Prompt|"All options appear in the essay — which phrase belongs here?"|
|Context|The sentence's `canonical_text` with the target `lexical_item.phrase` replaced by `"___"`|
|Correct answer|The exact `lexical_item.phrase`|
|Distractors|4 other noun-phrase `lexical_item.phrase` values from the **same essay**. Same POS where possible; any noun-phrase otherwise.|
|Question `id`|`"L1M-<paragraph_type>-S<order>"` e.g. `"L1M-body_1-S1"`|

> Distractors for `L1M` are drawn from the same essay, not the tier pool. This is the only MCQ practice where same-essay distractors are used exclusively.

#### V1 / V2

Same questions, different distractor selection from the same essay's noun-phrase pool.

---

## 9. Essay Encoding — Scramble Practices

### 9.1 `L1S` — Lexical Scramble

One question per multi-word lexical item. **Cap: first 10 multi-word items in essay order** (items with ≥2 words). Single-word items skipped.

**Per question:**

|Field|Rule|
|---|---|
|Source|`lexical_item.phrase` where `phrase.split()` has ≥2 words|
|Selection|First 10 qualifying items in essay order (intro → body_1 → body_2 [→ body_3] → conclusion)|
|Chips|`phrase.split()` — individual words|
|Prompt|"Arrange these words into the correct phrase."|
|Answer|The original `lexical_item.phrase`|
|Question `id`|`"L1S-<N>"` where N is 1-based position in selected list|

**V1 / V2:** Different shuffles of the same chips. Ensure V1 and V2 chip orders differ.

---

### 9.2 `L2S` — Sentence Scramble

One question per body sentence. Clause-based chunking via spaCy. ~14 questions.

**Scope:** Body sentences only.

**Chunking algorithm** (deterministic, no LLM):

Walk through `canonical_text` word by word. When a substring matches a `lexical_item.phrase` (match longest phrase first), treat the entire phrase as one unbreakable chunk with `is_lexical: true`. Use spaCy dependency parsing to split remaining non-lexical text into grammatical clause/phrase boundaries rather than individual words. This produces larger, more meaningful non-lexical chips compared to word-level splitting.

```python
def chunk_sentence(canonical_text, lexical_items):
    chunks = []
    remaining = canonical_text
    sorted_items = sorted(lexical_items, key=len, reverse=True)
    while remaining:
        matched = False
        for phrase in sorted_items:
            if remaining.startswith(phrase):
                chunks.append({"text": phrase, "is_lexical": True})
                remaining = remaining[len(phrase):].lstrip(" ")
                matched = True
                break
        if not matched:
            # spaCy clause boundary — group non-lexical words into clause chunks
            # Fall back to word-level split if spaCy unavailable
            word, _, remaining = remaining.partition(" ")
            chunks.append({"text": word, "is_lexical": False})
    return chunks
```

**Per question:**

|Field|Rule|
|---|---|
|Chunks|Output of `chunk_sentence()` — shuffled|
|Prompt|"Arrange these chunks into the correct sentence."|
|Hint|`syntax_items[0]` for that sentence if non-empty; fallback: `rhetoric_label` from `RHETORIC_LABEL_LOOKUP`|
|Answer|The original `canonical_text`|
|Question `id`|`"L2S-<paragraph_type>-S<order>"` e.g. `"L2S-body_1-S2"`|

**V1 / V2:** Different shuffles of the same chunks. Ensure V1 and V2 chunk orders differ.

---

### 9.3 `L3S` — Paragraph Scramble

One question per body paragraph. ~3 questions. Unchanged.

|Field|Rule|
|---|---|
|Scope|Body paragraphs only|
|Items|All sentences of the paragraph — each as `{ sentence_id, text: canonical_text }`|
|Shuffle|Drag-to-order stack|
|Prompt|"Arrange these sentences into the correct paragraph order."|
|Hint|Sequence of `rhetoric_label` values in correct order, joined with " → " e.g. `"Body — introduces the paragraph's main claim → Body — unpacks the causal mechanism → Body — first concrete evidence → Body — summarises the paragraph's logic"`|
|`answer_order`|Array of `sentence_id` values in correct order|
|Question `id`|`"L3S-<paragraph_type>"` e.g. `"L3S-body_1"`|

**V1 / V2:** Different shuffles of the same sentences.

---

### 9.4 `L4S` — Essay Scramble

One question per prep-unit. Unchanged.

|Field|Rule|
|---|---|
|Items|Opening sentence (`order = 1`) of each paragraph — each as `{ paragraph: paragraph_type, text: canonical_text }`|
|Shuffle|Drag-to-order stack|
|Prompt|"Arrange these paragraph openings into the correct essay order."|
|Hint|`structure_label` from `STRUCTURE_LOOKUP` — the human-readable structure name e.g. `"5-Paragraph Causes–Effects–Solutions"`|
|`answer_order`|Array of `paragraph_type` strings in correct essay order|
|Question `id`|`"L4S-1"`|

**V1 / V2:** Different shuffles of the same paragraph openers.

---

## 10. Essay Encoding — Fill Practices

### 10.1 `L1F` — Phrase Fill

One question per body sentence that contains at least one lexical item. Body sentences with no lexical items are skipped. **Cap: first 10 qualifying sentences in body order** (body_1 → body_2 [→ body_3], sentence order within each paragraph).

**Per question:**

```json
{
  "id": "L1F-body_1-S2",
  "paragraph": "body_1",
  "sentence_order": 2,
  "rhetoric_tag": "explanation",
  "prompt": "Fill in the missing phrases. Use the part of speech hint and similar phrases below each blank to understand what kind of phrase is missing.",
  "context": [
    { "order": 1, "text": "Short-term profit damages long-term survival.", "isTarget": false },
    {
      "order": 2,
      "parts": [
        { "type": "text", "text": "When companies focus on " },
        { "type": "blank", "blank_index": 0 },
        { "type": "text", "text": ", they neglect " },
        { "type": "blank", "blank_index": 1 },
        { "type": "text", "text": " entirely." }
      ],
      "isTarget": true
    },
    { "order": 3, "text": "This leads to a gradual erosion of competitive advantage.", "isTarget": false }
  ],
  "blanks": [
    {
      "index": 0,
      "answer": "immediate financial returns",
      "pos_hint": "PHRASE",
      "similar_phrases": ["short-term gains", "quarterly profits", "rapid revenue"]
    },
    {
      "index": 1,
      "answer": "long-term resilience",
      "pos_hint": "PHRASE",
      "similar_phrases": ["sustainable capacity", "future stability", "lasting strength"]
    }
  ]
}
```

**Assembly rules:**

- Context shows the full paragraph; only the target sentence has blanks — other sentences are plain text
- All lexical items in the target sentence are blanked simultaneously (multiple blanks per question)
- `pos_hint`: use `lexical_item.pos` from the sentence data
- `similar_phrases`: pre-computed by P2 via lexical embedding cosine similarity (0.5–0.7 range). P3 reads from P2 enriched snapshot — does not compute inline
- Accepted answers: exact phrase, case-insensitive
- `id` format: `"L1F-<paragraph_type>-S<order>"` e.g. `"L1F-body_1-S2"`

**V1 / V2:** Same blanks and same answers. Different `similar_phrases` selection from P2 output if multiple candidates exist; otherwise identical.

---

### 10.2 `L2F` — Sentence Fill

One question per body sentence. **Cap: first 5 body sentences in essay order** (body_1 → body_2 [→ body_3], sentence order within each paragraph).

**Per question:**

```json
{
  "id": "L2F-body_1-S2",
  "paragraph": "body_1",
  "sentence_order": 2,
  "rhetoric_tag": "explanation",
  "rhetoric_hint": "Body — unpacks the causal mechanism",
  "hint_sentences": [
    "Businesses that prioritise quarterly earnings often sacrifice research and development...",
    "A singular focus on revenue can erode the foundations that sustain an organisation..."
  ],
  "context": [
    { "order": 1, "text": "Short-term profit damages long-term survival.", "isTarget": false },
    { "order": 2, "text": "___", "isTarget": true },
    { "order": 3, "text": "This leads to a gradual erosion of competitive advantage.", "isTarget": false }
  ],
  "prompt": "Fill in the missing sentence. Use the hint sentences and structure label below to understand what kind of sentence belongs here."
}
```

**Assembly rules:**

- Scope: body sentences only; first 5 in body order
- Context shows the full paragraph with the target sentence replaced by `"___"`
- `rhetoric_hint`: look up `rhetoric_tag` in `RHETORIC_LABEL_LOOKUP`
- `hint_sentences`: pre-computed by P2 via sentence embedding cosine similarity (0.5–0.9 range, top-1, cross-essay only). P3 reads from P2 enriched snapshot. If P2 found no match, `hint_sentences` is an empty array `[]`
- No `answers[]` field — no grading. Student always advances on submit.
- No `versions[]` array — no retry.
- `id` format: `"L2F-<paragraph_type>-S<order>"` e.g. `"L2F-body_1-S2"`

---

## 11. Reference Lookups

### 11.1 `RHETORIC_LABEL_LOOKUP` (33 entries)

```python
RHETORIC_LABEL_LOOKUP = {
    "paraphrase_question":       "Introduction — restates the question in new words",
    "outline_statement":         "Introduction — previews the essay structure",
    "clear_thesis_statement":    "Introduction — states the writer's direct position",
    "topic_sentence":            "Body — introduces the paragraph's main claim",
    "explanation":               "Body — unpacks the causal mechanism",
    "example_1":                 "Body — first concrete evidence",
    "example_2":                 "Body — second concrete evidence",
    "mini_conclusion":           "Body — summarises the paragraph's logic",
    "link_to_thesis":            "Body — connects paragraph back to main argument",
    "opinion_topic_sentence":    "Opinion — opens with the writer's stance",
    "reason_1":                  "Opinion — first reason supporting the opinion",
    "reason_2":                  "Opinion — second reason supporting the opinion",
    "synthesis":                 "Opinion — combines ideas into a nuanced conclusion",
    "acknowledge_opposing_view": "Counterargument — introduces the opposing position",
    "concession":                "Counterargument — admits a valid point in opposition",
    "rebuttal":                  "Counterargument — refutes the opposing argument",
    "return_to_thesis":          "Counterargument — reasserts the writer's position",
    "problem_1":                 "Body — first problem identified",
    "problem_2":                 "Body — second problem identified",
    "solution_1":                "Body — first solution proposed",
    "solution_2":                "Body — second solution proposed",
    "cause_1":                   "Body — first cause identified",
    "cause_2":                   "Body — second cause identified",
    "effect_1":                  "Body — first effect described",
    "effect_2":                  "Body — second effect described",
    "advantage_1":               "Body — first advantage stated",
    "advantage_2":               "Body — second advantage stated",
    "disadvantage_1":            "Body — first disadvantage stated",
    "disadvantage_2":            "Body — second disadvantage stated",
    "opinion_statement":         "Conclusion — states the writer's final opinion",
    "restate_thesis":            "Conclusion — restates the main argument",
    "summary_statement":         "Conclusion — summarises the key points",
    "which_outweighs_opinion":   "Conclusion — declares which side is stronger",
}
```

### 11.2 `DIRECTION_LOOKUP`

One entry per `direction_tag`. Each entry carries:

```python
DIRECTION_LOOKUP = {
    "<direction_tag>": {
        "argument": "<PoV core claim — shown as card heading and MCQ option text>",
        "logic":    "<short explanation of reasoning behind the argument>",
        "blog_url": None  # set to URL string once blog post is published
    },
    # ... one entry per direction_tag in the system
}
```

### 11.3 `STRUCTURE_LOOKUP`

Maps `structure_type` to human-readable label used as `L4S` hint.

```python
STRUCTURE_LOOKUP = {
    "structure_1": "4-Paragraph Discuss Both Views",
    "structure_2": "5-Paragraph Discuss Both Views + Opinion",
    "structure_3": "4-Paragraph Opinion-Led",
    "structure_4": "5-Paragraph Opinion + Counterargument",
    "structure_5": "4-Paragraph Advantages–Disadvantages",
    "structure_6": "4-Paragraph Problem–Solution",
    "structure_7": "5-Paragraph Causes–Effects–Solutions",
}
```

---

## 12. Assembler Map

|`practice_code`|Assembler function|Primary data source|
|---|---|---|
|`P0`|`assemble_P0`|`prep_unit.question`|
|`POV_INTRO`|`assemble_POV_INTRO`|snapshot + `DIRECTION_LOOKUP` (argument, logic, blog_url per unique `direction_tag`)|
|`L3M_POV`|`assemble_L3M_POV`|snapshot + `DIRECTION_LOOKUP` + dominant direction rule + tier pool|
|`L2M_POV`|`assemble_L2M_POV`|snapshot + `DIRECTION_LOOKUP` + `rhetoric_tag` presence check + tier pool|
|`L4M`|`assemble_L4M`|snapshot + `DIRECTION_LOOKUP` + tier pool|
|`L2M`|`assemble_L2M`|snapshot + `RHETORIC_LABEL_LOOKUP` + same-structure-type tag pool|
|`L1M`|`assemble_L1M`|snapshot — same-essay noun-phrase pool only|
|`L1S`|`assemble_L1S`|snapshot|
|`L2S`|`assemble_L2S`|snapshot + spaCy clause chunking|
|`L3S`|`assemble_L3S`|snapshot + `RHETORIC_LABEL_LOOKUP`|
|`L4S`|`assemble_L4S`|snapshot + `STRUCTURE_LOOKUP`|
|`L1F`|`assemble_L1F`|snapshot + P2 enriched snapshot (`similar_phrases`)|
|`L2F`|`assemble_L2F`|snapshot + `RHETORIC_LABEL_LOOKUP` + P2 enriched snapshot (`hint_sentences`)|
|`L4W`|`assemble_L4W`|returns `{ "practice_code": "L4W" }`|

---

## 13. Question Count Summary

|`practice_code`|Phase|Min|Max|Notes|
|---|---|---|---|---|
|`P0`|Cold Write|1|1|Fixed|
|`POV_INTRO`|PoV Intro|0|0|No questions|
|`L3M_POV`|PoV Encoding|4|6|~2–3 per Q type × 2 types|
|`L2M_POV`|PoV Encoding|2|8|Max 2 per direction × directions in essay|
|`L4M`|Essay Encoding|2|2|Fixed 2 questions|
|`L2M`|Essay Encoding|1|6|Body sentences; cap 6|
|`L1M`|Essay Encoding|6|10|~8 typical|
|`L1S`|Essay Encoding|10|10|Capped at 10|
|`L2S`|Essay Encoding|10|18|~14 typical; body sentences only|
|`L3S`|Essay Encoding|2|3|One per body paragraph|
|`L4S`|Essay Encoding|1|1|Fixed|
|`L1F`|Essay Encoding|10|10|Capped at 10; body sentences with lexical items|
|`L2F`|Essay Encoding|5|5|Capped at 5; body sentences only|
|`L4W`|Write Gate|1|1|Fixed|
|**TOTAL**|—|**55**|**81**|Typical ~63|

---

## 14. Design Decisions (Locked)

|#|Decision|Rule|
|---|---|---|
|1|No MCQ feedback text|Omit for MVP — no `feedback` field in any practice object|
|2|`L1F` hint visibility|Always visible — `similar_phrases` rendered directly below each blank. No toggle.|
|3|`L2M` rhetoric distractors|Drawn from tags that appear in this essay's `structure_type` only — not arbitrary from all 33|
|4|Minimum distractor count|Always 5 options (1 correct + 4 wrong). Always force 5 — fallback to tier pool if same-essay pool insufficient|
|5|Shared `unit_id`|Shared across `tier_50` and `tier_80` for the same essay|
|6|V1 / V2 only|P3 outputs V1 and V2 only. No V3. Retry cycle (`V1 → V2 → V1`) managed by School app.|
|7|Which directions surface on `POV_INTRO`|All unique `direction_tag` values on any sentence in the essay, ordered by first appearance|
|8|Dominant direction of a paragraph|Most-frequent `direction_tag` in that paragraph. Tie → earliest sentence's tag|
|9|`L2M_POV` prompt type generation|Only generate a prompt type if ≥1 sentence with a matching `rhetoric_tag` exists under that `direction_tag` in the essay|
|10|`L2M_POV` cap rule|Max 2 questions per `direction_tag`; priority order P1 → P2 → P3 → P4|
|11|`L2M_POV` context shown|Always `direction.argument` + `direction.logic`. Sentence is always an option, never context|
|12|`L2M_POV` wrong options|Null-`direction_tag` sentences never eligible as distractors|
|13|P2 mechanism prompt|Subsumes explanation-type and cause/effect tags. No separate cause prompt. Prevents duplicate correct answers.|
|14|`L1M` distractors|Same essay only — not tier pool. Other noun-phrase `lexical_item.phrase` values from the current essay.|
|15|`L3M_POV`-P2 distractor source|Same essay body paragraphs first; tier pool fallback always required (essays have max 3 body paragraphs)|
|16|`similar_phrases` sourcing|Pre-computed by P2 (cosine similarity 0.5–0.7). P3 reads from P2 enriched snapshot — does not compute.|
|17|`hint_sentences` sourcing|Pre-computed by P2 (cosine similarity 0.5–0.9, top-1, cross-essay only). P3 reads from P2 enriched snapshot. Empty array `[]` if no match found.|
|18|`L2F` scope change|Body sentences only (was all paragraphs). Cap 5.|
|19|`L4M` question count|2 questions only. Essay structure question removed (`structure_type` no longer used as question source).|

---

_END OF SPEC_