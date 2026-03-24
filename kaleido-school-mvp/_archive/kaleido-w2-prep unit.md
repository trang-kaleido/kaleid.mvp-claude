# Kaleido — Prep-Unit Anatomy
*Reference doc · Feb 2026 · Not implementation SSOT — see Design Brief for locked behaviour, Dev Brief for data contract*

A **prep-unit** is a learning container. It wraps one IELTS question + one model essay and systematically encodes the essay through 4 cognitive tools across 4 linguistic levels — from whole-argument comprehension down to exact word recall, and from recognition up to generation.

One unit = **13 steps**: Practice 0 (before-signal write) + 12 encoding/applying practices.

---

## The 4 Levels

Each level targets a different unit of language:

```
L4 — Essay        The argument as a whole: question, PoV pair, structure
L3 — Paragraph    A single PoV: how a position is built through sentences
L2 — Sentence     What each sentence does: its rhetorical function and syntax
L1 — Lexical      The exact words: phrases, verbs, adverbs that carry meaning
```

---

## Part 0 — Practice 0 (Before-Signal)

Before any understanding, the student writes a full essay on this unit's question. No model. No vocabulary. No hint.

- **Timer:** 40-min countdown
- **Output:** Stored to DB → Artifact 1 → Educator Console (immediately)
- **Purpose:** Baseline capture. Teacher sees student's pre-learning essay. After the unit is complete, teacher compares P0 essay vs. L4W challenge essay to assess growth.

---

## Part 1 — Understanding

Student reads the model essay and its conceptual framing before any practice begins.

### A. The Essay

The essay is the anchor for the entire unit. It is displayed with:
- **Colour-coded lexical items:** noun phrases (green), verbs (red), adverbs (blue)
- **Rhetoric tags on hover:** hovering a sentence reveals its tag (e.g. `topic_sentence`, `explanation`, `example_1`)
- **Paragraph labels:** each section headed with its PoV name (human-readable, e.g. *"Short-term profit damages long-term survival"*)

**Essay structure (7 structural variants — this example is Structure 1):**
```
Introduction (30–40 words)
├── paraphrase_question
└── outline_statement

Body Paragraph 1 (60–80 words)
├── topic_sentence
├── explanation
├── example_1
├── example_2
└── mini_conclusion

Body Paragraph 2 (60–80 words)
├── topic_sentence
├── explanation
├── example_1
├── example_2
└── mini_conclusion

Conclusion (30–40 words)
└── opinion_statement
```

**Example essay data structure:**
```json
{
  "id": "body_1",
  "direction_id": "material_sustainable_neg_forward",
  "word_count": 95,
  "sentences": [
    {
      "rhetoric_tag": "topic_sentence",
      "direction_tag": "material_sustainable_neg_forward",
      "text": "People who see these goals as fundamentally opposite point to serious pollution from traditional factories and industries."
    },
    {
      "rhetoric_tag": "explanation",
      "direction_tag": "material_sustainable_neg_forward",
      "text": "When companies focus on making substantial money, they often damage the natural environment severely."
    },
    {
      "rhetoric_tag": "example_1",
      "direction_tag": "material_sustainable_neg_forward",
      "text": "For example, major coal factories create valuable jobs but also cause severe air pollution and chronic health problems in surrounding communities."
    },
    {
      "rhetoric_tag": "example_2",
      "direction_tag": "material_sustainable_neg_forward",
      "text": "Fast fashion companies make considerable profits but produce massive amounts of waste that pollute rivers and oceans."
    },
    {
      "rhetoric_tag": "mini_conclusion",
      "direction_tag": "material_sustainable_neg_forward",
      "text": "These examples clearly show that when businesses try to grow rapidly, they usually harm nature significantly because protecting the environment costs substantial money and reduces short-term profits."
    }
  ]
}
```

### B. PoV Cards

Each body paragraph's argument is shown as a card:
- PoV name (human-readable direction label — never the internal `direction_id`)
- 1-sentence summary of the argument
- Quote: the topic sentence from the paragraph
- Deep-dive link → Kaleido-hosted blog post (`kaleido.io/blog/[direction-slug]`, opens in new tab)

### C. Lexical Items Panel

Band 7+ vocabulary extracted from the essay, grouped by POS type. Student uses this as reference during the Understanding phase.

**Lexical item types and extraction rules:**

| Type | Rule |
|---|---|
| `adj_n` (adjective + noun) | Adjacent adjective + noun pairs where adjective is specific/evaluative. Never adverb+adjective pairs. |
| `n_n` (noun + noun) | Two adjacent nouns forming a recognised compound. No adjectives, no possessives, no "of" phrases. |
| `verb` | Precise, less-common single-word verbs only. Exclude be/have/do/make/get/go/see/take/give. Exclude phrasal verbs. |
| `adverb` | Sophisticated single-word adverbs. Exclude very/really/quite/entirely/completely/truly/rapidly. |

