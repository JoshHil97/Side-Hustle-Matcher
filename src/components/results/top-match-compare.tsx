import type { RecommendationResult } from "@/lib/types";

type TopMatchCompareProps = {
  matches: RecommendationResult[];
};

export function TopMatchCompare({ matches }: TopMatchCompareProps) {
  if (matches.length === 0) return null;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-6">
      <h3 className="text-lg font-semibold text-slate-900">Top 3 comparison</h3>
      <p className="mt-1 text-sm text-slate-600">Quick view of score, effort, and income speed across your best options.</p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-3">Hustle</th>
              <th className="py-2 pr-3">Score</th>
              <th className="py-2 pr-3">Cost</th>
              <th className="py-2 pr-3">Hours</th>
              <th className="py-2 pr-3">Scalability</th>
              <th className="py-2 pr-3">Time to first income</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <tr key={match.sideHustle.id} className="border-b border-slate-100 text-slate-700 last:border-0">
                <td className="py-3 pr-3 font-semibold text-slate-900">{match.sideHustle.name}</td>
                <td className="py-3 pr-3">{match.totalScore}</td>
                <td className="py-3 pr-3 capitalize">{match.sideHustle.startupCostBand}</td>
                <td className="py-3 pr-3">
                  {match.sideHustle.weeklyHoursMin}-{match.sideHustle.weeklyHoursMax}
                </td>
                <td className="py-3 pr-3 capitalize">{match.sideHustle.scalability}</td>
                <td className="py-3 pr-3 capitalize">{match.sideHustle.timeToFirstIncome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
