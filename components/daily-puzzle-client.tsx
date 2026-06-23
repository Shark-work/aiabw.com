"use client";

import { useMemo, useState } from "react";
import type { DailyPuzzle } from "@/lib/types";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function DailyPuzzleClient({ initialPuzzle }: { initialPuzzle: DailyPuzzle }) {
  const [puzzle] = useState(initialPuzzle);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const selectedOptionText = useMemo(
    () => (selectedIndex === null ? "" : puzzle.options[selectedIndex]?.text ?? ""),
    [puzzle.options, selectedIndex],
  );

  async function handleSelect(index: number) {
    if (isLoading || revealed) return;

    setSelectedIndex(index);
    setIsLoading(true);

    const response = await fetch("/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answerIndex: index, date: puzzle.date }),
    });

    const data = await response.json();
    setIsCorrect(Boolean(data?.result?.correct));
    setFeedback(data?.result?.explanation ?? "");
    setRevealed(true);
    setIsLoading(false);
  }

  return (
    <article className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white/8 p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur-2xl sm:p-8">
      <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/50 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3 text-sm text-cyan-100/70">
          <span className="rounded-full bg-cyan-400/10 px-3 py-1">今日谜题</span>
          <span>{puzzle.date}</span>
        </div>

        <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          {puzzle.title}
        </h2>
        <p className="mt-4 text-base leading-7 text-white/80 sm:text-lg">
          {puzzle.story}
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-200/70">
            问题
          </p>
          <p className="mt-2 text-lg text-white">{puzzle.question}</p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {puzzle.options.map((option, index) => {
            const active = selectedIndex === index;
            const showCorrect = revealed && index === puzzle.correctAnswerIndex;
            const showWrong = revealed && active && !isCorrect;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(index)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border px-4 py-4 text-left transition-all duration-300",
                  "bg-white/5 hover:-translate-y-0.5 hover:bg-white/10",
                  active && !revealed && "border-cyan-300/60 bg-cyan-300/10",
                  showCorrect && "border-emerald-300/70 bg-emerald-400/10",
                  showWrong && "border-rose-300/70 bg-rose-400/10",
                  !active && !showCorrect && !showWrong && "border-white/10",
                )}
                disabled={isLoading || revealed}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/20 text-sm font-semibold text-white/80">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div>
                    <p className="font-medium text-white">{option.text}</p>
                    {showCorrect && (
                      <p className="mt-2 text-sm text-emerald-200">正确答案</p>
                    )}
                    {showWrong && (
                      <p className="mt-2 text-sm text-rose-200">选择错误</p>
                    )}
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute -left-8 top-0 h-full w-16 rotate-12 bg-white/10 blur-xl" />
                </div>
              </button>
            );
          })}
        </div>

        {revealed && (
          <div
            className={cn(
              "mt-6 rounded-2xl border p-4 text-sm sm:text-base animate-in fade-in slide-in-from-bottom-4 duration-300",
              isCorrect
                ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
                : "border-rose-300/30 bg-rose-400/10 text-rose-100",
            )}
          >
            <p className="font-semibold">
              {isCorrect ? "回答正确" : "回答错误"}
            </p>
            <p className="mt-2 text-white/85">
              {feedback}
            </p>
            <p className="mt-2 text-white/70">
              正确答案是：{puzzle.options[puzzle.correctAnswerIndex]?.text}
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-3 text-sm text-white/75 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-cyan-200/70">知识点</p>
            <p className="mt-1 leading-6">{puzzle.knowledgePoint}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-cyan-200/70">提示</p>
            <p className="mt-1 leading-6">{puzzle.hint}</p>
          </div>
        </div>

        <p className="mt-5 text-xs text-white/45">
          {selectedIndex !== null ? `你选择了：${selectedOptionText}` : "请选择一个选项开始挑战"}
        </p>
      </div>
    </article>
  );
}
