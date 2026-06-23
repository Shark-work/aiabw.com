import { DailyPuzzleClient } from "@/components/daily-puzzle-client";
import { getTodayPuzzle } from "@/lib/puzzle";

export const dynamic = "force-dynamic";

export default async function Home() {
  const puzzle = await getTodayPuzzle();

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.35),_transparent_30%),linear-gradient(180deg,_#050816_0%,_#0b1023_50%,_#050816_100%)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between gap-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Daily AI Puzzle</p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">每天一个新的 AI 冒险谜题</h1>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 backdrop-blur-xl">DeepSeek + Supabase</div>
        </header>

        <section className="flex flex-1 items-center justify-center py-8">
          <DailyPuzzleClient initialPuzzle={puzzle} />
        </section>
      </div>
    </main>
  );
}
