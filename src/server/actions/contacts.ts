"use server";

import { contactSchema } from "@/lib/validators/contact";
import { getActionContext, getString, revalidateDashboardPaths, zodErrorToFieldErrors } from "@/server/actions/helpers";
import type { ActionState } from "@/server/actions/types";

export async function createContactAction(_: ActionState, formData: FormData): Promise<ActionState<{ id: string }>> {
  const context = await getActionContext(formData);
  if ("error" in context) return context.error;

  const parsed = contactSchema.safeParse({
    company_id: getString(formData, "company_id"),
    name: getString(formData, "name"),
    email: getString(formData, "email"),
    phone: getString(formData, "phone"),
    role: getString(formData, "role"),
    linkedin_url: getString(formData, "linkedin_url"),
    notes: getString(formData, "notes"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix contact fields.",
      errors: zodErrorToFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;

  const { data: inserted, error } = await context.supabase
    .from("contacts")
    .insert({
      user_id: context.userId,
      company_id: data.company_id || null,
      name: data.name,
      email: data.email || null,
      phone: data.phone?.trim() || null,
      role: data.role?.trim() || null,
      linkedin_url: data.linkedin_url || null,
      notes: data.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !inserted) return { status: "error", message: error?.message ?? "Could not create contact." };

  revalidateDashboardPaths();
  return { status: "success", message: "Contact created.", data: { id: inserted.id } };
}

export async function updateContactAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await getActionContext(formData);
  if ("error" in context) return context.error;

  const contactId = getString(formData, "contact_id");
  if (!contactId) return { status: "error", message: "Contact ID is required." };

  const parsed = contactSchema.safeParse({
    company_id: getString(formData, "company_id"),
    name: getString(formData, "name"),
    email: getString(formData, "email"),
    phone: getString(formData, "phone"),
    role: getString(formData, "role"),
    linkedin_url: getString(formData, "linkedin_url"),
    notes: getString(formData, "notes"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix contact fields.",
      errors: zodErrorToFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;

  const { error } = await context.supabase
    .from("contacts")
    .update({
      company_id: data.company_id || null,
      name: data.name,
      email: data.email || null,
      phone: data.phone?.trim() || null,
      role: data.role?.trim() || null,
      linkedin_url: data.linkedin_url || null,
      notes: data.notes?.trim() || null,
    })
    .eq("id", contactId)
    .eq("user_id", context.userId);

  if (error) return { status: "error", message: error.message };

  revalidateDashboardPaths();
  return { status: "success", message: "Contact updated." };
}

export async function linkContactToApplicationAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await getActionContext(formData);
  if ("error" in context) return context.error;

  const applicationId = getString(formData, "application_id");
  const contactId = getString(formData, "contact_id");
  const relationship = getString(formData, "relationship");

  if (!applicationId || !contactId) {
    return { status: "error", message: "Application and contact are required." };
  }

  const { error } = await context.supabase.from("application_contacts").insert({
    user_id: context.userId,
    application_id: applicationId,
    contact_id: contactId,
    relationship: relationship || null,
  });

  if (error) return { status: "error", message: error.message };

  revalidateDashboardPaths(applicationId);
  return { status: "success", message: "Contact linked." };
}

export async function createAndLinkContactAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await getActionContext(formData);
  if ("error" in context) return context.error;

  const applicationId = getString(formData, "application_id");
  if (!applicationId) {
    return { status: "error", message: "Application ID is required." };
  }

  const parsed = contactSchema.safeParse({
    company_id: getString(formData, "company_id"),
    name: getString(formData, "name"),
    email: getString(formData, "email"),
    phone: getString(formData, "phone"),
    role: getString(formData, "role"),
    linkedin_url: getString(formData, "linkedin_url"),
    notes: getString(formData, "notes"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix contact fields.",
      errors: zodErrorToFieldErrors(parsed.error),
    };
  }

  const relationship = getString(formData, "relationship");
  const data = parsed.data;

  const { data: contact, error: insertContactError } = await context.supabase
    .from("contacts")
    .insert({
      user_id: context.userId,
      company_id: data.company_id || null,
      name: data.name,
      email: data.email || null,
      phone: data.phone?.trim() || null,
      role: data.role?.trim() || null,
      linkedin_url: data.linkedin_url || null,
      notes: data.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (insertContactError || !contact) {
    return {
      status: "error",
      message: insertContactError?.message ?? "Could not create contact.",
    };
  }

  const { error: linkError } = await context.supabase.from("application_contacts").insert({
    user_id: context.userId,
    application_id: applicationId,
    contact_id: contact.id,
    relationship: relationship || null,
  });

  if (linkError) {
    return {
      status: "error",
      message: linkError.message,
    };
  }

  revalidateDashboardPaths(applicationId);
  return { status: "success", message: "Contact created and linked." };
}
