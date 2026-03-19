import type { QuizAnswers } from "@/lib/types";

export const QUIZ_STORAGE_KEY = "side_hustle_matcher_answers_v1";

export function loadQuizAnswers(): QuizAnswers | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(QUIZ_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as QuizAnswers;
    return parsed;
  } catch {
    return null;
  }
}

export function saveQuizAnswers(answers: QuizAnswers) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(answers));
}

export function clearQuizAnswers() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(QUIZ_STORAGE_KEY);
}