**Example lexical items output:**
```javascript
const LEXICAL_ITEMS = [
  { phrase: "serious pollution",          type: "adj_n"  },
  { phrase: "substantial money",          type: "adj_n"  },
  { phrase: "valuable jobs",              type: "adj_n"  },
  { phrase: "severe air pollution",       type: "adj_n"  },
  { phrase: "chronic health problems",    type: "adj_n"  },
  { phrase: "short-term profits",         type: "adj_n"  },
  { phrase: "coal factories",             type: "n_n"    },
  { phrase: "operating costs",            type: "n_n"    },
  { phrase: "carbon footprints",          type: "n_n"    },
  { phrase: "damage",                     type: "verb"   },
  { phrase: "pollute",                    type: "verb"   },
  { phrase: "fundamentally",             type: "adverb" },
  { phrase: "severely",                  type: "adverb" },
  { phrase: "simultaneously",            type: "adverb" },
];
```

### D. Syntax Patterns Panel

Per rhetoric tag, the Lab extracts a reusable sentence template:

```json
{
  "syntax": {
    "rhetoric_tag": "example_1",
    "syntax_shell": "FOR EXAMPLE, [SUBJECT] [ECONOMIC GAIN] but also [ENVIRONMENTAL COST]",
    "sentence_example": "For example, major coal factories create valuable jobs but also cause severe air pollution..."
  }
}
```

Student clicks "Start Encoding →" to begin Part 2.

---

## Part 2 — Encoding (9 Practices)

Sequential. One-sit. Pass condition: 100% correct for all tools. On fail: V2 auto-loads (no retry button). Max 3 attempts; after 3rd failure → advance, record `failed_advanced: true`.

**Execution order and direction:**

```
MCQ (top-down: essay → lexical)      Scramble (bottom-up: lexical → essay)   Fill
─────────────────────────────────    ──────────────────────────────────────   ────
L4M → L3M → L2M → L1M               L1S → L2S → L3S → L4S                   L1F
```

### Practice Matrix

| # | Code | Tool | Level | What student does | Timer |
|---|---|---|---|---|---|
| 1 | L4M | MCQ | Essay | Identify: question / PoV pair / structure | Stopwatch |
| 2 | L3M | MCQ | Paragraph | Identify PoV of each body paragraph; identify which sentence plays which role | Stopwatch |
| 3 | L2M | MCQ | Sentence | Identify what each sentence does (no tag names in questions) | Stopwatch |
| 4 | L1M | MCQ | Lexical | Retrieve exact word/phrase; identify collocation and direction of connectors | Stopwatch |
| 5 | L1S | Scramble | Lexical | Click-to-place: arrange words/adjectives into correct sentence | Stopwatch |
| 6 | L2S | Scramble | Sentence | Click-to-place: arrange phrase chunks into correct sentence | Stopwatch |
| 7 | L3S | Scramble | Paragraph | Drag-to-order: arrange sentences into correct paragraph order | Stopwatch |
| 8 | L4S | Scramble | Essay | Drag-to-order: arrange paragraph opening sentences into correct essay order | Stopwatch |
| 9 | L1F | Fill | Lexical | Type exact lexical items into blanks — POS hint only, no word bank | Stopwatch |

---

## Part 3 — Applying (3 Write Practices)

Sequential. One-sit (required — L2W output feeds L3W via session state). No pass/fail for any Write practice.

| # | Code | What student does | Timer | Output |
|---|---|---|---|---|
| 10 | L2W | Rewrite the blanked sentence in a shown paragraph — syntax hint provided | Stopwatch | Session state only — never stored to DB |
| 11 | L3W | Write the blanked paragraph in a shown essay — own L2W sentences as collapsible reference | 40-min countdown | Stored → assembled into Artifact 2 (reconstructed essay) |
| 12 | L4W | Write full essay on challenge question — lexical panel + syntax panel available | 40-min countdown | Stored → Artifact 3 → EC, gates unit completion |

**L2W → L3W dependency:** L2W output lives in session state. When L3W opens, student sees their own L2W rewrites in a collapsible reference panel. On L3W submit, all L2W state clears. L2W is never written to DB.

---

## Practice Examples (Reference)

### L4M — Essay-Level MCQ

