import Link from "next/link";
import { TardisRunnerGame } from "@/components/game/tardis-runner-game";

export default function PlayPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-sm font-semibold text-slate-700 transition hover:text-slate-900">
          ← Back to home
        </Link>
        <p className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">Quick break mode</p>
      </div>

      <TardisRunnerGame />
    </main>
  );
}

