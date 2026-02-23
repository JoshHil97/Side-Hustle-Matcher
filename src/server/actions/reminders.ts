"use server";

import { z } from "zod";
import { getActionContext, getString, revalidateDashboardPaths, zodErrorToFieldErrors } from "@/server/actions/helpers";
import type { ActionState } from "@/server/actions/types";

const reminderSchema = z.object({
  application_id: z.string().uuid(),
  title: z.string().trim().min(1, "Reminder title is required"),
  due_at: z.string().min(1, "Due date is required"),
  channel: z.enum(["in_app", "email"]).default("in_app"),
});

export async function createReminderAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await getActionContext(formData);
  if ("error" in context) return context.error;

  const parsed = reminderSchema.safeParse({
    application_id: getString(formData, "application_id"),
    title: getString(formData, "title"),
    due_at: getString(formData, "due_at"),
    channel: getString(formData, "channel") || "in_app",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix reminder fields.",
      errors: zodErrorToFieldErrors(parsed.error),
    };
  }

  const { error } = await context.supabase.from("reminders").insert({
    user_id: context.userId,
    application_id: parsed.data.application_id,
    title: parsed.data.title,
    due_at: parsed.data.due_at,
    channel: parsed.data.channel,
    status: "open",
  });

  if (error) return { status: "error", message: error.message };

  revalidateDashboardPaths(parsed.data.application_id);
  return { status: "success", message: "Reminder created." };
}

export async function updateReminderStatusAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await getActionContext(formData);
  if ("error" in context) return context.error;

  const reminderId = getString(formData, "reminder_id");
  const status = getString(formData, "status");
  const applicationId = getString(formData, "application_id");

  if (!reminderId || !status) {
    return { status: "error", message: "Reminder and status are required." };
  }

  const updates: {
    status: "open" | "done" | "dismissed";
    completed_at?: string | null;
  } = {
    status: status as "open" | "done" | "dismissed",
  };

  if (status === "done") {
    updates.completed_at = new Date().toISOString();
  }

  if (status === "open" || status === "dismissed") {
    updates.completed_at = null;
  }

  const { error } = await context.supabase
    .from("reminders")
    .update(updates)
    .eq("id", reminderId)
    .eq("user_id", context.userId);

  if (error) return { status: "error", message: error.message };

  revalidateDashboardPaths(applicationId || undefined);
  return { status: "success", message: "Reminder updated." };
}

export async function updateReminderStatusFormAction(formData: FormData): Promise<void> {
  await updateReminderStatusAction({ status: "idle" }, formData);
}
