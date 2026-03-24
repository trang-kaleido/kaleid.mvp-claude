Here's a conceptual overview of the three pipelines you have. Think of them as a **factory assembly line** — each pipeline takes something in, does a job, and hands the result to the next one.

---

## The Big Picture

You're building **Kaleido**, a learning product for IELTS students. The pipeline system exists to mass-produce and structure learning material from raw essays. Here's the flow:

**Source material → Pipeline 1 → Database → Pipeline 2 → Tier lists → Pipeline 3 → Student curriculum**

---

## Pipeline 1 — _The Essay Factory_

**Job:** Take 100 IELTS questions, generate model essays for each one, tag every sentence, and store everything in a database.

**How it works conceptually:**

- You feed it 3 framework documents (your "Thinking", "Reference", and "Prompt" files) — these are the Kaleido knowledge base
- It sends each question to GPT-4o-mini, which writes a full IELTS essay following your framework
- Every sentence in every essay gets labeled with two tags: a **rhetoric tag** (what role this sentence plays structurally, e.g. "topic sentence") and a **direction tag** (what intellectual tension/PoV this sentence explores)
- Key vocabulary phrases and sentence patterns are also extracted
- Everything is stored in Supabase (your cloud database), with embeddings (mathematical representations) so sentences can be searched by meaning later

**Output:** A rich database of ~100 essays, fully decomposed into tagged sentences

---

## Pipeline 2 — _The Curator_

**Job:** Look at all the direction tags across all essays, and figure out the minimum set of essays needed to cover 50% or 80% of intellectual territory.

**How it works conceptually:**

- It uses a **greedy algorithm** — a simple but smart strategy that asks: "which direction tag appears in the most essays I haven't covered yet?" — and picks that one, then repeats
- It runs this twice to produce **Tier 50** (a smaller, lighter curriculum) and **Tier 80** (a broader, more comprehensive one)
- Think of it like curating a film festival: instead of showing 100 films, you pick the 40 most thematically diverse ones that still cover 80% of the ideas

**Output:** Two curated subsets of essays — `tier_50` and `tier_80`

---

## Pipeline 3 — _The Curriculum Builder_ (in design)

**Job:** Take the tier snapshots from Pipeline 2 and turn them into actual **prep-units** — structured learning modules — for students.

**How it works conceptually:**

- Each prep-unit is built around one essay
- It bundles together: the essay itself, comprehension questions (MCQ), and practice exercises
- Students get assigned one fixed curriculum (either Tier 50 or Tier 80) on onboarding and work through it in sequence
- Pipeline 3 is still being designed — the main open questions are how to generate the practice questions automatically and how to define the sequencing logic

**Output:** A JSON file per prep-unit, used by the school app to render learning content

---

## How They Connect

```
Framework docs + 100 questions
         ↓
    [Pipeline 1]
         ↓
  Supabase database (essays + tagged sentences)
         ↓
    [Pipeline 2]
         ↓
  Tier 50 snapshot + Tier 80 snapshot
         ↓
    [Pipeline 3]  ← you are designing this now
         ↓
  prep-unit JSONs (one per essay in each tier)
         ↓
    Student app renders curriculum
```

