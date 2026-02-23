import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-20">
      <section className="grid w-full gap-12 rounded-3xl border border-stone-200 bg-white/95 p-8 shadow-xl shadow-stone-900/5 lg:grid-cols-2 lg:p-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-700">Career Command</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
            Premium CRM for serious job hunting.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-stone-600">
            Centralise every application, interview timeline, follow-up, file version, contact, and research note in one searchable system.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center rounded-md border border-stone-600 bg-stone-600 px-5 text-sm font-medium text-white hover:bg-stone-700"
            >
              Create account
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-md border border-stone-300 bg-white px-5 text-sm font-medium text-stone-800 hover:bg-stone-50"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
          <p className="text-sm font-semibold text-stone-900">Built for interview readiness</p>
          <ul className="mt-4 space-y-3 text-sm text-stone-700">
            <li>Track status pipeline from draft to offer</li>
            <li>Store CV/cover letter versions by application</li>
            <li>Capture notes, reminders, and contact history</li>
            <li>View funnel and weekly analytics instantly</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
