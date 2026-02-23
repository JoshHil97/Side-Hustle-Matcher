"use server";

import { applicationSchema } from "@/lib/validators/application";
import { getActionContext, getNullableDate, getNullableInt, getNullableString, getString, revalidateDashboardPaths, zodErrorToFieldErrors } from "@/server/actions/helpers";
import type { ActionState } from "@/server/actions/types";

export async function createApplicationAction(_: ActionState, formData: FormData): Promise<ActionState<{ id: string }>> {
  const context = await getActionContext(formData);
  if ("error" in context) return context.error;

  const raw = {
    company_id: getString(formData, "company_id"),
    company_name: getString(formData, "company_name"),
    role_title: getString(formData, "role_title"),
    job_url: getString(formData, "job_url"),
    location: getString(formData, "location"),
    work_mode: getString(formData, "work_mode"),
    salary_min: getString(formData, "salary_min"),
    salary_max: getString(formData, "salary_max"),
    currency: getString(formData, "currency") || "GBP",
    date_posted: getString(formData, "date_posted"),
    date_applied: getString(formData, "date_applied"),
    source: getString(formData, "source"),
    priority: getString(formData, "priority") || "medium",
    status: (getString(formData, "intent") === "draft" ? "draft" : getString(formData, "status")) || "applied",
    next_step_date: getString(formData, "next_step_date"),
    next_step_note: getString(formData, "next_step_note"),
    description_snapshot: getString(formData, "description_snapshot"),
    fit_score: getString(formData, "fit_score"),
  };

  const parsed = applicationSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: zodErrorToFieldErrors(parsed.error),
    };
  }

  const payload = parsed.data;

  const { data, error } = await context.supabase
    .from("applications")
    .insert({
      user_id: context.userId,
      company_id: payload.company_id || null,
      company_name: payload.company_name,
      role_title: payload.role_title,
      job_url: payload.job_url || null,
      location: payload.location?.trim() || null,
      work_mode: payload.work_mode || null,
      salary_min: payload.salary_min ?? null,
      salary_max: payload.salary_max ?? null,
      currency: payload.currency,
      date_posted: payload.date_posted || null,
      date_applied: payload.date_applied,
      source: payload.source?.trim() || null,
      priority: payload.priority,
      status: payload.status,
      next_step_date: payload.next_step_date || null,
      next_step_note: payload.next_step_note?.trim() || null,
      description_snapshot: payload.description_snapshot?.trim() || null,
      fit_score: payload.fit_score ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      status: "error",
      message: error?.message ?? "Failed to create application.",
    };
  }

  revalidateDashboardPaths(data.id);

  return {
    status: "success",
    message: "Application created.",
    data: {
      id: data.id,
    },
  };
}

export async function updateApplicationStatusAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await getActionContext(formData);
  if ("error" in context) return context.error;

  const applicationId = getString(formData, "application_id");
  const status = getString(formData, "status");

  if (!applicationId || !status) {
    return {
      status: "error",
      message: "Application and status are required.",
    };
  }

  const { error } = await context.supabase
    .from("applications")
    .update({ status: status as never })
    .eq("id", applicationId)
    .eq("user_id", context.userId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidateDashboardPaths(applicationId);
  return { status: "success", message: "Status updated." };
}

export async function setNextStepAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await getActionContext(formData);
  if ("error" in context) return context.error;

  const applicationId = getString(formData, "application_id");
  const nextStepDate = getNullableDate(formData, "next_step_date");
  const nextStepNote = getNullableString(formData, "next_step_note");

  if (!applicationId) {
    return { status: "error", message: "Application ID is required." };
  }

  const { error } = await context.supabase
    .from("applications")
    .update({
      next_step_date: nextStepDate,
      next_step_note: nextStepNote,
    })
    .eq("id", applicationId)
    .eq("user_id", context.userId);

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidateDashboardPaths(applicationId);
  return { status: "success", message: "Next step updated." };
}

