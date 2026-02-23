export type FieldErrors = Record<string, string[]>;

export type ActionState<T = unknown> = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: FieldErrors;
  data?: T;
};

export const initialActionState: ActionState = {
  status: "idle",
};
