import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionState, FieldErrors } from "@/server/actions/types";

export function zodErrorToFieldErrors(error: ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    fieldErrors[key] = fieldErrors[key] ?? [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

export async function getActionContext(formData: FormData): Promise<
  | {
      supabase: ReturnType<typeof createSupabaseServerClient>;
      userId: string;
      token: string;
    }
  | { error: ActionState<never> }
> {
  const rawToken = formData.get("access_token");
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("jobcrm_token")?.value;

  const accessToken =
    typeof rawToken === "string" && rawToken.trim().length > 0 ? rawToken.trim() : cookieToken;

  if (!accessToken) {
    return {
      error: {
        status: "error",
        message: "Your session expired. Please sign in again.",
      },
    };
  }

  const supabase = createSupabaseServerClient(accessToken);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: {
        status: "error",
        message: "You are not authenticated. Please log in and retry.",
      },
    };
  }

  return { supabase, userId: user.id, token: accessToken };
}

export function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function getNullableString(formData: FormData, key: string) {
  const value = getString(formData, key).trim();
  return value.length === 0 ? null : value;
}

export function getNullableInt(formData: FormData, key: string) {
  const value = getString(formData, key).trim();
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function getNullableDate(formData: FormData, key: string) {
  const value = getString(formData, key).trim();
  return value.length === 0 ? null : value;
}

export function revalidateDashboardPaths(applicationId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/applications");
  revalidatePath("/dashboard/companies");
  revalidatePath("/dashboard/contacts");
  revalidatePath("/dashboard/documents");
  revalidatePath("/dashboard/templates");
  revalidatePath("/dashboard/analytics");
  if (applicationId) {
    revalidatePath(`/dashboard/applications/${applicationId}`);
  }
}
