/**
 * PeekModal — displays the model essay, PoV cards, and lexical items panel.
 *
 * AC-3.9: Essay text colour-coded by POS (NOUN=emerald, VERB=red, ADV=blue),
 *         rhetoric labels as hover tooltips, PoV cards with blog links, lexical panel.
 * AC-3.10: No rate limit — the parent controls isOpen freely; this component
 *          is stateless with respect to peek usage.
 *
 * SECURITY: No dangerouslySetInnerHTML anywhere in this file.
 *   Colour-coding is done by splitting canonical_text into text segments using
 *   JavaScript string operations, then rendering each segment as a React element.
 *
 * PROPS DESIGN: Why accept sentences[] + povCards[] rather than a full PrepUnit?
 *   The PoV cards need direction_ref.argument (the human-readable argument text),
 *   which is NOT stored inside PrepUnit.sentences. The F08 P1 route loader will
 *   join direction_ref at load time and pass the pre-joined povCards[] here.
 *   Keeping this component pure (no Prisma/server imports) makes it reusable
 *   across all 10 P1 practices without any database dependency.
 */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

// ─── Type Definitions ────────────────────────────────────────────────────────

/** Matches the LexicalItem shape from LAB-SCHOOL-CONTRACT.md §6 */
interface LexicalItem {
  phrase: string; // e.g. "government funding"
  pos: string;    // e.g. "NOUN"
}

/** Matches the Sentence shape from LAB-SCHOOL-CONTRACT.md §6 */
interface Sentence {
  sentence_id: string;
  paragraph_type: string;   // "introduction" | "body_1" | "body_2" | "body_3" | "conclusion"
  order: number;            // 1-based position within paragraph
  canonical_text: string;   // full sentence text
  rhetoric_tag: string;
  rhetoric_label: string;   // e.g. "Body — unpacks the causal mechanism"
  direction_tag: string | null;
  lexical_items: LexicalItem[];
  syntax_items: string[];
}

/**
 * Pre-joined by the P1 route loader (F08).
 * The loader does: prisma.directionRef.findMany({ where: { directionId: { in: uniqueDirectionTags } } })
 * and computes this shape before passing it to PeekModal.
 */
export interface PovCard {
  paragraphType: string;    // "body_1", "body_2", etc.
  directionLabel: string;   // direction_ref.argument — e.g. "Environmental crisis demands government action"
  topicSentence: string;    // canonical_text of the first sentence in that body paragraph
  blogSlug: string;         // direction_id — used in URL: https://kaleido.io/blog/{slug}
}

interface PeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  sentences: Sentence[];   // from PrepUnit.sentences (LAB-SCHOOL-CONTRACT §6)
  povCards: PovCard[];     // pre-joined by P1 loader
}

// ─── POS Colour Helpers ──────────────────────────────────────────────────────

/**
 * Returns the Tailwind class for a given part-of-speech tag.
 * NOUN  → emerald (green) + semibold
 * VERB  → red
 * ADV   → blue
 * Other → empty string (no class = default text colour)
 */
function posClass(pos: string): string {
  switch (pos) {
    case "NOUN": return "text-emerald-600 font-semibold";
    case "VERB": return "text-red-600";
    case "ADV":  return "text-blue-600";
    default:     return "";
  }
}

/**
 * A text segment: either plain text (no pos) or a coloured phrase (has pos).
 * We build an array of these, then render each one as a React element.
 */
interface TextSegment {
  text: string;
  pos?: string; // undefined = plain text
}

/**
 * Splits `text` into segments based on `lexicalItems`.
 *
 * ALGORITHM (safe, no regex injection, no dangerouslySetInnerHTML):
 * 1. Sort phrases longest-first — prevents "funding" matching inside
 *    "government funding" before the full phrase is found.
 * 2. Walk through the text character-by-character. At each position, check
 *    if any phrase starts here (case-insensitive).
 * 3. When a phrase is found, push any accumulated plain text before it, then
 *    push a coloured segment, then advance past the phrase.
 * 4. Push any remaining text as a plain segment at the end.
 *
 * WHY character-by-character instead of String.split()?
 * split() on a phrase like "the" would also split inside "there" or "another".
 * The character walk with exact prefix matching avoids false splits.
 */
