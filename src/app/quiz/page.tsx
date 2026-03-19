"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ProgressBar } from "@/components/quiz/progress-bar";
import { QuizStep } from "@/components/quiz/quiz-step";
import { quizQuestions } from "@/data/questions";
import { loadQuizAnswers, saveQuizAnswers } from "@/lib/quiz-storage";
import type { QuizAnswers } from "@/lib/types";

function selectedValuesForQuestion(answers: QuizAnswers, questionId: keyof QuizAnswers): string[] {
  const value = answers[questionId];
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function isQuestionComplete(questionIndex: number, answers: QuizAnswers) {
  const question = quizQuestions[questionIndex];
  const selected = selectedValuesForQuestion(answers, question.id);

  if (question.type === "single") {
    return selected.length === 1;
  }

  const min = question.minSelections ?? 1;
  return selected.length >= min;
}

export default function QuizPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});

  useEffect(() => {
    const saved = loadQuizAnswers();
    if (!saved) return;

    const frame = window.requestAnimationFrame(() => {
      setAnswers(saved);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const currentQuestion = quizQuestions[currentIndex];
  const selectedValues = selectedValuesForQuestion(answers, currentQuestion.id);

  const canContinue = useMemo(() => isQuestionComplete(currentIndex, answers), [answers, currentIndex]);

  function selectValue(value: string) {
    setAnswers((prev) => {
      const next: QuizAnswers = { ...prev };

      if (currentQuestion.type === "single") {
        next[currentQuestion.id] = value as never;
      } else {
        const existing = selectedValuesForQuestion(prev, currentQuestion.id);
        const included = existing.includes(value);

        let updated: string[];
        if (included) {
          updated = existing.filter((item) => item !== value);
        } else {
          updated = [...existing, value];
        }

        if (currentQuestion.maxSelections && updated.length > currentQuestion.maxSelections) {
          updated = updated.slice(updated.length - currentQuestion.maxSelections);
        }

        next[currentQuestion.id] = updated as never;
      }

      saveQuizAnswers(next);
      return next;
    });
  }

  function goBack() {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }

  function goNext() {
    if (!canContinue) return;

    if (currentIndex === quizQuestions.length - 1) {
      saveQuizAnswers(answers);
      router.push("/results");
      return;
    }

    setCurrentIndex((prev) => Math.min(quizQuestions.length - 1, prev + 1));
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          ← Back to home
        </Link>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">One question per step</span>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-6">
        <ProgressBar currentStep={currentIndex + 1} totalSteps={quizQuestions.length} />
      </div>

      <div className="mt-5">
        <QuizStep question={currentQuestion} selectedValues={selectedValues} onSelect={selectValue} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={currentIndex === 0}
          className="inline-flex h-11 items-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={!canContinue}
          className="inline-flex h-11 items-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {currentIndex === quizQuestions.length - 1 ? "See my matches" : "Next"}
        </button>
      </div>
    </main>
  );
}
