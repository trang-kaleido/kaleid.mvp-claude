# Kaleido School — Tool Design Rationale
*Rationale doc · Feb 2026 · Not implementation SSOT — see Design Brief for locked behaviour*

---

## Core Philosophy

**Learning happens through active manipulation, not passive reading.**

The 4 practice tools aren't tests — they are **encoding mechanisms** that force students to process content through different cognitive operations. Each operation creates a different memory pathway. Seeing all four operations applied to the same content is what builds durable recall.

**Learning science principle:** You remember what you actively manipulate, not what you passively read. The School never asks a student to read and absorb — it always asks them to *do something* with what they've read.

---

## Practice 0 — Before-Signal Write

Before any encoding, the student writes a full essay on the unit's question from scratch. No model essay. No scaffold. No vocabulary reference.

This is not an encoding tool — it is a **baseline capture**. The teacher sees this essay immediately in the Educator Console. When they later receive the L4W challenge essay (post-encoding), they have a direct before/after comparison.

From the student's perspective: it is a productive struggle. They surface what they already know, activate prior knowledge, and create a gap-awareness that makes the Understanding phase more meaningful.

---

## The 4 Encoding Tools — Cognitive Functions

| Tool | Cognitive Operation | What the student does | Scaffold level |
|---|---|---|---|
| **MCQ** | Recognition | Identifies the correct answer from options | Highest — answer is visible |
| **Scramble** | Formulation | Reconstructs correct order from given pieces | Medium — pieces are given |
| **Fill** | Recall | Retrieves exact language from memory | Low — POS hint only |
| **Write** | Generation | Produces from nothing | Zero — no scaffold |

Cognitive load increases left to right. This is by design. A student who cannot recognise the correct topic sentence (MCQ) is not ready to generate one from scratch (Write). The sequence is the pedagogy.

---

## Why the Execution Direction Differs by Tool

**MCQ runs top-down: L4 → L3 → L2 → L1 (Essay → Lexical)**

Comprehension starts at the whole. The student first understands what argument the essay makes (L4M), then how each paragraph constructs its PoV (L3M), then what each sentence does (L2M), then which exact words carry meaning (L1M). This mirrors how a skilled reader reads — big picture first, then zoom in.

**Scramble runs bottom-up: L1 → L2 → L3 → L4 (Lexical → Essay)**

Construction starts from pieces. The student first places individual words into a sentence (L1S), then phrase chunks into sentences (L2S), then sentences into paragraphs (L3S), then paragraphs into the essay structure (L4S). This mirrors how a writer writes — assemble the parts, then structure the whole.

MCQ deconstructs understanding top-down. Scramble reconstructs production bottom-up. Together they create a full cognitive cycle on the same content.

---

## Tool Interaction Models (locked)

### MCQ — Click to select
One question at a time. 5 options. Student selects one and submits. Feedback explains WHY — not just what was correct, but the structural/rhetorical reason. All distractors sourced from the same essay or the paired essay (no invented options).

### Scramble — Two interaction patterns
- **L1S, L2S (word/phrase level):** Click-to-place word bank. Chips in a shuffled pool; click to place in sequence. Simple, mobile-friendly, lower engineering cost.
- **L3S, L4S (sentence/essay level):** Drag-to-order stacked cards. Full sentences are long — spatial drag is more intuitive than click-to-place for rearranging large items.

### Fill (L1F only) — Type from memory
Full essay text shown with key lexical items blanked. POS hint below each blank (ADJ, ADV, NOUN, VBG). No word bank. No peek. Student types the exact phrase. Grading: case-insensitive string match against Lab-precomputed `answers[]` array.

Fill exists only at L1 (lexical level). Fill at sentence/paragraph/essay level is not pedagogically meaningful — the blanking unit must be small enough that the recalled item is specific and testable.

### Write — Generate from nothing
Three levels, progressively less scaffold:

| Practice | Scaffold shown | Output |
|---|---|---|
| L2W | Full paragraph (one sentence blanked) + syntax hint | Session state only — discarded after L3W |
| L3W | Full essay (one paragraph blanked) + student's own L2W sentences as reference | Stored → assembled into reconstructed essay |
| L4W | Challenge question + lexical panel + syntax panel | Stored → sent to teacher, gates unit completion |

L2W output is never stored to DB. It exists solely to scaffold L3W — the student sees their own L2W rewrites as a reference panel when writing the L3W paragraph. Once L3W is submitted, all L2W state clears.

---

## Retry Logic — Why Auto-Retry

When a student fails a practice, V2 loads automatically after feedback. The student does not press a "Try again" button. Retrying is the default — passing or being forced through are the only intentional decisions.

This is intentional: a choice to retry makes the student weigh whether to try again, which introduces friction and self-doubt at exactly the wrong moment. Auto-retry removes that choice and keeps attention on the content, not the meta-game of attempt management.

**Pass condition: 100% correct for all tools (MCQ, Scramble, Fill).** This is also intentional. Partial credit (e.g. ">80%") creates a grey zone where a student advances with known gaps. 100% means: every piece of this content was correctly retrieved. Anything less = a different angle, same content.

**Retry content differs by tool:**
- MCQ: different distractors (V2/V3 use semantically similar sentences from the paired essay — a different angle on the same identification task)
- Scramble and Fill: same content (you are retrieving the same correct answer — the act of retrieving again under a different mental state is the practice)

Max 3 attempts. After the 3rd failure: advance anyway, record `failed_advanced: true`. The student sees "Continue →" — not "You failed." Forced advance is not failure; it is a signal to the teacher that this student needs support on this concept.

---

## What the Feedback Must Do

After every MCQ question, the feedback paragraph must:
1. Confirm the correct answer
2. Explain **why** it is correct — in terms of the essay's structure, argument logic, or rhetoric
3. Contrast it against one or two wrong options — explaining specifically why those are wrong
4. Connect back to the reading — anchor the rule to the essay text

Feedback is not a score. It is instruction. The student should leave each question knowing something they didn't know before — not just whether they got it right.

---

## Content Reuse Is a Feature

The same model essay appears across multiple prep-units at different cognitive entry points. A student who encounters the same essay at L4 (argument-level) and later at L1 (lexical-level) is not seeing repetition — they are experiencing spaced retrieval at a different granularity. This is deliberate. The essay is the anchor; the tool changes the lens.
