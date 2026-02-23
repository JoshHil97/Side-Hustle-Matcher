"use server";

import { z } from "zod";
import { getActionContext, getString, revalidateDashboardPaths, zodErrorToFieldErrors } from "@/server/actions/helpers";
import type { ActionState } from "@/server/actions/types";

const documentSchema = z.object({
  application_id: z.string().uuid().optional().or(z.literal("")),
  company_id: z.string().uuid().optional().or(z.literal("")),
  category: z.enum(["cv", "cover_letter", "portfolio", "other"]).default("other"),
  version_label: z.string().optional(),
  storage_bucket: z.string().min(1).default("documents"),
});

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadDocumentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await getActionContext(formData);
  if ("error" in context) return context.error;

  const fileValue = formData.get("file");
  if (!(fileValue instanceof File)) {
    return { status: "error", message: "Choose a file before uploading." };
  }

  const parsed = documentSchema.safeParse({
    application_id: getString(formData, "application_id"),
    company_id: getString(formData, "company_id"),
    category: getString(formData, "category") || "other",
    version_label: getString(formData, "version_label"),
    storage_bucket: getString(formData, "storage_bucket") || "documents",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix document fields.",
      errors: zodErrorToFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  const safeName = sanitizeFileName(fileValue.name);
  const applicationSegment = data.application_id || "unlinked";
  const storagePath = `${context.userId}/${applicationSegment}/${Date.now()}_${safeName}`;

  const bytes = await fileValue.arrayBuffer();
  const { error: uploadError } = await context.supabase.storage
    .from(data.storage_bucket)
    .upload(storagePath, bytes, {
      cacheControl: "3600",
      contentType: fileValue.type || undefined,
      upsert: false,
    });

  if (uploadError) {
    return {
      status: "error",
      message:
        uploadError.message +
        " If this is your first upload, create the private 'documents' storage bucket in Supabase Studio.",
    };
  }

  const { error: insertError } = await context.supabase.from("documents").insert({
    user_id: context.userId,
    application_id: data.application_id || null,
    company_id: data.company_id || null,
    storage_bucket: data.storage_bucket,
    storage_path: storagePath,
    file_name: fileValue.name,
    file_type: fileValue.type || null,
    file_size: fileValue.size,
    category: data.category,
    version_label: data.version_label?.trim() || null,
  });

  if (insertError) {
    return {
      status: "error",
      message: insertError.message,
    };
  }

  revalidateDashboardPaths(data.application_id || undefined);
  return { status: "success", message: "Document uploaded." };
}

export async function deleteDocumentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await getActionContext(formData);
  if ("error" in context) return context.error;

  const documentId = getString(formData, "document_id");
  const applicationId = getString(formData, "application_id");

  if (!documentId) return { status: "error", message: "Document ID is required." };

  const { data: document, error: findError } = await context.supabase
    .from("documents")
    .select("storage_bucket,storage_path")
    .eq("id", documentId)
    .eq("user_id", context.userId)
    .single();

  if (findError || !document) {
    return { status: "error", message: findError?.message ?? "Document not found." };
  }

  const { error: storageError } = await context.supabase.storage
    .from(document.storage_bucket)
    .remove([document.storage_path]);

  if (storageError) {
    return { status: "error", message: storageError.message };
  }

  const { error: deleteError } = await context.supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .eq("user_id", context.userId);

  if (deleteError) {
    return { status: "error", message: deleteError.message };
  }

  revalidateDashboardPaths(applicationId || undefined);
  return { status: "success", message: "Document deleted." };
}