export async function updateApplicationAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await getActionContext(formData);
  if ("error" in context) return context.error;

  const applicationId = getString(formData, "application_id");
  if (!applicationId) return { status: "error", message: "Application ID is required." };

  const { error } = await context.supabase
    .from("applications")
    .update({
      company_id: getNullableString(formData, "company_id"),
      company_name: getString(formData, "company_name"),
      role_title: getString(formData, "role_title"),
      job_url: getNullableString(formData, "job_url"),
      location: getNullableString(formData, "location"),
      work_mode: getNullableString(formData, "work_mode") as never,
      salary_min: getNullableInt(formData, "salary_min"),
      salary_max: getNullableInt(formData, "salary_max"),
      currency: getString(formData, "currency") || "GBP",
      date_posted: getNullableDate(formData, "date_posted"),
      date_applied: getString(formData, "date_applied"),
      source: getNullableString(formData, "source"),
      priority: getString(formData, "priority") as never,
      next_step_date: getNullableDate(formData, "next_step_date"),
      next_step_note: getNullableString(formData, "next_step_note"),
      description_snapshot: getNullableString(formData, "description_snapshot"),
      fit_score: getNullableInt(formData, "fit_score"),
    })
    .eq("id", applicationId)
    .eq("user_id", context.userId);

  if (error) return { status: "error", message: error.message };
  revalidateDashboardPaths(applicationId);
  return { status: "success", message: "Application updated." };
}

export async function deleteApplicationAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await getActionContext(formData);
  if ("error" in context) return context.error;

  const applicationId = getString(formData, "application_id");
  if (!applicationId) return { status: "error", message: "Application ID is required." };

  const { error } = await context.supabase
    .from("applications")
    .delete()
    .eq("id", applicationId)
    .eq("user_id", context.userId);

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidateDashboardPaths();
  return { status: "success", message: "Application deleted." };
}

export async function duplicateApplicationAction(_: ActionState, formData: FormData): Promise<ActionState<{ id: string }>> {
  const context = await getActionContext(formData);
  if ("error" in context) return context.error;

  const applicationId = getString(formData, "application_id");
  if (!applicationId) return { status: "error", message: "Application ID is required." };

  const { data: source, error: sourceError } = await context.supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .eq("user_id", context.userId)
    .single();

  if (sourceError || !source) {
    return { status: "error", message: sourceError?.message ?? "Application not found." };
  }

  const { data, error } = await context.supabase
    .from("applications")
    .insert({
      user_id: context.userId,
      company_id: source.company_id,
      company_name: source.company_name,
      role_title: source.role_title,
      job_url: source.job_url,
      location: source.location,
      work_mode: source.work_mode,
      salary_min: source.salary_min,
      salary_max: source.salary_max,
      currency: source.currency,
      date_posted: source.date_posted,
      date_applied: new Date().toISOString().slice(0, 10),
      source: source.source,
      priority: source.priority,
      status: "draft",
      next_step_date: null,
      next_step_note: null,
      description_snapshot: source.description_snapshot,
      fit_score: source.fit_score,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: error?.message ?? "Could not duplicate application." };
  }

  revalidateDashboardPaths(data.id);
  return {
    status: "success",
    message: "Application duplicated as draft.",
    data: { id: data.id },
  };
}

export async function archiveApplicationAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await getActionContext(formData);
  if ("error" in context) return context.error;

  const applicationId = getString(formData, "application_id");
  if (!applicationId) return { status: "error", message: "Application ID is required." };

  const { error } = await context.supabase
    .from("applications")
    .update({ status: "withdrawn" })
    .eq("id", applicationId)
    .eq("user_id", context.userId);

  if (error) return { status: "error", message: error.message };

  revalidateDashboardPaths(applicationId);
  return { status: "success", message: "Application archived (withdrawn)." };
}

export async function bulkUpdateApplicationsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await getActionContext(formData);
  if ("error" in context) return context.error;

  const ids = getString(formData, "application_ids")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const status = getString(formData, "status");

  if (!ids.length || !status) {
    return {
      status: "error",
      message: "Select at least one application and a status.",
    };
  }

  const { error } = await context.supabase
    .from("applications")
    .update({ status: status as never })
    .in("id", ids)
    .eq("user_id", context.userId);

  if (error) return { status: "error", message: error.message };

  revalidateDashboardPaths();
  return { status: "success", message: `${ids.length} application(s) updated.` };
}
