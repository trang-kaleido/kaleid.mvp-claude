# WRITER.md — ESSAY GENERATION
Use during: Generator stage only

## PART 2: FROM DIRECTION TO PROSE

You have selected your directions. Now you must translate them into essay sentences that feel genuinely argued — not generically assembled and tagged afterward.

---

### STEP 3: WRITE THE ESSAY

After step 2, you have done thinking part and have a plan of which direction applied and how to apply those in the essaay, now your job is to write a complete, natural academic essay.

**1. Seeding Prose from Directions**


Each direction you selected has three fields. Use them as seeds — not labels:

- **The ARGUMENT seeds your topic sentence.** Paraphrase it in your own words for this question's context. Do not copy it literally.
- **The LOGIC seeds your explanation sentences.** Unpack the specific causal mechanism the LOGIC describes. Do not write vague "this is important" — write *how* and *why*, the mechanism the LOGIC identifies.
- **The pole's Essence shapes the paragraph's emotional center.** Every sentence should feel like it comes from the worldview this pole represents. If you cannot feel the worldview in your paragraph, the direction is being used as a label, not as a lens.

**1b. Freestyle Paragraphs (when no direction fits)**

If your plan from Step 2 marks a paragraph as **freestyle** (per the Freestyle Pivot Rule in Thinking.md), write that paragraph using your own reasoned argument:

- Build your topic sentence from the question's own logic — what a thoughtful person would naturally argue.
- Your explanation and examples must still be specific, concrete, and well-developed (same density rules apply).
- The paragraph must integrate smoothly with the directed paragraphs around it.
- All sentences in a freestyle paragraph will receive `direction_tag: null` during tagging.

**2. Writing Standards**
- **The Traceability Rule:** A student who has read the direction's LOGIC in Reference.md must be able to recognise that mechanism at work in your paragraph. If they cannot, the paragraph has failed — rewrite it using the LOGIC's specific mechanism, image, or causal chain.
- **Logical Progression:** Every paragraph must flow from the previous one using sophisticated cohesive devices (e.g., _"This tension suggests that..."_, _"Conversely, from a Flourishing perspective..."_).
- **Tone & Audience:** Maintain a tone appropriate for a 15-year-old reader: clear, concise, and academic.
- **Naturalism:** The essay must read as a genuine response to the question.

**3. Structural Density**

To meet the mandatory word count floor, apply "Sentence Expansion" to every rhetoric slot:

- The 20-Word Explanation Formula: Every `explanation` slot must be at least 20 words. Seed the conditional from the direction's LOGIC.
- The Detailed Example Rule: Every `example` slot must be at least 15 words.
- Hedging phrases: use adverbs of degree, frequency and probability e.g. considerably, significantly, fundamentally, slightly, largely, insignificantly, completely, highly, rarely.. ; phrasal verbs e.g. bring about, stem from, account for, tend to, appear to, be likely to, cope with, set out to,..; and modal verbs where naturally fit

**4. Word Count Targets (Strict Compliance)**

You are FORBIDDEN from outputting fewer than the following word counts:

| Structure   | Total   | Intro | Each Body | Conclusion |
| ----------- | ------- | ----- | --------- | ---------- |
| 4-paragraph | 250–280 | 30–40 | 80–90     | 25–35      |
| 5-paragraph | 280–320 | 30–40 | 60–70     | 20–30      |

---

### STEP 4: TRACEABILITY CHECK (before decomposing)

Before moving to tagging, verify that each body paragraph passes its quality test:

**For directed paragraphs** — apply the **Student Recognition Test:**

For each directed body paragraph, answer: *"If a student reads the LOGIC field of the direction assigned to this paragraph, will they see that specific mechanism operating in the prose?"*

- If YES → proceed.
- If NO → the paragraph is generic IELTS prose with a label attached. Return to the direction's LOGIC field and rewrite the explanation sentence to contain the specific mechanism, image, or causal chain from that LOGIC.

This is not optional. A directed paragraph that cannot be traced back to its direction's LOGIC undermines the entire framework — it teaches the student nothing about how the argument works.

**For freestyle paragraphs** — apply the **Standalone Quality Test:**

For each freestyle body paragraph, answer: *"Does this paragraph make a specific, concrete argument with a clear causal mechanism and real-world grounding — or is it vague filler?"*

- If specific and concrete → proceed.
- If vague → rewrite with a clearer mechanism and sharper examples. Freestyle is not a license for lower quality.

---

### STEP 5: DECOMPOSE INTO SENTENCES BY RHETORIC SLOT

→ Refer to Reference.md Section 3: Structure Templates

Break your essay into individual sentences. Map each sentence to its rhetoric slot based on the structure template selected in Step 1.

Every sentence must map to exactly one rhetoric tag.

---

### STEP 6: TAG EACH SENTENCE

→ Refer to Reference.md Section 2: Rhetoric Tags → Refer to Reference.md Section 1: Direction IDs

For each sentence assign:

- rhetoric_tag: one valid tag from Reference.md Section 2
- direction_tag: one valid direction IDs from Reference.md Section 1, or null

**STRICT RULE:** You must look up the exact string ID in **Reference.md**. Do **NOT** invent direction names. Do **NOT** flip the prefix order.

When to use null:
- Introduction sentences that paraphrase or preview (no argument vector yet)
- Conclusion sentences that summarize without introducing new direction
- Transition sentences
- **Freestyle sentences:** Any sentence in a paragraph where the Freestyle Pivot Rule was applied (no intuitive direction found). These sentences carry valid, well-reasoned arguments — they simply do not map to a precomputed direction. Tagging them null preserves data integrity and prevents overfitting.

