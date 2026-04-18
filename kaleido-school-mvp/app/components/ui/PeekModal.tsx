/**
 * PeekModal — displays the model essay, PoV cards, and lexical items panel.
 *
 * AC-3.10: No rate limit — the parent controls isOpen freely; this component
 *          is stateless with respect to peek usage.
 *
 * PROPS DESIGN: Why accept sentences[] + povCards[] rather than a full PrepUnit?
 *   The PoV cards need direction_ref.argument (the human-readable argument text),
 *   which is NOT stored inside PrepUnit.sentences. The F08 P1 route loader will
 *   join direction_ref at load time and pass the pre-joined povCards[] here.
 *   Keeping this component pure (no Prisma/server imports) makes it reusable
 *   across all 10 P1 practices without any database dependency.
 */
import { Link } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { povContent } from "~/content/pov-content";

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

// ─── Sub-components ──────────────────────────────────────────────────────────

/**
 * Groups sentences by paragraph_type and renders them as paragraph blocks.
 * Each sentence shows its rhetoric_label as a hover tooltip.
 * Paragraphs are displayed in natural order:
 * introduction → body_1 → body_2 → body_3 → body_4 → conclusion
 */
function EssayPanel({ sentences }: { sentences: Sentence[] }) {
  const paragraphOrder = ["introduction", "body_1", "body_2", "body_3", "body_4", "conclusion"];

  const grouped = sentences.reduce<Record<string, Sentence[]>>((acc, s) => {
    const key = s.paragraph_type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => a.order - b.order);
  }

  function paragraphLabel(key: string): string {
    if (key === "introduction") return "Introduction";
    if (key === "conclusion") return "Conclusion";
    return key.replace("body_", "Body ").replace("_", " ");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
          Model Essay
        </h3>
        <p className="text-xs text-gray-400 italic">
          Hover over any sentence to see its rhetorical function.
        </p>
      </div>
      {paragraphOrder.map((paraType) => {
        const parasentences = grouped[paraType];
        if (!parasentences || parasentences.length === 0) return null;
        return (
          <div key={paraType} className="space-y-1">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {paragraphLabel(paraType)}
            </p>
            <div className="rounded-lg border-2 border-gray-500 bg-white p-4 flex flex-col gap-2 shadow-[3px_3px_0px_0px_rgba(17,24,39,0.5)]">
              {parasentences.map((s) => (
                <div key={s.sentence_id} className="relative group">
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {s.canonical_text}
                  </p>
                  <span className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 pointer-events-none">
                    {s.rhetoric_label}
                  </span>
                </div>
              ))}
            </div>
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
            className="rounded-lg border-2 border-gray-500 bg-gray-50 p-4 space-y-2 shadow-[3px_3px_0px_0px_rgba(17,24,39,0.5)]"
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
            {/* Deep-dive link — only shown when static PoV content exists */}
            {povContent[card.blogSlug] && (
              <Link
                to={`/pov/${card.blogSlug}?from=peek`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Deep-dive →
              </Link>
            )}
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
        Key Vocabulary
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
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto border-2 border-gray-500 shadow-[6px_6px_0px_0px_rgba(17,24,39,0.5)]">
        <DialogHeader>
          <DialogTitle>Model Essay</DialogTitle>
        </DialogHeader>

        {/* Three panels stacked vertically with a divider between each. */}
        <div className="space-y-8 mt-2">
          {/* Panel 1: Essay text with rhetoric label tooltips on hover */}
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