function splitIntoSegments(text: string, lexicalItems: LexicalItem[]): TextSegment[] {
  // Step 1: Sort phrases longest-first to prevent partial-match interference.
  const sorted = [...lexicalItems].sort((a, b) => b.phrase.length - a.phrase.length);

  const segments: TextSegment[] = [];
  let i = 0;
  let plainStart = 0; // tracks the start of the current plain-text run

  while (i < text.length) {
    let matched = false;

    for (const item of sorted) {
      const phrase = item.phrase;
      // Case-insensitive comparison: compare a slice of text to the phrase.
      if (text.slice(i, i + phrase.length).toLowerCase() === phrase.toLowerCase()) {
        // Flush any plain text accumulated before this match.
        if (i > plainStart) {
          segments.push({ text: text.slice(plainStart, i) });
        }
        // Push the matched phrase as a coloured segment.
        segments.push({ text: text.slice(i, i + phrase.length), pos: item.pos });
        i += phrase.length;
        plainStart = i;
        matched = true;
        break; // Move on; the longest match at this position has been handled.
      }
    }

    if (!matched) {
      i++; // No phrase matched here — advance one character.
    }
  }

  // Flush any remaining plain text after the last match.
  if (plainStart < text.length) {
    segments.push({ text: text.slice(plainStart) });
  }

  return segments;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/**
 * Renders a single sentence with:
 * - Colour-coded lexical items (via segment splitting)
 * - A hover tooltip showing the rhetoric label
 *
 * The wrapping <span> has title={rhetoric_label} so the browser shows a
 * native tooltip on hover. This is the simplest accessible approach.
 */
function ColourCodedSentence({ sentence }: { sentence: Sentence }) {
  const segments = splitIntoSegments(sentence.canonical_text, sentence.lexical_items);

  return (
    // title= gives a browser native tooltip with the rhetoric label on hover.
    // This satisfies AC-3.9 "rhetoric tag tooltips on sentence hover".
    <span title={sentence.rhetoric_label} className="cursor-default">
      {segments.map((seg, idx) =>
        seg.pos ? (
          <span key={idx} className={posClass(seg.pos)}>
            {seg.text}
          </span>
        ) : (
          // Plain text — React renders strings directly, no extra wrapper needed.
          <span key={idx}>{seg.text}</span>
        )
      )}
    </span>
  );
}

/**
 * Groups sentences by paragraph_type and renders them as paragraph blocks.
 * Paragraphs are displayed in their natural order:
 * introduction → body_1 → body_2 → body_3 → conclusion
 */
function EssayPanel({ sentences }: { sentences: Sentence[] }) {
  // Define the order paragraphs appear in the essay.
  const paragraphOrder = ["introduction", "body_1", "body_2", "body_3", "conclusion"];

  // Group sentences by paragraph_type.
  // Object.groupBy is not universally available, so we use reduce instead.
  const grouped = sentences.reduce<Record<string, Sentence[]>>((acc, s) => {
    const key = s.paragraph_type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  // Sort each group by sentence order (1-based).
  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => a.order - b.order);
  }

  // Pretty-print a paragraph_type key for display (e.g. "body_1" → "Body 1")
  function paragraphLabel(key: string): string {
    if (key === "introduction") return "Introduction";
    if (key === "conclusion") return "Conclusion";
    // "body_1" → "Body 1", "body_2" → "Body 2", etc.
    return key.replace("body_", "Body ").replace("_", " ");
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
        Model Essay
      </h3>
      {/* Colour-coding legend so students understand the system */}
      <div className="flex gap-4 text-xs">
        <span className="text-emerald-600 font-semibold">■ Noun Phrases</span>
        <span className="text-red-600">■ Verbs</span>
        <span className="text-blue-600">■ Adverbs</span>
      </div>
      {paragraphOrder.map((paraType) => {
        const parasentences = grouped[paraType];
        // Skip paragraph types not present in this essay (e.g. body_3 may not exist).
        if (!parasentences || parasentences.length === 0) return null;
        return (
          <div key={paraType} className="space-y-1">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {paragraphLabel(paraType)}
            </p>
            {/* Sentences in the same paragraph are rendered inline, space-separated. */}
            <p className="text-sm leading-relaxed text-gray-800">
              {parasentences.map((s, idx) => (
                <span key={s.sentence_id}>
                  {idx > 0 && " "}
                  <ColourCodedSentence sentence={s} />
                </span>
              ))}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Renders PoV cards — one per body paragraph.
 * Each card shows the argument summary, topic sentence quote, and a blog link.
 *
 * UX Spec §12: direction label, argument, topic sentence quote, blog link (opens new tab).
 */
function PovPanel({ povCards }: { povCards: PovCard[] }) {
  if (povCards.length === 0) return null;

  // Pretty-print paragraph type (e.g. "body_1" → "Body 1")
  function formatParaType(pt: string): string {
    return pt.replace("body_", "Body ").replace("_", " ");
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
        Points of View
      </h3>
      <div className="space-y-3">
        {povCards.map((card) => (
          <div
            key={card.paragraphType}
            className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2"
          >
            {/* Paragraph label, e.g. "Body 1" */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {formatParaType(card.paragraphType)}
            </p>
            {/* The argument summary (direction_ref.argument) */}
            <p className="text-sm font-medium text-gray-800">{card.directionLabel}</p>
            {/* Topic sentence in italic quote style */}
            <p className="text-sm italic text-gray-600 border-l-2 border-gray-300 pl-3">
              "{card.topicSentence}"
            </p>
            {/* Blog deep-dive link — opens in new tab, rel prevents tab hijacking */}
            <a
              href={`https://kaleido.io/blog/${card.blogSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              Deep-dive →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Renders the lexical items panel — collected from all sentences, deduplicated,
 * then grouped into Noun Phrases / Verbs / Adverbs with colour-coded pills.
 */
function LexicalPanel({ sentences }: { sentences: Sentence[] }) {
  // Collect all lexical items from every sentence and deduplicate by phrase.
  // Using a Map keyed on lowercase phrase ensures we don't show duplicates.
  const deduped = new Map<string, LexicalItem>();
  for (const s of sentences) {
    for (const item of s.lexical_items) {
      const key = item.phrase.toLowerCase();
      if (!deduped.has(key)) {
        deduped.set(key, item);
      }
    }
  }
  const allItems = Array.from(deduped.values());

  // Group by POS.
  const nouns = allItems.filter((i) => i.pos === "NOUN");
  const verbs = allItems.filter((i) => i.pos === "VERB");
  const advs  = allItems.filter((i) => i.pos === "ADV");

  if (allItems.length === 0) return null;

  // A small pill/chip component rendered inline.
  function Pill({ text, className }: { text: string; className: string }) {
    return (
      <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${className}`}>
        {text}
      </span>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
        Lexical Items
      </h3>
      {nouns.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-emerald-700">Noun Phrases</p>
          <div className="flex flex-wrap gap-1.5">
            {nouns.map((item) => (
              <Pill
                key={item.phrase}
                text={item.phrase}
                className="bg-emerald-50 text-emerald-700"
              />
            ))}
          </div>
        </div>
      )}
      {verbs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-red-700">Verbs</p>
          <div className="flex flex-wrap gap-1.5">
            {verbs.map((item) => (
              <Pill
                key={item.phrase}
                text={item.phrase}
                className="bg-red-50 text-red-700"
              />
            ))}
          </div>
        </div>
      )}
      {advs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-blue-700">Adverbs</p>
          <div className="flex flex-wrap gap-1.5">
            {advs.map((item) => (
              <Pill
                key={item.phrase}
                text={item.phrase}
                className="bg-blue-50 text-blue-700"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * PeekModal — the root export. Composes Dialog with the three content panels.
 *
 * Usage (P1 page, F08):
 *   <PeekModal
 *     isOpen={peekOpen}
 *     onClose={() => setPeekOpen(false)}
 *     sentences={prepUnit.sentences}
 *     povCards={povCards}   // computed by P1 loader
 *   />
 */
export function PeekModal({ isOpen, onClose, sentences, povCards }: PeekModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      {/*
        max-w-3xl: wider than default sm:max-w-lg so the essay has room to breathe.
        max-h-[85vh]: cap height so it doesn't overflow on small screens.
        overflow-y-auto: the panel scrolls if content is taller than the modal.
      */}
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Peek — Model Essay</DialogTitle>
        </DialogHeader>

        {/* Three panels stacked vertically with a divider between each. */}
        <div className="space-y-8 mt-2">
          {/* Panel 1: Colour-coded essay text with rhetoric tooltips */}
          <EssayPanel sentences={sentences} />

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Panel 2: PoV cards (direction label, topic sentence, blog link) */}
          <PovPanel povCards={povCards} />

          {/* Divider — only show if we have pov cards above */}
          {povCards.length > 0 && <hr className="border-gray-200" />}

          {/* Panel 3: Deduplicated lexical items grouped by POS */}
          <LexicalPanel sentences={sentences} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
