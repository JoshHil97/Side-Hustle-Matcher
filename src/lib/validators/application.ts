import { z } from "zod";

export const applicationSchema = z.object({
  company_id: z.string().uuid().optional().or(z.literal("")),
  company_name: z.string().trim().min(1, "Company name is required"),
  role_title: z.string().trim().min(1, "Role title is required"),
  job_url: z.string().url("Use a valid URL").optional().or(z.literal("")),
  location: z.string().trim().optional(),
  work_mode: z.enum(["remote", "hybrid", "onsite"]).optional().or(z.literal("")),
  salary_min: z.coerce.number().int().min(0).optional(),
  salary_max: z.coerce.number().int().min(0).optional(),
  currency: z.string().trim().min(1).default("GBP"),
  date_posted: z.string().optional(),
  date_applied: z.string().min(1, "Date applied is required"),
  source: z.string().trim().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  status: z
    .enum([
      "draft",
      "applied",
      "screening",
      "interview_1",
      "interview_2",
      "interview_3",
      "task",
      "offer",
      "rejected",
      "withdrawn",
      "accepted",
    ])
    .default("applied"),
  next_step_date: z.string().optional(),
  next_step_note: z.string().trim().optional(),
  description_snapshot: z.string().optional(),
  fit_score: z.coerce.number().int().min(0).max(100).optional(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
