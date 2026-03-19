import type { QuizOption } from "@/lib/types";

type AnswerChipsProps = {
  options: QuizOption[];
  selectedValues: string[];
  multi: boolean;
  onSelect: (value: string) => void;
};

export function AnswerChips({ options, selectedValues, multi, onSelect }: AnswerChipsProps) {
  return (
    <div className="grid gap-3">
      {options.map((option) => {
        const selected = selectedValues.includes(option.value);

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
              selected
                ? "border-amber-500 bg-amber-50 shadow-sm shadow-amber-200/60"
                : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-stone-900 break-words">{option.label}</p>
                {option.description ? <p className="mt-1 text-xs text-stone-600 break-words">{option.description}</p> : null}
              </div>
              <span
                className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                  selected ? "border-amber-500 bg-amber-500 text-white" : "border-stone-300 text-stone-400"
                }`}
              >
                {multi ? (selected ? "✓" : "+") : selected ? "✓" : ""}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
