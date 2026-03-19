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
                ? "border-emerald-500 bg-emerald-50 shadow-sm shadow-emerald-200/60"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                {option.description ? <p className="mt-1 text-xs text-slate-600">{option.description}</p> : null}
              </div>
              <span
                className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                  selected ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-slate-400"
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
