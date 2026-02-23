"use server";

import { z } from "zod";
import { getActionContext, getString, revalidateDashboardPaths, zodErrorToFieldErrors } from "@/server/actions/helpers";
import type { ActionState } from "@/server/actions/types";

const noteSchema = z.object({
  application_id: z.string().uuid(),
  kind: z.enum(["general", "interview_prep", "follow_up", "company_research"]),
  content: z.string().trim().min(1, "Note content is required"),
});

export async function createNoteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await getActionContext(formData);
  if ("error" in context) return context.error;

  const parsed = noteSchema.safeParse({
    application_id: getString(formData, "application_id"),
    kind: getString(formData, "kind") || "general",
    content: getString(formData, "content"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix note fields.",
      errors: zodErrorToFieldErrors(parsed.error),
    };
  }

  const { application_id, kind, content } = parsed.data;

  const { error } = await context.supabase.from("notes").insert({
    user_id: context.userId,
    application_id,
    kind,
    content,
  });

  if (error) return { status: "error", message: error.message };

  revalidateDashboardPaths(application_id);
  return { status: "success", message: "Note added." };
}

export async function deleteNoteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await getActionContext(formData);
  if ("error" in context) return context.error;

  const noteId = getString(formData, "note_id");
  const applicationId = getString(formData, "application_id");

  if (!noteId) return { status: "error", message: "Note ID is required." };

  const { error } = await context.supabase
    .from("notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", context.userId);

  if (error) return { status: "error", message: error.message };

  revalidateDashboardPaths(applicationId || undefined);
  return { status: "success", message: "Note deleted." };
}
