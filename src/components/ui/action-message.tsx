import type { ActionState } from "@/server/actions/types";

export function ActionMessage({ state }: { state: ActionState | null }) {
  if (!state?.message) return null;
  return (
    <p
      className={
        state.status === "error"
          ? "text-sm text-red-600"
          : state.status === "success"
            ? "text-sm text-emerald-700"
            : "text-sm text-stone-600"
      }
      role="status"
      aria-live="polite"
    >
      {state.message}
    </p>
  );
}
