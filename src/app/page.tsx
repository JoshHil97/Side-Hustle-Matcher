import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/10 sm:p-10">
        <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-cyan-100 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-emerald-100 blur-3xl" />

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Side Hustle Matcher</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Find the best side hustle for your actual skills.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Turn your day-job tasks, tools, and strengths into realistic extra income options. No generic personality fluff, just practical
            matches you can start this week.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/quiz"
              className="inline-flex h-11 items-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Start the quiz
            </Link>
            <span className="text-sm text-slate-500">Takes about 5 minutes. 15 practical questions.</span>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Step 1</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">Map your current work</h2>
          <p className="mt-2 text-sm text-slate-600">We normalize your role family, weekly tasks, tools, and outputs into a skill profile.</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Step 2</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">Apply reality filters</h2>
          <p className="mt-2 text-sm text-slate-600">
            We filter for your time, budget, calls, sales comfort, regulation tolerance, and employer conflict limits.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Step 3</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">Get clear recommendations</h2>
          <p className="mt-2 text-sm text-slate-600">See your top fits, alternatives, and one poor-fit option so you avoid wasted effort.</p>
        </article>
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
        <h3 className="text-xl font-semibold text-slate-900">Built to feel credible, not random</h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Recommendations are based on a weighted engine: skill match, preference fit, constraint fit, scalability, and time to first cash,
          then friction penalties for budget, schedule, sales, and regulation mismatch.
        </p>
      </section>
    </main>
  );
}
