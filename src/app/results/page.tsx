"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ResultCard } from "@/components/results/result-card";
import { TopMatchCompare } from "@/components/results/top-match-compare";
import { clearQuizAnswers, loadQuizAnswers } from "@/lib/quiz-storage";
import { formatSkillTag } from "@/lib/recommendation-explanations";
import { getRecommendations, scoreExampleScenario } from "@/lib/scoring";
import type { RecommendationBundle } from "@/lib/types";

export default function ResultsPage() {
  const [bundle, setBundle] = useState<RecommendationBundle | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const answers = loadQuizAnswers();

    const frame = window.requestAnimationFrame(() => {
      setBundle(answers ? getRecommendations(answers) : null);
      setReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const exampleScenario = useMemo(() => scoreExampleScenario(), []);

  if (!ready) {
    return <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-10 sm:px-6">Loading results...</main>;
  }

  if (!bundle) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10 sm:px-6">
        <section className="rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm shadow-stone-900/5">
          <h1 className="text-2xl font-semibold text-stone-900">No quiz answers found</h1>
          <p className="mt-3 text-sm text-stone-600">Start the quiz first so we can calculate your practical side hustle matches.</p>
          <Link href="/quiz" className="mt-6 inline-flex h-11 items-center rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white">
            Start quiz
          </Link>
        </section>
      </main>
    );
  }

  const primaryMatch = bundle.topMatches[0] ?? null;
  const topSkills = bundle.normalized.skillTags.slice(0, 8);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 pb-28 sm:px-6 sm:py-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/quiz" className="text-sm font-medium text-stone-600 hover:text-stone-900">
          ← Back to quiz
        </Link>
        <button
          type="button"
          onClick={() => {
            clearQuizAnswers();
            window.location.assign("/quiz");
          }}
          className="inline-flex h-10 items-center rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:bg-stone-50"
        >
          Retake quiz
        </button>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-6 shadow-sm shadow-stone-900/5 sm:p-8">
        <div className="absolute -left-12 -top-12 h-48 w-48 rounded-full bg-orange-100 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-56 w-56 rounded-full bg-amber-100 blur-3xl" />

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Personalised recommendation engine</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 sm:text-4xl">Your top side hustle paths, ranked for real-world execution</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
            We scored based on your role ({bundle.normalized.roleFamilyLabel}), selected tasks, tools, outputs, constraints, and commercial fit.
            Your current goal is
            <span className="font-semibold text-stone-800"> {bundle.normalized.preferenceStyle.goal.replaceAll("_", " ")} </span>
            with
            <span className="font-semibold text-stone-800"> {bundle.normalized.constraints.maxWeeklyHours} hrs/week</span> available.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {topSkills.map((skill) => (
              <span key={skill} className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
                {formatSkillTag(skill)}
              </span>
            ))}
          </div>

          {primaryMatch ? (
            <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Best first move</p>
              <h2 className="mt-1 text-xl font-semibold text-stone-900">Start with {primaryMatch.sideHustle.name}</h2>
              <p className="mt-1 text-sm text-stone-700">{primaryMatch.personalizedSummary}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-700">
                <span className="rounded-full bg-white px-2.5 py-1 font-semibold">Commercial fit {primaryMatch.breakdown.commercialFit}/100</span>
                <span className="rounded-full bg-white px-2.5 py-1 font-semibold">Confidence {primaryMatch.confidenceScore}/100</span>
                <span className="rounded-full bg-white px-2.5 py-1 font-semibold">{primaryMatch.totalScore}/100 total</span>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        {bundle.topMatches.map((match, index) => (
          <ResultCard key={match.sideHustle.id} result={match} rank={index + 1} />
        ))}
      </section>

      <div className="mt-6">
        <TopMatchCompare matches={bundle.topMatches} />
      </div>

      {primaryMatch ? (
        <section id="primary-plan" className="mt-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5 sm:p-6">
          <h2 className="text-lg font-semibold text-stone-900">Launch plan for your top match</h2>
          <p className="mt-1 text-sm text-stone-600">Use this to move from recommendation to first offer this week.</p>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <h3 className="text-sm font-semibold text-stone-900">Offer strategy</h3>
              <ul className="mt-2 grid gap-1 text-sm text-stone-700">
                <li>• {primaryMatch.commercialAngle.idealBuyer}</li>
                <li>• {primaryMatch.commercialAngle.offerPositioning}</li>
                <li>• Pricing anchor: {primaryMatch.commercialAngle.suggestedStarterPrice}</li>
                <li>• {primaryMatch.commercialAngle.conversionCTA}</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="text-sm font-semibold text-stone-900">Outreach opener</h3>
              <p className="mt-2 rounded-xl bg-white p-3 text-sm leading-6 text-stone-700">{primaryMatch.commercialAngle.outreachStarter}</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5 sm:p-6">
          <h2 className="text-lg font-semibold text-stone-900">Alternative options</h2>
          <p className="mt-1 text-sm text-stone-600">Still viable paths, but slightly lower commercial or confidence fit than your top 3.</p>
          <div className="mt-4 grid gap-3">
            {bundle.alternatives.length > 0 ? (
              bundle.alternatives.map((option) => <ResultCard key={option.sideHustle.id} result={option} compact />)
            ) : (
              <p className="text-sm text-stone-600">No alternatives passed your strict constraints. Try relaxing one filter and re-run.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 shadow-sm shadow-rose-900/5 sm:p-6">
          <h2 className="text-lg font-semibold text-stone-900">Attractive but poor fit right now</h2>
          {bundle.poorFit ? (
            <>
              <p className="mt-2 text-sm text-stone-700">
                <span className="font-semibold">{bundle.poorFit.sideHustle.name}</span> may look attractive, but your current constraints make it high risk.
              </p>
              <ul className="mt-3 grid gap-1 text-sm text-rose-900">
                {bundle.poorFit.penaltyReasons.map((reason) => (
                  <li key={reason}>• {reason}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-stone-600">This is shown intentionally so you avoid low-probability paths right now.</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-stone-700">All options were eligible under your current settings.</p>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5 sm:p-6">
        <h2 className="text-lg font-semibold text-stone-900">Scoring engine transparency (example scenario)</h2>
        <p className="mt-1 text-sm text-stone-600">Same engine, fixed example answers. Useful for tuning weights and understanding ranking behavior.</p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
                <th className="py-2 pr-3">Side hustle</th>
                <th className="py-2 pr-3">Score</th>
                <th className="py-2 pr-3">Skill</th>
                <th className="py-2 pr-3">Preference</th>
                <th className="py-2 pr-3">Constraint</th>
                <th className="py-2 pr-3">Commercial</th>
                <th className="py-2 pr-3">Confidence</th>
                <th className="py-2 pr-3">Penalty</th>
              </tr>
            </thead>
            <tbody>
              {exampleScenario.top5.map((item) => (
                <tr key={item.sideHustle} className="border-b border-stone-100 text-stone-700 last:border-0">
                  <td className="py-3 pr-3 font-semibold text-stone-900">{item.sideHustle}</td>
                  <td className="py-3 pr-3">{item.score}</td>
                  <td className="py-3 pr-3">{item.breakdown.skillMatch}</td>
                  <td className="py-3 pr-3">{item.breakdown.preferenceFit}</td>
                  <td className="py-3 pr-3">{item.breakdown.constraintFit}</td>
                  <td className="py-3 pr-3">{item.breakdown.commercialFit}</td>
                  <td className="py-3 pr-3">{item.breakdown.confidenceFit}</td>
                  <td className="py-3 pr-3">{item.breakdown.frictionPenalty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
