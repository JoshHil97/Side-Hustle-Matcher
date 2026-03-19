import { AnswerChips } from "@/components/quiz/answer-chips";
import type { QuizQuestion } from "@/lib/types";

type QuizStepProps = {
  question: QuizQuestion;
  selectedValues: string[];
  onSelect: (value: string) => void;
};

export function QuizStep({ question, selectedValues, onSelect }: QuizStepProps) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5 sm:p-7">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">{question.groupLabel}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">{question.prompt}</h2>
        {question.helperText ? <p className="mt-2 text-sm text-stone-600">{question.helperText}</p> : null}
      </div>

      <AnswerChips
        options={question.options}
        selectedValues={selectedValues}
        multi={question.type === "multi"}
        onSelect={onSelect}
      />

      {question.type === "multi" && question.maxSelections ? (
        <p className="mt-4 text-xs text-stone-500">
          Selected {selectedValues.length}
          {question.minSelections ? ` (minimum ${question.minSelections})` : ""}
          {question.maxSelections ? `, maximum ${question.maxSelections}` : ""}
        </p>
      ) : null}
    </section>
  );
}
