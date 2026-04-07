/**
 * pov.$directionTag — PoV Blog Page
 *
 * Renders the full "Dive Deep" content for a single argument type.
 * Content comes from the static pov-content.ts map (no DB query).
 *
 * Back navigation is driven by ?from and ?unitId query params:
 *   ?from=pov-intro&unitId=xxx  → back to /unit/:unitId/p1/pov-intro
 *   ?from=question-bank         → back to /question-bank
 *   (default)                   → back to /dashboard
 *
 * Sections: Hook → Core Concept → How to Spot It → Real IELTS Examples
 */
import { Link } from "react-router";
import { povContent, poleStyles } from "~/content/pov-content";
import type { PovEntry } from "~/content/pov-content";
import type { Route } from "./+types/pov.$directionTag";

// ─── Loader ───────────────────────────────────────────────────────────────────

export async function loader({ params, request }: Route.LoaderArgs) {
  const { directionTag } = params;
  const entry: PovEntry | undefined = povContent[directionTag];

  if (!entry) {
    throw new Response("Not Found", { status: 404 });
  }

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const unitId = url.searchParams.get("unitId");

  const backHref =
    from === "pov-intro" && unitId
      ? `/unit/${unitId}/p1/pov-intro`
      : from === "question-bank"
      ? "/question-bank"
      : "/dashboard";

  const backLabel =
    from === "pov-intro"
      ? "← Back to Perspectives"
      : from === "question-bank"
      ? "← Back to Question Bank"
      : "← Dashboard";

  return { entry, backHref, backLabel };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PovPage({ loaderData }: Route.ComponentProps) {
  const { entry, backHref, backLabel } = loaderData;
  const { title, poles, hook, core, det, top } = entry;

  const pole1Style = poleStyles[poles[0]];
  const pole2Style = poleStyles[poles[1]];

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">

        {/* ── Back link ───────────────────────────────────────────────── */}
        <Link
          to={backHref}
          className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors self-start"
        >
          {backLabel}
        </Link>

        {/* ── Pole badges + title ─────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`${pole1Style} border-2 border-gray-900 px-3 py-1 text-xs font-black uppercase tracking-widest`}
            >
              {poles[0]}
            </span>
            <span className="text-gray-400 font-black text-sm">⚡</span>
            <span
              className={`${pole2Style} border-2 border-gray-900 px-3 py-1 text-xs font-black uppercase tracking-widest`}
            >
              {poles[1]}
            </span>
          </div>
          <h1 className="text-3xl font-black uppercase text-gray-900 leading-tight">
            {title}
          </h1>
        </div>

        {/* ── Hook ────────────────────────────────────────────────────── */}
        <section className="rounded-lg border-2 border-gray-500 bg-white p-6 shadow-[4px_4px_0px_0px_rgba(17,24,39,0.5)] flex flex-col gap-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            <span className="bg-amber-200 font-bold px-1">Imagine this:</span>{" "}
            {hook.analogy}
          </p>
          <p className="text-sm font-bold text-gray-900">
            This is what we call{" "}
            <span className="underline decoration-2">{hook.name}</span>.
          </p>
        </section>

        {/* ── Core concept ────────────────────────────────────────────── */}
        <section className="rounded-lg border-2 border-gray-900 bg-gray-900 text-white p-6 shadow-[4px_4px_0px_0px_rgba(6,182,212,0.7)] flex flex-col gap-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-cyan-400">
            Core Concept
          </h2>
          <h3 className="text-lg font-black text-white">{core.name}</h3>
          <p className="text-sm text-gray-300 leading-relaxed">{core.analogy}</p>
          <div className="rounded border-2 border-gray-500 bg-white/10 p-4">
            <p className="text-sm font-bold text-white leading-relaxed">
              {core.exp}
            </p>
          </div>
        </section>

        {/* ── How to spot it ──────────────────────────────────────────── */}
        <section className="rounded-lg border-2 border-gray-500 bg-stone-100 p-6 shadow-[4px_4px_0px_0px_rgba(17,24,39,0.5)] flex flex-col gap-5">
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">
              How to spot this in an exam
            </h2>
            <p className="text-sm font-bold text-gray-900">
              Ask yourself these two questions:
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {/* Q1 — keyed to pole 1 */}
            <div className="flex items-start gap-3 bg-white rounded border-2 border-gray-500 p-3">
              <span
                className={`${pole1Style} border-2 border-gray-900 w-7 h-7 flex-shrink-0 flex items-center justify-center text-xs font-black`}
              >
                1
              </span>
              <p className="text-sm font-semibold text-gray-900 pt-0.5">
                {det.q1}
              </p>
            </div>
            {/* Q2 — keyed to pole 2 */}
            <div className="flex items-start gap-3 bg-white rounded border-2 border-gray-500 p-3">
              <span
                className={`${pole2Style} border-2 border-gray-900 w-7 h-7 flex-shrink-0 flex items-center justify-center text-xs font-black`}
              >
                2
              </span>
              <p className="text-sm font-semibold text-gray-900 pt-0.5">
                {det.q2}
              </p>
            </div>
          </div>

          {/* Template sentence */}
          <div className="rounded border-2 border-gray-500 bg-white p-4 shadow-[3px_3px_0px_0px_rgba(219,48,105,0.6)] relative">
            <span className="absolute -top-2.5 left-3 bg-pink-500 text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-widest border border-gray-900">
              How to write it
            </span>
            <p className="text-sm font-semibold italic text-gray-800 mt-1">
              &ldquo;{det.t}&rdquo;
            </p>
          </div>
        </section>

        {/* ── Real IELTS examples ─────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">
            Real IELTS Examples
          </h2>

          {top.map((example, i) => (
            <div
              key={i}
              className="rounded-lg border-2 border-gray-500 bg-white shadow-[4px_4px_0px_0px_rgba(17,24,39,0.5)] overflow-hidden"
            >
              {/* Topic header */}
              <div className="border-b-2 border-gray-500 px-5 py-3">
                <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">
                  {example.t}
                </h3>
              </div>

              {/* Promise / Reality two-column */}
              <div className="grid sm:grid-cols-2">
                {/* Promise */}
                <div className="p-4 border-b-2 sm:border-b-0 sm:border-r-2 border-gray-500 bg-stone-50 flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    The Promise
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {example.r}
                  </p>
                </div>
                {/* Reality */}
                <div className="p-4 bg-gray-900 flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                    The Reality
                  </span>
                  <p className="text-sm text-gray-200 leading-relaxed">
                    {example.p}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* ── Closing reminder ────────────────────────────────────────── */}
        <div className="rounded-lg border-2 border-gray-900 bg-gray-900 text-white p-5 flex flex-col gap-2 mb-4">
          <p className="text-xs font-black uppercase tracking-widest text-cyan-400">
            Next time you see this topic
          </p>
          <p className="text-sm text-gray-300 leading-relaxed">
            Pause and ask:{" "}
            <span className="text-cyan-400 font-semibold">{det.q1}</span> And{" "}
            <span className="text-pink-400 font-semibold">{det.q2}</span>
          </p>
        </div>

      </div>
    </div>
  );
}
