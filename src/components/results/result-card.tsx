import type { RecommendationResult } from "@/lib/types";

type ResultCardProps = {
  result: RecommendationResult;
  compact?: boolean;
  rank?: number;
};

function fitPillClass(label: RecommendationResult["fitLabel"]) {
  if (label === "High Fit") return "bg-amber-100 text-amber-800";
  if (label === "Solid Fit") return "bg-orange-100 text-orange-800";
  return "bg-amber-100 text-amber-800";
}

function rankAccent(rank?: number) {
  if (rank === 1) return "border-amber-300 shadow-amber-900/10";
  if (rank === 2) return "border-orange-300 shadow-orange-900/10";
  if (rank === 3) return "border-yellow-300 shadow-yellow-900/10";
  return "border-stone-200 shadow-stone-900/5";
}

function evidenceRow(title: string, values: string[]) {
  if (values.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <span key={`${title}-${value}`} className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ResultCard({ result, compact = false, rank }: ResultCardProps) {
  const hustle = result.sideHustle;

  return (
    <article className={`rounded-3xl border bg-white p-5 shadow-sm sm:p-6 ${rankAccent(rank)}`}>
      <div className="flex flex-wrap items-center gap-2">
        {rank ? <span className="inline-flex rounded-full bg-stone-900 px-2.5 py-1 text-xs font-semibold text-white">#{rank}</span> : null}
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${fitPillClass(result.fitLabel)}`}>{result.fitLabel}</span>
        <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">{result.totalScore}/100</span>
        <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">{hustle.category}</span>
      </div>

      <h3 className="mt-3 text-xl font-semibold text-stone-900">{hustle.name}</h3>
      <p className="mt-2 text-sm text-stone-600">{result.personalizedSummary}</p>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-stone-700 sm:grid-cols-4">
        <div className="rounded-xl bg-stone-50 p-2">
          <dt className="font-semibold">Startup cost</dt>
          <dd className="mt-1 capitalize">{hustle.startupCostBand}</dd>
        </div>
        <div className="rounded-xl bg-stone-50 p-2">
          <dt className="font-semibold">Weekly time</dt>
          <dd className="mt-1">
            {hustle.weeklyHoursMin}-{hustle.weeklyHoursMax} hrs
          </dd>
        </div>
        <div className="rounded-xl bg-stone-50 p-2">
          <dt className="font-semibold">Commercial fit</dt>
          <dd className="mt-1">{result.breakdown.commercialFit}/100</dd>
        </div>
        <div className="rounded-xl bg-stone-50 p-2">
          <dt className="font-semibold">Execution confidence</dt>
          <dd className="mt-1">{result.confidenceScore}/100</dd>
        </div>
      </dl>

      <section className="mt-5">
        <h4 className="text-sm font-semibold text-stone-900">Why this matches your answers</h4>
        <ul className="mt-2 grid gap-1 text-sm text-stone-700">
          {result.whyItFits.slice(0, compact ? 2 : 4).map((line) => (
            <li key={line}>• {line}</li>
          ))}
        </ul>
      </section>

      {!compact ? (
        <>
          <section className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <h4 className="text-sm font-semibold text-stone-900">Evidence from your quiz</h4>
            <div className="mt-3 grid gap-3">{evidenceRow("Task signals", result.evidence.tasks)}{evidenceRow("Tool signals", result.evidence.tools)}{evidenceRow("Output signals", result.evidence.outputs)}</div>
          </section>

          <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h4 className="text-sm font-semibold text-stone-900">Commercial angle</h4>
            <ul className="mt-2 grid gap-1 text-sm text-stone-700">
              <li>• {result.commercialAngle.idealBuyer}</li>
              <li>• {result.commercialAngle.offerPositioning}</li>
              <li>• Starter pricing: {result.commercialAngle.suggestedStarterPrice}</li>
            </ul>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-stone-500">Outreach opener</p>
            <p className="mt-1 rounded-xl bg-white p-3 text-sm leading-6 text-stone-700">{result.commercialAngle.outreachStarter}</p>
            <p className="mt-2 text-sm font-medium text-amber-900">{result.commercialAngle.conversionCTA}</p>
          </section>

          <section className="mt-4">
            <h4 className="text-sm font-semibold text-stone-900">One simple first offer</h4>
            <p className="mt-2 text-sm text-stone-700">{hustle.firstOfferExamples[0]}</p>
          </section>

          <section className="mt-4">
            <h4 className="text-sm font-semibold text-stone-900">3 concrete steps for this week</h4>
            <ul className="mt-2 grid gap-1 text-sm text-stone-700">
              {hustle.firstWeekSteps.slice(0, 3).map((step) => (
                <li key={step}>• {step}</li>
              ))}
            </ul>
          </section>

          <section className="mt-4">
            <h4 className="text-sm font-semibold text-stone-900">Watch out for...</h4>
            <ul className="mt-2 grid gap-1 text-sm text-stone-700">
              {hustle.watchOutFor.slice(0, 2).map((line) => (
                <li key={line}>• {line}</li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </article>
  );
}