```
Q1: Which IELTS question does this essay answer?
  A. Economic growth and environmental protection are fundamentally incompatible. [agree/disagree]
  B. Some people think they cannot happen together; others believe countries can achieve both. [discuss both] ✓
  C. Industrial development brings benefits but also damage. [advantages/disadvantages]
  D. Environmental degradation is a serious problem. [causes/solutions]
  E. Many countries have experienced rapid growth. [effects]

Q2: Which pair of PoVs does this essay develop?
  A. "Environmental protection constrains economic growth" + "GDP doesn't count what matters"
  B. "Short-term profit damages long-term survival" + "Personal responsibility builds strong society"
  C. "Wealth enables innovation" + "Government investment drives innovation"
  D. "Short-term profit damages long-term survival" + "Green economy proves both are compatible" ✓
  E. "Personal choices accumulate to environmental impact" + "Government policy protects long-term survival"

Q3: The introduction ends: "This essay will discuss both views before giving my opinion."
    Which conclusion sentence must follow, and why?
  A. "In conclusion, schools should balance both..." [restates a position stated at the start]
  B. "In my opinion, while these goals were completely opposite in the past, today they can successfully work together..." ✓
     [introduction withheld the position — only conclusion can deliver it]
  C. "In conclusion, wealth inequality creates educational problems..." [summarises without opinion]
  D. "In my opinion, the disadvantages outweigh the advantages..." [belongs to a different essay]
  E. "In my view, economic growth must take priority..." [nuanced but wrong essay]
```

### L3M — Paragraph-Level MCQ

```
Q1: Which PoV does Body Paragraph 1 argue?
  A. Short-term profit damages long-term survival ✓
  B. Green economy proves both are compatible
  C. Wealth enables innovation

Q2: "These examples clearly show that when businesses try to grow rapidly, they usually harm nature
     significantly because protecting the environment costs substantial money and reduces short-term
     profits." — Which sentences does this draw a conclusion from?
  A. [Denmark wind turbines] + [Electric cars]
  B. [Coal factories] + [Fast fashion companies] ✓
  C. [Solar panels] + [Energy-efficient buildings]
  D. [Intro paraphrase] + [Intro outline]
  E. [Mechanism sentence] + [Body 2 explanation]

Q3: What is the topic sentence of Body Paragraph 1?
  A. People who see these goals as fundamentally opposite point to serious pollution from
     traditional factories and industries. ✓
  B. Some people think that economic growth and environmental protection cannot happen together...
  C. When companies focus on making substantial money, they often damage the natural environment.
  D. Fast fashion companies make considerable profits but produce massive amounts of waste.
```

### L2M — Sentence-Level MCQ

```
Q1: "Fast fashion companies make considerable profits but produce massive amounts of waste that
     pollute rivers and oceans." What is this sentence doing?
  A. Preview essay structure
  B. Restate the question in your own words
  C. First concrete example
  D. Second concrete example ✓
  E. Combine ideas into nuanced conclusion

Q2: "When companies focus on making substantial money, they often damage the natural environment
     severely." What role does this play in relation to the coal factory example?
  A. A completely different argument
  B. A second example alongside coal factories
  C. The general principle the coal factory then makes specific ✓
  D. The conclusion that follows after the coal factory example
  E. A counterargument to the coal factory example
```

### L1M — Lexical-Level MCQ

```
Q1: "For example, major coal factories create valuable jobs __________ cause severe air pollution
     and chronic health problems in surrounding communities."
  A. and also    B. but also ✓    C. while    D. because    E. and

Q2: "When companies focus on making substantial money, they often damage the natural
     environment __________."
  A. significantly    B. severely ✓    C. convincingly    D. simultaneously    E. entirely

Q3: "Fast fashion companies make __________ profits but produce __________ amounts of waste."
  A. substantial / massive
  B. considerable / massive ✓
  C. significant / massive
  D. considerable / enormous
  E. valuable / massive
```

### L1S — Lexical Scramble (click-to-place word bank)

```
"For example, major coal factories create __________ jobs but also cause __________ air
pollution and __________ health problems in __________ communities."
Word bank: [valuable] [severe] [chronic] [surrounding]
```

```
"Fast fashion companies make __________ profits but produce __________ amounts of waste
that pollute __________ and __________."
Word bank: [considerable] [massive] [rivers] [oceans]
```

### L2S — Sentence Scramble (click-to-place phrase chunks)

```
Arrange: [When companies focus on] [making substantial money,] [they often damage
          the natural environment] [severely.]
Answer:   B → D → A → C... (see prototype for full chunk IDs)
```

### L3S — Paragraph Scramble (drag-to-order sentences)

