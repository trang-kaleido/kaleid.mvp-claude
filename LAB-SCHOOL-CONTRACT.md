# LAB → SCHOOL CONTRACT

_Kaleido Lab → School · v3 · 2026_

> ↑ [Back to lab HANDOFF](https://claude.ai/HANDOFF.md) · [Master HANDOFF](https://claude.ai/HANDOFF.md)

> **What this file is:** Machine-first technical contract between Lab and School. Contains TypeScript interfaces, Zod validators, and example JSON for all 4 Supabase tables the Lab writes and the School reads.
> 
> **Update rule:** Update this file whenever a Pipeline 2/3 change alters the data shape. The School imports types and validators from this spec.
> 
> **v3 changes:** `practices` array extended from 12 to 14 items. Two new practice types added: `POV_INTRO` (index 1) and `L2M_POV` (index 3). `L3M` renamed to `L3M_POV` (index 2). `direction_ref` table extended with `logic` and `blog_url` fields.

---

## Table of Contents

1. [Architecture Overview](https://claude.ai/chat/6e05d4f3-f767-4d9d-92ee-6ac4e5b2affe#1-architecture-overview)
2. [Table: `direction_ref`](https://claude.ai/chat/6e05d4f3-f767-4d9d-92ee-6ac4e5b2affe#2-table-direction_ref)
3. [Table: `tier_unit_sequence`](https://claude.ai/chat/6e05d4f3-f767-4d9d-92ee-6ac4e5b2affe#3-table-tier_unit_sequence)
4. [Table: `qbank_unlocks`](https://claude.ai/chat/6e05d4f3-f767-4d9d-92ee-6ac4e5b2affe#4-table-qbank_unlocks)
5. [Table: `prep_unit`](https://claude.ai/chat/6e05d4f3-f767-4d9d-92ee-6ac4e5b2affe#5-table-prep_unit)
6. [JSONB: `sentences` Column](https://claude.ai/chat/6e05d4f3-f767-4d9d-92ee-6ac4e5b2affe#6-jsonb-sentences-column)
7. [JSONB: `practices` Column](https://claude.ai/chat/6e05d4f3-f767-4d9d-92ee-6ac4e5b2affe#7-jsonb-practices-column)
8. [Complete `data.json` Envelope](https://claude.ai/chat/6e05d4f3-f767-4d9d-92ee-6ac4e5b2affe#8-complete-datajson-envelope)
9. [Resolved Decisions](https://claude.ai/chat/6e05d4f3-f767-4d9d-92ee-6ac4e5b2affe#9-resolved-decisions)

---

## 1. Architecture Overview

Lab writes four tables. School only reads them — never writes.

|Layer|Table|Writer|PK|
|---|---|---|---|
|Content|`direction_ref`|P2|`direction_id` (text)|
|Content|`prep_unit`|P3|`unit_id` (uuid)|
|Logic|`tier_unit_sequence`|P2|`id` (uuid, auto)|
|Logic|`qbank_unlocks`|P2|`id` (uuid, auto)|

All four tables share a `batch_id` (UUID) that represents a single content version. A new pipeline run = new `batch_id`. Students are locked to a `batch_id` at onboarding and never migrate.

---

## 2. Table: `direction_ref`

Small lookup table — maps internal direction IDs to human-readable content. Used by: PoV Introduction Screen, PoV Encoding MCQ context, Q Bank context display, and directions reading page.

**v3 change:** Added `logic` and `blog_url` columns.

### SQL

```sql
CREATE TABLE direction_ref (
  direction_id  TEXT PRIMARY KEY,
  argument      TEXT NOT NULL,
  logic         TEXT NOT NULL,
  blog_url      TEXT          -- null until blog post is published
);
```

### TypeScript Interface

```ts
/** direction_ref — one row per argumentation direction */
export interface DirectionRef {
  direction_id: string;         // e.g. "collective_progress_forward"
  argument:     string;         // PoV core claim — card heading + MCQ option text
  logic:        string;         // short explanation of reasoning behind argument
  blog_url:     string | null;  // deep-dive blog URL; null until authored
}
```

### Zod Validator

```ts
import { z } from "zod";

export const DirectionRefSchema = z.object({
  direction_id: z.string().min(1),
  argument:     z.string().min(1),
  logic:        z.string().min(1),
  blog_url:     z.string().url().nullable(),
});

export type DirectionRef = z.infer<typeof DirectionRefSchema>;
```

### Example Row

```json
{
  "direction_id": "collective_progress_forward",
  "argument": "Human progress is driven by collective cooperation and shared knowledge.",
  "logic": "When individuals pool effort and ideas, outcomes exceed what any one person could achieve alone.",
  "blog_url": null
}
```

---

## 3. Table: `tier_unit_sequence`

Unchanged from v2.

### SQL

```sql
CREATE TABLE tier_unit_sequence (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id           UUID NOT NULL,
  tier               TEXT NOT NULL,
  sequence_position  INT  NOT NULL,
  unit_id            UUID NOT NULL,

  UNIQUE (batch_id, tier, sequence_position),
  UNIQUE (batch_id, tier, unit_id)
);
```

### TypeScript Interface

```ts
export interface TierUnitSequence {
  id:                string;
  batch_id:          string;
  tier:              "tier_50" | "tier_80";
  sequence_position: number;
  unit_id:           string;
}
```

### Zod Validator

```ts
export const TierEnum = z.enum(["tier_50", "tier_80"]);

export const TierUnitSequenceSchema = z.object({
  id:                z.string().uuid(),
  batch_id:          z.string().uuid(),
  tier:              TierEnum,
  sequence_position: z.number().int().positive(),
  unit_id:           z.string().uuid(),
});

export type TierUnitSequence = z.infer<typeof TierUnitSequenceSchema>;
```

### Example Row

```json
{
  "id": "a1b2c3d4-0000-0000-0000-000000000001",
  "batch_id": "550e8400-e29b-41d4-a716-446655440000",
  "tier": "tier_50",
  "sequence_position": 1,
  "unit_id": "d4e5f6a7-1111-1111-1111-111111111111"
}
```

---

## 4. Table: `qbank_unlocks`

Unchanged from v2.

### SQL

```sql
CREATE TABLE qbank_unlocks (
  id                             UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id                       UUID  NOT NULL,
  tier                           TEXT  NOT NULL,
  question_id                    UUID  NOT NULL,
  question_text                  TEXT  NOT NULL,
  unlocked_by_sequence_position  INT   NOT NULL,
  shared_directions              JSONB NOT NULL DEFAULT '[]',

  UNIQUE (batch_id, tier, question_id)
);
```

### TypeScript Interface

```ts
export interface QBankUnlock {
  id:                            string;
  batch_id:                      string;
  tier:                          "tier_50" | "tier_80";
  question_id:                   string;
  question_text:                 string;
  unlocked_by_sequence_position: number;
  shared_directions:             string[];
}
```

### Zod Validator

```ts
export const QBankUnlockSchema = z.object({
  id:                            z.string().uuid(),
  batch_id:                      z.string().uuid(),
  tier:                          TierEnum,
  question_id:                   z.string().uuid(),
  question_text:                 z.string().min(1),
  unlocked_by_sequence_position: z.number().int().positive(),
  shared_directions:             z.array(z.string().min(1)),
});

export type QBankUnlock = z.infer<typeof QBankUnlockSchema>;
```

### Example Row

```json
{
  "id": "b2c3d4e5-2222-2222-2222-222222222222",
  "batch_id": "550e8400-e29b-41d4-a716-446655440000",
  "tier": "tier_50",
  "question_id": "e5f6a7b8-3333-3333-3333-333333333333",
  "question_text": "Some people think that governments should invest more in public transport.",
  "unlocked_by_sequence_position": 3,
  "shared_directions": ["collective_progress_forward", "material_collective_forward"]
}
```

### School Query Patterns

```sql
-- On unit complete: find newly unlocked Q Bank questions
SELECT * FROM qbank_unlocks
WHERE batch_id = $1
  AND tier = $2
  AND unlocked_by_sequence_position = $3;

-- Q Bank home: all unlocked questions up to current position
SELECT * FROM qbank_unlocks
WHERE batch_id = $1
  AND tier = $2
  AND unlocked_by_sequence_position <= $3
ORDER BY unlocked_by_sequence_position;
```

---

## 5. Table: `prep_unit`

One row per learning unit. Unchanged from v2 except `practices` now contains 14 items instead of 12.

### SQL

```sql
CREATE TABLE prep_unit (
  unit_id         UUID PRIMARY KEY,
  batch_id        UUID NOT NULL,
  question        TEXT NOT NULL,
  structure_type  TEXT NOT NULL,
  sentences       JSONB NOT NULL,
  practices       JSONB NOT NULL
);
```

### TypeScript Interface

```ts
export interface PrepUnit {
  unit_id:        string;
  batch_id:       string;
  question:       string;
  structure_type: string;
  sentences:      Sentence[];
  practices:      Practice[];  // exactly 14 items — see §7
}
```

### Zod Validator

```ts
export const PrepUnitSchema = z.object({
  unit_id:        z.string().uuid(),
  batch_id:       z.string().uuid(),
  question:       z.string().min(1),
  structure_type: z.string().min(1),
  sentences:      z.array(SentenceSchema),
  practices:      z.array(PracticeSchema).length(14),
});
```

---

## 6. JSONB: `sentences` Column

Unchanged from v2. One field clarification: `direction_tag` is nullable — introduction and conclusion sentences may have `null`.

### TypeScript Interface

```ts
export interface LexicalItem {
  phrase: string;
  pos:    string;
}

export interface Sentence {
  sentence_id:    string;
  paragraph_type: string;          // "introduction" | "body_1" | "body_2" | "body_3" | "conclusion"
  order:          number;          // 1-based position within paragraph
  canonical_text: string;
  rhetoric_tag:   string;
  rhetoric_label: string;          // human-readable, e.g. "Body — unpacks the causal mechanism"
  direction_tag:  string | null;   // null for introduction and conclusion sentences
  lexical_items:  LexicalItem[];
  syntax_items:   string[];
}
```

### Zod Validator

```ts
export const LexicalItemSchema = z.object({
  phrase: z.string().min(1),
  pos:    z.string().min(1),
});

export const SentenceSchema = z.object({
  sentence_id:    z.string().uuid(),
  paragraph_type: z.string().min(1),
  order:          z.number().int().positive(),
  canonical_text: z.string().min(1),
  rhetoric_tag:   z.string().min(1),
  rhetoric_label: z.string().min(1),
  direction_tag:  z.string().nullable(),
  lexical_items:  z.array(LexicalItemSchema),
  syntax_items:   z.array(z.string()),
});

export type Sentence = z.infer<typeof SentenceSchema>;
```

### Example

```json
{
  "sentence_id": "f6a7b8c9-4444-4444-4444-444444444444",
  "paragraph_type": "body_1",
  "order": 2,
  "canonical_text": "Government funding for the arts creates cultural institutions that benefit entire communities.",
  "rhetoric_tag": "explanation",
  "rhetoric_label": "Body — unpacks the causal mechanism",
  "direction_tag": "collective_progress_forward",
  "lexical_items": [
    { "phrase": "government funding", "pos": "NOUN" },
    { "phrase": "cultural institutions", "pos": "NOUN" }
  ],
  "syntax_items": ["X creates Y that benefit Z."]
}
```

---

## 7. JSONB: `practices` Column

Array of exactly **13 practice objects** in this fixed execution order:

```
Index:  0     1           2         3         4    5    6    7    8    9    10   11   12
Code:   P0    POV_INTRO   L3M_POV   L2M_POV   L4M  L2M  L1M  L1S  L2S  L3S  L1F  L2F  L4W
```

**v3 change from v2:** 14 items (was 12). New items at indices 1–3. `L3M` from v2 is replaced by `L3M_POV`. `L3M` no longer exists as a `practice_code`.
**L4S dropped:** Essay Scramble removed — was at index 10. L1F/L2F/L4W shift down one index. Array is now 13 items.

|Category|`practice_code` values|Has `versions[]`?|Retry?|
|---|---|---|---|
|Unversioned|`P0`, `POV_INTRO`, `L2F`, `L4W`|No|No|
|Versioned|`L3M_POV`, `L2M_POV`, `L4M`, `L2M`, `L1M`, `L1S`, `L2S`, `L3S`, `L1F`|Yes (V1, V2)|Yes — V1 → V2 → V1|

---

### 7.1 Practice Type Union

```ts
export type Practice =
  | PracticeColdWrite      // P0
  | PracticePoVIntro       // POV_INTRO
  | PracticeMCQ            // L3M_POV, L2M_POV, L4M, L2M, L1M
  | PracticeLexScramble    // L1S
  | PracticeSentScramble   // L2S
  | PracticeParaScramble   // L3S
  | PracticePhraseFill     // L1F
  | PracticeSentFill       // L2F
  | PracticeEssayWrite;    // L4W
```

### Zod Discriminated Union

```ts
export const PracticeSchema = z.discriminatedUnion("practice_code", [
  PracticeColdWriteSchema,
  PracticePoVIntroSchema,
  ...PracticeMCQSchema,       // 5 codes share same shape: L3M_POV, L2M_POV, L4M, L2M, L1M
  PracticeLexScrambleSchema,
  PracticeSentScrambleSchema,
  PracticeParaScrambleSchema,
  PracticePhraseFillSchema,
  PracticeSentFillSchema,
  PracticeEssayWriteSchema,
]);
```

---

### 7.2 P0 — Cold Write (unversioned)

Unchanged from v2.

```ts
export interface PracticeColdWrite {
  practice_code: "P0";
  question:      string;
  prompt:        string;
}

export const PracticeColdWriteSchema = z.object({
  practice_code: z.literal("P0"),
  question:      z.string().min(1),
  prompt:        z.string().min(1),
});
```

```json
{
  "practice_code": "P0",
  "question": "Some people believe that government funding for the arts is a waste of money...",
  "prompt": "Write a complete IELTS Task 2 essay in response to this question:"
}
```

---

### 7.3 POV_INTRO — PoV Introduction Screen (unversioned)

**New in v3.** No questions. No `versions[]`. No `pass` tracking. School renders one PoV card per item in `directions[]`. CTA button gates forward to `L3M_POV`.

```ts
export interface PoVDirection {
  direction_tag: string;         // e.g. "collective_progress_forward"
  argument:      string;         // PoV core claim — card heading
  logic:         string;         // reasoning summary — card body
  blog_url:      string | null;  // deep-dive link; null = button disabled
}

export interface PracticePoVIntro {
  practice_code: "POV_INTRO";
  directions:    PoVDirection[];  // one item per unique direction_tag in essay
}
```

```ts
const PoVDirectionSchema = z.object({
  direction_tag: z.string().min(1),
  argument:      z.string().min(1),
  logic:         z.string().min(1),
  blog_url:      z.string().url().nullable(),
});

export const PracticePoVIntroSchema = z.object({
  practice_code: z.literal("POV_INTRO"),
  directions:    z.array(PoVDirectionSchema).min(1),
});

export type PracticePoVIntro = z.infer<typeof PracticePoVIntroSchema>;
```

```json
{
  "practice_code": "POV_INTRO",
  "directions": [
    {
      "direction_tag": "collective_progress_forward",
      "argument": "Human progress is driven by collective cooperation and shared knowledge.",
      "logic": "When individuals pool effort and ideas, outcomes exceed what any one person could achieve alone.",
      "blog_url": null
    },
    {
      "direction_tag": "material_progress_feedback",
      "argument": "Material development creates feedback loops that accelerate further progress.",
      "logic": "Investment in infrastructure and technology compounds over time, each gain enabling the next.",
      "blog_url": null
    }
  ]
}
```

---

### 7.4 L3M_POV / L2M_POV / L4M / L2M / L1M — MCQ (versioned)

**v3 change:** `L3M_POV` and `L2M_POV` are new `practice_code` values that use the same MCQ shape. `L3M` from v2 no longer exists. Total MCQ codes: 5 (`L3M_POV`, `L2M_POV`, `L4M`, `L2M`, `L1M`).

All five MCQ tools share the same shape. Only `practice_code` differs.

**V1 vs V2:** Same questions (same `id`, `prompt`, `correct_index`), different `options` arrays drawn from tier pool. `correct_index` may differ between V1 and V2 because the correct option occupies a different position in each options array.

```ts
export interface MCQQuestion {
  id:            string;    // e.g. "L3M_POV-P1-body_1", "L2M_POV-P1-dir1-q1"
  prompt:        string;    // question stem
  context:       string;    // what the student sees as context (varies by practice — see below)
  options:       string[];  // exactly 5 options
  correct_index: number;    // 0-based index of correct option in this version's options array
}

export interface PracticeMCQ {
  practice_code: "L3M_POV" | "L2M_POV" | "L4M" | "L2M" | "L1M";
  versions: [
    { version: "V1"; questions: MCQQuestion[] },
    { version: "V2"; questions: MCQQuestion[] },
  ];
}
```

**`context` field values by practice_code:**

|`practice_code`|`context` content|
|---|---|
|`L3M_POV` (P1 type)|Full paragraph text — all sentences of the target paragraph joined|
|`L3M_POV` (P2 type)|`direction.argument` + `"\n\n"` + `direction.logic`|
|`L2M_POV` (all types)|`direction.argument` + `"\n\n"` + `direction.logic`|
|`L4M`|Empty string `""` — essay-level; student has already read the essay|
|`L2M`|`canonical_text` of the target sentence|
|`L1M`|Sentence text with the target phrase replaced by `"___"`|

```ts
const MCQQuestionSchema = z.object({
  id:            z.string().min(1),
  prompt:        z.string().min(1),
  context:       z.string(),        // may be empty string for L4M
  options:       z.array(z.string()).length(5),
  correct_index: z.number().int().min(0).max(4),
});

const MCQVersionSchema = z.object({
  version:   z.enum(["V1", "V2"]),
  questions: z.array(MCQQuestionSchema).min(1),
});

const mcqCodes = ["L3M_POV", "L2M_POV", "L4M", "L2M", "L1M"] as const;

export const PracticeMCQSchema = mcqCodes.map((code) =>
  z.object({
    practice_code: z.literal(code),
    versions: z.tuple([
      MCQVersionSchema.extend({ version: z.literal("V1") }),
      MCQVersionSchema.extend({ version: z.literal("V2") }),
    ]),
  })
);
```

```json
{
  "practice_code": "L3M_POV",
  "versions": [
    {
      "version": "V1",
      "questions": [
        {
          "id": "L3M_POV-P1-body_1",
          "prompt": "Which PoV argument is this paragraph based on?",
          "context": "The rise of global fashion influence can be attributed to multiple factors... [full paragraph text]",
          "options": [
            "Human progress is driven by collective cooperation and shared knowledge.",
            "Material development creates feedback loops that accelerate further progress.",
            "Environmental protection requires sacrificing short-term economic gains.",
            "Individual freedom is the foundation of social progress.",
            "Technological innovation drives cultural homogenisation."
          ],
          "correct_index": 0
        }
      ]
    },
    {
      "version": "V2",
      "questions": [
        {
          "id": "L3M_POV-P1-body_1",
          "prompt": "Which PoV argument is this paragraph based on?",
          "context": "The rise of global fashion influence can be attributed to multiple factors... [full paragraph text]",
          "options": [
            "State intervention is necessary to correct market failures.",
            "Human progress is driven by collective cooperation and shared knowledge.",
            "Growth without equity is unsustainable.",
            "Local culture is a form of resistance against globalisation.",
            "Competition between nations produces better outcomes than cooperation."
          ],
          "correct_index": 1
        }
      ]
    }
  ]
}
```

---

### 7.5 L1S — Lexical Scramble (versioned)

Unchanged from v2.

```ts
export interface LexScrambleQuestion {
  id:     string;
  phrase: string;
  chips:  string[];
  answer: string;
}

export interface PracticeLexScramble {
  practice_code: "L1S";
  versions: [
    { version: "V1"; questions: LexScrambleQuestion[] },
    { version: "V2"; questions: LexScrambleQuestion[] },
  ];
}
```

```ts
const LexScrambleQuestionSchema = z.object({
  id:     z.string().min(1),
  phrase: z.string().min(1),
  chips:  z.array(z.string()).min(2),
  answer: z.string().min(1),
});

export const PracticeLexScrambleSchema = z.object({
  practice_code: z.literal("L1S"),
  versions: z.tuple([
    z.object({ version: z.literal("V1"), questions: z.array(LexScrambleQuestionSchema).min(1) }),
    z.object({ version: z.literal("V2"), questions: z.array(LexScrambleQuestionSchema).min(1) }),
  ]),
});
```

---

### 7.6 L2S — Sentence Scramble (versioned)

Unchanged from v2.

```ts
export interface SentChunk {
  text:       string;
  is_lexical: boolean;
}

export interface SentScrambleQuestion {
  id:             string;
  paragraph:      string;
  sentence_order: number;
  hint:           string;
  chunks:         SentChunk[];
  answer:         string;
}

export interface PracticeSentScramble {
  practice_code: "L2S";
  versions: [
    { version: "V1"; questions: SentScrambleQuestion[] },
    { version: "V2"; questions: SentScrambleQuestion[] },
  ];
}
```

```ts
const SentChunkSchema = z.object({
  text:       z.string().min(1),
  is_lexical: z.boolean(),
});

const SentScrambleQuestionSchema = z.object({
  id:             z.string().min(1),
  paragraph:      z.string().min(1),
  sentence_order: z.number().int().positive(),
  hint:           z.string().min(1),
  chunks:         z.array(SentChunkSchema).min(2),
  answer:         z.string().min(1),
});

export const PracticeSentScrambleSchema = z.object({
  practice_code: z.literal("L2S"),
  versions: z.tuple([
    z.object({ version: z.literal("V1"), questions: z.array(SentScrambleQuestionSchema).min(1) }),
    z.object({ version: z.literal("V2"), questions: z.array(SentScrambleQuestionSchema).min(1) }),
  ]),
});
```

---

### 7.7 L3S — Paragraph Scramble (versioned)

Unchanged from v2.

```ts
export interface ScrambleSentence {
  sentence_id: string;
  text:        string;
}

export interface ParaScrambleQuestion {
  id:           string;
  paragraph:    string;
  hint:         string;
  sentences:    ScrambleSentence[];
  answer_order: string[];
}

export interface PracticeParaScramble {
  practice_code: "L3S";
  versions: [
    { version: "V1"; questions: ParaScrambleQuestion[] },
    { version: "V2"; questions: ParaScrambleQuestion[] },
  ];
}
```

```ts
const ScrambleSentenceSchema = z.object({
  sentence_id: z.string().uuid(),
  text:        z.string().min(1),
});

const ParaScrambleQuestionSchema = z.object({
  id:           z.string().min(1),
  paragraph:    z.string().min(1),
  hint:         z.string().min(1),
  sentences:    z.array(ScrambleSentenceSchema).min(2),
  answer_order: z.array(z.string().uuid()).min(2),
});

export const PracticeParaScrambleSchema = z.object({
  practice_code: z.literal("L3S"),
  versions: z.tuple([
    z.object({ version: z.literal("V1"), questions: z.array(ParaScrambleQuestionSchema).min(1) }),
    z.object({ version: z.literal("V2"), questions: z.array(ParaScrambleQuestionSchema).min(1) }),
  ]),
});
```

---

### 7.8 L1F — Phrase Fill (versioned)

Unchanged from v2.

```ts
export interface FillPart {
  type:         "text" | "blank";
  text?:        string;
  blank_index?: number;
}

export interface FillContext {
  order:    number;
  parts:    FillPart[];
  isTarget: boolean;
}

export interface FillBlank {
  index:           number;
  answer:          string;
  pos_hint:        string;
  similar_phrases: string[];
}

export interface PhraseFillQuestion {
  id:             string;
  paragraph:      string;
  sentence_order: number;
  rhetoric_tag:   string;
  prompt:         string;
  context:        FillContext[];
  blanks:         FillBlank[];
}

export interface PracticePhraseFill {
  practice_code: "L1F";
  versions: [
    { version: "V1"; questions: PhraseFillQuestion[] },
    { version: "V2"; questions: PhraseFillQuestion[] },
  ];
}
```

```ts
const FillPartSchema = z.object({
  type:        z.enum(["text", "blank"]),
  text:        z.string().optional(),
  blank_index: z.number().int().min(0).optional(),
});

const FillContextSchema = z.object({
  order:    z.number().int().positive(),
  parts:    z.array(FillPartSchema).min(1),
  isTarget: z.boolean(),
});

const FillBlankSchema = z.object({
  index:           z.number().int().min(0),
  answer:          z.string().min(1),
  pos_hint:        z.string().min(1),
  similar_phrases: z.array(z.string()),
});

const PhraseFillQuestionSchema = z.object({
  id:              z.string().min(1),
  paragraph:       z.string().min(1),
  sentence_order:  z.number().int().positive(),
  rhetoric_tag:    z.string().min(1),
  prompt:          z.string().min(1),
  context:         z.array(FillContextSchema).min(1),
  blanks:          z.array(FillBlankSchema).min(1),
});

export const PracticePhraseFillSchema = z.object({
  practice_code: z.literal("L1F"),
  versions: z.tuple([
    z.object({ version: z.literal("V1"), questions: z.array(PhraseFillQuestionSchema).min(1) }),
    z.object({ version: z.literal("V2"), questions: z.array(PhraseFillQuestionSchema).min(1) }),
  ]),
});
```

---

### 7.10 L2F — Sentence Fill (unversioned, no retry)

Unchanged from v2.

```ts
export interface SentFillContext {
  order:    number;
  text:     string;
  isTarget: boolean;
}

export interface SentFillQuestion {
  id:              string;
  paragraph:       string;
  sentence_order:  number;
  rhetoric_tag:    string;
  rhetoric_hint:   string;
  hint_sentences:  string[];
  context:         SentFillContext[];
  prompt:          string;
}

export interface PracticeSentFill {
  practice_code: "L2F";
  questions:     SentFillQuestion[];
}
```

```ts
const SentFillContextSchema = z.object({
  order:    z.number().int().positive(),
  text:     z.string().min(1),
  isTarget: z.boolean(),
});

const SentFillQuestionSchema = z.object({
  id:              z.string().min(1),
  paragraph:       z.string().min(1),
  sentence_order:  z.number().int().positive(),
  rhetoric_tag:    z.string().min(1),
  rhetoric_hint:   z.string().min(1),
  hint_sentences:  z.array(z.string()),
  context:         z.array(SentFillContextSchema).min(1),
  prompt:          z.string().min(1),
});

export const PracticeSentFillSchema = z.object({
  practice_code: z.literal("L2F"),
  questions:     z.array(SentFillQuestionSchema).min(1),
});
```

---

### 7.11 L4W — Essay Write (unversioned, no retry)

Unchanged from v2.

```ts
export interface PracticeEssayWrite {
  practice_code: "L4W";
}

export const PracticeEssayWriteSchema = z.object({
  practice_code: z.literal("L4W"),
});
```

```json
{ "practice_code": "L4W" }
```

---

## 8. Complete `data.json` Envelope

Unchanged from v2. Pipeline 3 outputs a single JSON file with this top-level shape. Ingestion = iterate each array → INSERT rows into the corresponding table.

```ts
export interface LabOutput {
  batch_id:       string;
  prep_units:     PrepUnit[];
  tier_sequences: TierUnitSequence[];
  qbank_unlocks:  QBankUnlock[];
  direction_ref:  DirectionRef[];
}

export const LabOutputSchema = z.object({
  batch_id:       z.string().uuid(),
  prep_units:     z.array(PrepUnitSchema),
  tier_sequences: z.array(TierUnitSequenceSchema),
  qbank_unlocks:  z.array(QBankUnlockSchema),
  direction_ref:  z.array(DirectionRefSchema),
});
```

---

## 9. Resolved Decisions

- [x] **v2 decisions carried forward** — all decisions from v2 remain in force.
- [x] **`practices` array length is 14.** School must not assume a fixed length of 12. Zod validator uses `.length(14)` explicitly.
- [x] **`L3M` practice_code retired.** `L3M` no longer appears in the `practices` array. The discriminated union in `PracticeSchema` does not include it. Any School code switching on `"L3M"` must be updated to `"L3M_POV"`.
- [x] **`MCQQuestion` gains a `context` field.** All MCQ questions now carry a `context` string. For `L4M` this is an empty string. School renderer must handle both non-empty and empty context without breaking layout.
- [x] **`direction_ref` gains `logic` and `blog_url`.** Schema migration required: `ALTER TABLE direction_ref ADD COLUMN logic TEXT NOT NULL DEFAULT '', ADD COLUMN blog_url TEXT;`. P2 must populate both fields.
- [x] **`POV_INTRO` has no `pass` tracking.** `StudentAttempt` rows are not written for `POV_INTRO`. The School records only that the student tapped the CTA, advancing `current_phase`.
- [x] **`L2M_POV` question count is not fixed.** The School must not assume a fixed question count for `L2M_POV`. Question count varies by essay (2 per direction × number of directions, capped by what's valid). The validator uses `.min(1)` not `.length(N)`.