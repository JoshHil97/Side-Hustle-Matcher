"use server";

import { companySchema } from "@/lib/validators/company";
import { companyResearchToNotes } from "@/lib/utils";
import { getActionContext, getString, revalidateDashboardPaths, zodErrorToFieldErrors } from "@/server/actions/helpers";
import type { ActionState } from "@/server/actions/types";

export async function createCompanyAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await getActionContext(formData);
  if ("error" in context) return context.error;

  const parsed = companySchema.safeParse({
    name: getString(formData, "name"),
    website_url: getString(formData, "website_url"),
    location: getString(formData, "location"),
    industry: getString(formData, "industry"),
    general: getString(formData, "general"),
    values: getString(formData, "values"),
    interview_process: getString(formData, "interview_process"),
    salary_notes: getString(formData, "salary_notes"),
    tech_stack_notes: getString(formData, "tech_stack_notes"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix company fields.",
      errors: zodErrorToFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  const notes = companyResearchToNotes({
    general: data.general,
    values: data.values,
    interview_process: data.interview_process,
    salary_notes: data.salary_notes,
    tech_stack_notes: data.tech_stack_notes,
  });

  const { error } = await context.supabase.from("companies").insert({
    user_id: context.userId,
    name: data.name,
    website_url: data.website_url || null,
    location: data.location?.trim() || null,
    industry: data.industry?.trim() || null,
    notes,
  });

  if (error) return { status: "error", message: error.message };

  revalidateDashboardPaths();
  return { status: "success", message: "Company saved." };
}

export async function updateCompanyAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await getActionContext(formData);
  if ("error" in context) return context.error;

  const companyId = getString(formData, "company_id");
  if (!companyId) return { status: "error", message: "Company ID is required." };

  const parsed = companySchema.safeParse({
    name: getString(formData, "name"),
    website_url: getString(formData, "website_url"),
    location: getString(formData, "location"),
    industry: getString(formData, "industry"),
    general: getString(formData, "general"),
    values: getString(formData, "values"),
    interview_process: getString(formData, "interview_process"),
    salary_notes: getString(formData, "salary_notes"),
    tech_stack_notes: getString(formData, "tech_stack_notes"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix company fields.",
      errors: zodErrorToFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  const notes = companyResearchToNotes({
    general: data.general,
    values: data.values,
    interview_process: data.interview_process,
    salary_notes: data.salary_notes,
    tech_stack_notes: data.tech_stack_notes,
  });

  const { error } = await context.supabase
    .from("companies")
    .update({
      name: data.name,
      website_url: data.website_url || null,
      location: data.location?.trim() || null,
      industry: data.industry?.trim() || null,
      notes,
    })
    .eq("id", companyId)
    .eq("user_id", context.userId);

  if (error) return { status: "error", message: error.message };

  revalidateDashboardPaths();
  return { status: "success", message: "Company updated." };
}