```
Arrange these sentences into the correct paragraph order:
  "People who see these goals as fundamentally opposite..."    [topic_sentence]
  "When companies focus on making substantial money..."        [explanation]
  "For example, major coal factories create valuable jobs..."  [example_1]
  "Fast fashion companies make considerable profits..."        [example_2]
  "These examples clearly show that when businesses..."        [mini_conclusion]

Correct order: topic_sentence → explanation → example_1 → example_2 → mini_conclusion
```

### L4S — Essay Scramble (drag-to-order paragraphs)

```
Arrange these paragraph openings into the correct essay order:
  A. "However, other people argue that modern technology shows both goals are entirely possible."
  B. "In my opinion, while these goals were completely opposite in the past..."
  C. "Some people think that economic growth and environmental protection cannot happen together..."
  D. "People who see these goals as fundamentally opposite point to serious pollution..."

Correct order: C → D → A → B
(Introduction → Body 1 → Body 2 → Conclusion)
```

### L1F — Lexical Fill (no word bank, POS hint only)

```
Introduction:
  "Some people think that __________ [ADJ+NOUN] and __________ [ADJ+NOUN] cannot happen
   together, while others believe countries can achieve both."
  → economic growth / environmental protection

Body 1:
  "People who see these goals as __________ [ADV] opposite point to serious pollution..."
  → fundamentally

  "When companies focus on making __________ [ADJ] money, they often damage the natural
   environment __________ [ADV]."
  → substantial / severely

  "For example, major coal factories create __________ [ADJ] jobs but also cause __________
   [ADJ] air pollution and __________ [ADJ] health problems in __________ [ADJ] communities."
  → valuable / severe / chronic / surrounding
```

### L2W — Sentence Write (stopwatch, session-only)

```
[Full paragraph shown — one sentence blanked]

"People who see these goals as fundamentally opposite point to serious pollution from
traditional factories and industries. ████████████████████████████████████████████
For example, major coal factories create valuable jobs but also cause severe air pollution
and chronic health problems in surrounding communities. Fast fashion companies make
considerable profits but produce massive amounts of waste that pollute rivers and oceans.
These examples clearly show that when businesses try to grow rapidly, they usually harm
nature significantly because protecting the environment costs substantial money and
reduces short-term profits."

Syntax hint: WHEN [ACTOR] FOCUS ON [ECONOMIC ACTION], THEY OFTEN [ENVIRONMENTAL CONSEQUENCE]
Tag: Mechanism — WHY profit-seeking damages the environment
```

### L3W — Paragraph Write (40-min countdown)

```
[Full essay shown — Body Paragraph 1 blanked]
[Collapsible: student's own L2W rewrites for Body 1 sentences]

Student writes the paragraph from memory.
Output assembled into reconstructed essay artifact.
```

### L4W — Challenge Essay Write (40-min countdown)

```
Challenge question (Lab-generated — same tension/direction, different framing):
  e.g. "Climate change is the greatest threat facing humanity. What are the main causes,
        and what steps can individuals and governments take to address it?"

[Lexical items panel — collapsible]
[Syntax patterns panel — collapsible]
Student writes full essay. Submit = Artifact 3 = unit gate.
```

---

## MCQ Distractor Rules (locked)

1. **Same-essay distractors:** Other sentences from the same essay at the same rhetoric level (e.g. `example_2` as distractor for a question about `example_1`)
2. **Paired-essay distractors:** Semantically similar sentences from the paired essay at 0.5–0.7 cosine similarity — close enough to be plausible, distinct enough to test comprehension
3. **No invented distractors.** Every option must be a real sentence from a real essay.
4. **Comprehensive coverage:** All sentences get targeted. A question about Body 1 is matched by a parallel question about Body 2.

---

## Locked Decisions (all resolved — see Design Brief for full spec)

| Decision | Locked value |
|---|---|
| Pass condition | 100% correct for MCQ, Scramble, Fill. No partial credit. |
| Retry behaviour | Auto-loads V2/V3 after feedback. No retry button. |
| MCQ retry | Different distractors (same correct answer) |
| Scramble/Fill retry | Same content |
| Max attempts | 3 (V1, V2, V3) — then advance with `failed_advanced: true` |
| Fill level | L1 only. No L2F, L3F, L4F. |
| Write levels | L2W, L3W, L4W only. No L1W. |
| L2W output | Session state only — never stored to DB |
| L2W → L3W | L2W session state shown as collapsible reference in L3W |
| L4W = unit gate | Submit L4W → unit complete → next unit unlocks |
| Timer: encoding | Stopwatch (tracking only) |
| Timer: L3W, L4W, P0 | 40-min countdown (guide — submission not blocked at 0:00) |
| Session model | One sit per part (P0, Part 2, Part 3). Part 1 is flexible. |
| Direction labels | `direction_id` internal only. Students see PoV human-readable names. |
