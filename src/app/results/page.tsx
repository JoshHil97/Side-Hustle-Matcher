"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ResultCard } from "@/components/results/result-card";
import { TopMatchCompare } from "@/components/results/top-match-compare";
import { roleFamilyById } from "@/data/roleFamilies";
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
        <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-900/5">
          <h1 className="text-2xl font-semibold text-slate-900">No quiz answers found</h1>
          <p className="mt-3 text-sm text-slate-600">Start the quiz first so we can calculate your practical side hustle matches.</p>
          <Link href="/quiz" className="mt-6 inline-flex h-11 items-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white">
            Start quiz
          </Link>
        </section>
      </main>
    );
  }

  const roleLabel = roleFamilyById[bundle.normalized.roleFamily]?.label ?? "Your role";
  const topSkills = bundle.normalized.skillTags.slice(0, 8);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/quiz" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          ← Back to quiz
        </Link>
        <button
          type="button"
          onClick={() => {
            clearQuizAnswers();
            window.location.assign("/quiz");
          }}
          className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Retake quiz
        </button>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Your profile snapshot</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Top side hustles matched to your real work profile</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          We matched from your role ({roleLabel}), tasks, tools, outputs, and constraints. Your goal is
          <span className="font-semibold text-slate-800"> {bundle.normalized.preferenceStyle.goal.replaceAll("_", " ")} </span>
          with
          <span className="font-semibold text-slate-800"> {bundle.normalized.constraints.maxWeeklyHours} hrs/week</span> available.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {topSkills.map((skill) => (
            <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              {formatSkillTag(skill)}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        {bundle.topMatches.map((match) => (
          <ResultCard key={match.sideHustle.id} result={match} />
        ))}
      </section>

      <div className="mt-6">
        <TopMatchCompare matches={bundle.topMatches} />
      </div>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Alternative options</h2>
          <p className="mt-1 text-sm text-slate-600">These still fit your profile, but scored slightly lower than your top 3.</p>
          <div className="mt-4 grid gap-3">
            {bundle.alternatives.length > 0 ? (
              bundle.alternatives.map((option) => <ResultCard key={option.sideHustle.id} result={option} compact />)
            ) : (
              <p className="text-sm text-slate-600">No alternatives passed your strict constraints. Try relaxing one filter and re-run.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 shadow-sm shadow-rose-900/5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Attractive but poor fit right now</h2>
          {bundle.poorFit ? (
            <>
              <p className="mt-2 text-sm text-slate-700">
                <span className="font-semibold">{bundle.poorFit.sideHustle.name}</span> looks attractive, but your current constraints make it risky.
              </p>
              <ul className="mt-3 grid gap-1 text-sm text-rose-900">
                {bundle.poorFit.penaltyReasons.map((reason) => (
                  <li key={reason}>• {reason}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-slate-600">This improves trust by showing what to avoid until your constraints change.</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-700">All options were eligible under your current settings.</p>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Scoring engine example</h2>
        <p className="mt-1 text-sm text-slate-600">
          Example answer set is stored in local data and scored by the same logic so you can tune weights safely.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3">Side hustle</th>
                <th className="py-2 pr-3">Score</th>
                <th className="py-2 pr-3">Skill</th>
                <th className="py-2 pr-3">Preference</th>
                <th className="py-2 pr-3">Constraint</th>
                <th className="py-2 pr-3">Penalty</th>
              </tr>
            </thead>
            <tbody>
              {exampleScenario.top5.map((item) => (
                <tr key={item.sideHustle} className="border-b border-slate-100 text-slate-700 last:border-0">
                  <td className="py-3 pr-3 font-semibold text-slate-900">{item.sideHustle}</td>
                  <td className="py-3 pr-3">{item.score}</td>
                  <td className="py-3 pr-3">{item.breakdown.skillMatch}</td>
                  <td className="py-3 pr-3">{item.breakdown.preferenceFit}</td>
                  <td className="py-3 pr-3">{item.breakdown.constraintFit}</td>
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
