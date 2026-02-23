"use server";

import { z } from "zod";
import { getActionContext, getString, revalidateDashboardPaths, zodErrorToFieldErrors } from "@/server/actions/helpers";
import type { ActionState } from "@/server/actions/types";

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required"),
});

export async function updateProfileAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await getActionContext(formData);
  if ("error" in context) return context.error;

  const parsed = profileSchema.safeParse({
    full_name: getString(formData, "full_name"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix profile fields.",
      errors: zodErrorToFieldErrors(parsed.error),
    };
  }

  const { error } = await context.supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name })
    .eq("id", context.userId);

  if (error) return { status: "error", message: error.message };

  revalidateDashboardPaths();
  return { status: "success", message: "Profile updated." };
}
