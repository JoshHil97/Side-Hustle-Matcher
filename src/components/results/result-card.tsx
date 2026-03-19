import type { RecommendationResult } from "@/lib/types";

type ResultCardProps = {
  result: RecommendationResult;
  compact?: boolean;
};

function fitPillClass(label: RecommendationResult["fitLabel"]) {
  if (label === "High Fit") return "bg-emerald-100 text-emerald-800";
  if (label === "Solid Fit") return "bg-cyan-100 text-cyan-800";
  return "bg-amber-100 text-amber-800";
}

export function ResultCard({ result, compact = false }: ResultCardProps) {
  const hustle = result.sideHustle;

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${fitPillClass(result.fitLabel)}`}>
          {result.fitLabel}
        </span>
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{result.totalScore}/100</span>
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{hustle.category}</span>
      </div>

      <h3 className="mt-3 text-xl font-semibold text-slate-900">{hustle.name}</h3>
      <p className="mt-2 text-sm text-slate-600">{hustle.shortDescription}</p>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-700 sm:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-2">
          <dt className="font-semibold">Startup cost</dt>
          <dd className="mt-1 capitalize">{hustle.startupCostBand}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-2">
          <dt className="font-semibold">Weekly time</dt>
          <dd className="mt-1">
            {hustle.weeklyHoursMin}-{hustle.weeklyHoursMax} hrs
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-2">
          <dt className="font-semibold">Delivery</dt>
          <dd className="mt-1 capitalize">{hustle.onlineOffline}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-2">
          <dt className="font-semibold">Time to first income</dt>
          <dd className="mt-1 capitalize">{hustle.timeToFirstIncome}</dd>
        </div>
      </dl>

      <section className="mt-5">
        <h4 className="text-sm font-semibold text-slate-900">Why this matched</h4>
        <ul className="mt-2 grid gap-1 text-sm text-slate-700">
          {result.whyItFits.slice(0, compact ? 2 : 4).map((line) => (
            <li key={line}>• {line}</li>
          ))}
        </ul>
      </section>

      <section className="mt-4">
        <h4 className="text-sm font-semibold text-slate-900">Best for you if...</h4>
        <ul className="mt-2 grid gap-1 text-sm text-slate-700">
          {hustle.bestForYouIf.slice(0, compact ? 2 : 3).map((line) => (
            <li key={line}>• {line}</li>
          ))}
        </ul>
      </section>

      <section className="mt-4">
        <h4 className="text-sm font-semibold text-slate-900">Watch out for...</h4>
        <ul className="mt-2 grid gap-1 text-sm text-slate-700">
          {hustle.watchOutFor.slice(0, compact ? 1 : 2).map((line) => (
            <li key={line}>• {line}</li>
          ))}
        </ul>
      </section>

      {!compact ? (
        <>
          <section className="mt-4">
            <h4 className="text-sm font-semibold text-slate-900">One simple first offer</h4>
            <p className="mt-2 text-sm text-slate-700">{hustle.firstOfferExamples[0]}</p>
          </section>

          <section className="mt-4">
            <h4 className="text-sm font-semibold text-slate-900">3 concrete steps for this week</h4>
            <ul className="mt-2 grid gap-1 text-sm text-slate-700">
              {hustle.firstWeekSteps.slice(0, 3).map((step) => (
                <li key={step}>• {step}</li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </article>
  );
}