**CRITICAL TAG ORDER CHECK:** You are forbidden from using any tag where Pole A and Pole B are in the wrong order. You must physically find the tag in the Reference list before typing it.

---

## SELF-CHECK BEFORE OUTPUT

### Quality of Reasoning
- [ ] Does the essay address all parts of the question?
- [ ] For **directed paragraphs:** Does the reasoning in the prose grow from the direction's **LOGIC** field, or am I just using the tag as a label for generic IELTS-speak?
- [ ] For **directed paragraphs:** Can I trace each body paragraph's argument back to a specific direction's ARGUMENT and LOGIC?
- [ ] **Student Recognition Test (directed paragraphs):** Would a student who has read the direction's LOGIC in Reference.md recognise that specific mechanism at work in the paragraph? (If not — rewrite the paragraph. This is the most important quality check.)
- [ ] For **freestyle paragraphs:** Is the reasoning specific, concrete, and well-argued on its own terms? (A freestyle paragraph must be just as high-quality as a directed one — the only difference is it doesn't trace to a precomputed direction.)
- [ ] **Freestyle Integrity Check:** Did I use freestyle only because no direction genuinely fit — or did I use it as a shortcut to avoid the harder work of direction-seeded writing? (If the latter — go back and try directions again.)
- [ ] Did I understand the collision (from Thinking.md Part 4) before writing, or did I skip straight to tagging?
- [ ] Does every body paragraph connect the argument to how real people experience this force (the Human Anchor)?
- [ ] If I removed all tags, would a reader still recognize a genuine, well-argued essay?

### Structural Compliance
- [ ] Are word counts within target for each paragraph?
- [ ] Did the essay flow naturally before tagging was applied?

### Tag Integrity
- [ ] Are there any ideas in **directed paragraphs** not grounded in the KALEIDO framework? (Freestyle paragraphs are exempt from this check — they are intentionally outside the framework.)
- [ ] Does every sentence have at least 2 lexical items extracted?
- [ ] Are lexical items extracted exactly as written — no paraphrasing?

### Refusal Criteria (if any fail, revise before outputting)
- [ ] **Traceability (directed paragraphs):** For each directed body paragraph, the explanation sentence must contain the specific mechanism from the direction's LOGIC — not a generic restatement of the ARGUMENT, but the actual causal chain, image, or concrete scenario from the LOGIC field. A paragraph that could be tagged with ANY direction has failed.
- [ ] **Freestyle Quality (freestyle paragraphs):** For each freestyle body paragraph, the reasoning must be specific and concrete — not vague IELTS filler. A freestyle paragraph that lacks a clear causal mechanism or concrete examples has failed just as a poorly-directed paragraph would.
- [ ] Logic Alignment: Does the reasoning match the **LOGIC** description in Reference.md for each direction used? (Applies to directed paragraphs only.)
- [ ] Human Anchor: Does every body paragraph explain the impact on real human experience (the Flourishing axis)?
- [ ] Structural Density: Is the total word count at or above the target floor? (If not, expand the **Explanation** and **Example** slots immediately.)
- [ ] Tag Integrity: Are all `direction_tag` and `rhetoric_tag` values exact matches from valid IDs?

---

### STEP 7: EXTRACT LEXICAL ITEMS PER SENTENCE

**Valid forms — extract any of these patterns:**

- ADJ + NOUN pairs — only specific or evaluative adjectives (e.g. "urban sprawl", "chronic unemployment") — NOT common adjectives (good/bad/big/small/important/possible/necessary)
- Compound NOUN + NOUN (e.g. "carbon emissions", "income inequality")
- Precise single-word verbs (e.g. "exacerbate", "incentivise", "undermine") — NOT common verbs (be/have/do/make/get/go/see/take/give/show/work/focus/cost/prove/demonstrate/argue)
- Sophisticated single-word adverbs (e.g. "disproportionately", "inevitably") — NOT weak adverbs (very/really/quite/clearly/entirely/completely/truly/rapidly)

**Exclusion rules — do NOT extract:**

- Common adjectives: good/bad/big/small/important/possible/necessary (and equivalents)
- Common verbs: be/have/do/make/get/go/see/take/give/show/work/focus/cost/prove/demonstrate/argue
- Weak adverbs: very/really/quite/clearly/entirely/completely/truly/rapidly
- Adverb + adjective combinations (e.g. "very significant")
- Possessives (e.g. "society's values")
- Phrases containing "and" or "of"

**Quality bar:** Extract only Band 7+ IELTS vocabulary. When in doubt, EXCLUDE.

**Other rules:**
- Minimum 2 items per sentence, no maximum
- Phrases must appear VERBATIM in the sentence — no paraphrasing
- **Human-Centric:** Ensure the content reflects the "Essence" of the poles from Thinking.md, not just mechanical causality.

---

### OUTPUT FORMAT

Return ONLY valid JSON. No preamble, no explanation, no markdown fences.

```json
{
  "structure_type": "structure_N",
  "sentences": [
    {
      "paragraph_type": "introduction",
      "order": 1,
      "text": "Full sentence text here.",
      "rhetoric_tag": "paraphrase_question",
      "direction_tag": null,
      "lexical_items": [{"phrase": "exact phrase"}, {"phrase": "another phrase"}],
      "syntax_pattern": "Some people argue that X, while others believe Y."
    }
  ]
}
```

CRITICAL:
- The root object must have exactly two keys: `structure_type` and `sentences`.
- Every sentence in the essay must appear as an entry in the `sentences` array.
- Every `direction_tag` must be an EXACT match from your assigned directions, or null.
- Every `rhetoric_tag` must be an EXACT match from the rhetoric tags provided.
- Every `lexical_items` entry must contain the verbatim phrase from the sentence text.

---

**END OF WRITER**
