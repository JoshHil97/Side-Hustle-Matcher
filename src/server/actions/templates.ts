"use server";

import { parseCsvTags } from "@/lib/utils";
import { templateSchema } from "@/lib/validators/template";
import { getActionContext, getString, revalidateDashboardPaths, zodErrorToFieldErrors } from "@/server/actions/helpers";
import type { ActionState } from "@/server/actions/types";

export async function createTemplateAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await getActionContext(formData);
  if ("error" in context) return context.error;

  const parsed = templateSchema.safeParse({
    title: getString(formData, "title"),
    type: getString(formData, "type") || "other",
    tags: getString(formData, "tags"),
    content: getString(formData, "content"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix template fields.",
      errors: zodErrorToFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;

  const { error } = await context.supabase.from("templates").insert({
    user_id: context.userId,
    title: data.title,
    type: data.type,
    tags: parseCsvTags(data.tags ?? ""),
    content: data.content,
  });

  if (error) return { status: "error", message: error.message };

  revalidateDashboardPaths();
  return { status: "success", message: "Template saved." };
}

export async function updateTemplateAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await getActionContext(formData);
  if ("error" in context) return context.error;

  const templateId = getString(formData, "template_id");
  if (!templateId) return { status: "error", message: "Template ID is required." };

  const parsed = templateSchema.safeParse({
    title: getString(formData, "title"),
    type: getString(formData, "type") || "other",
    tags: getString(formData, "tags"),
    content: getString(formData, "content"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix template fields.",
      errors: zodErrorToFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;

  const { error } = await context.supabase
    .from("templates")
    .update({
      title: data.title,
      type: data.type,
      tags: parseCsvTags(data.tags ?? ""),
      content: data.content,
    })
    .eq("id", templateId)
    .eq("user_id", context.userId);

  if (error) return { status: "error", message: error.message };

  revalidateDashboardPaths();
  return { status: "success", message: "Template updated." };
}

export async function deleteTemplateAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await getActionContext(formData);
  if ("error" in context) return context.error;

  const templateId = getString(formData, "template_id");
  if (!templateId) return { status: "error", message: "Template ID is required." };

  const { error } = await context.supabase
    .from("templates")
    .delete()
    .eq("id", templateId)
    .eq("user_id", context.userId);

  if (error) return { status: "error", message: error.message };

  revalidateDashboardPaths();
  return { status: "success", message: "Template deleted." };
}
