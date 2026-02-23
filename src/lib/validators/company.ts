import { z } from "zod";

export const companySchema = z.object({
  name: z.string().trim().min(1, "Company name is required"),
  website_url: z.string().url("Use a valid URL").optional().or(z.literal("")),
  location: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  general: z.string().optional(),
  values: z.string().optional(),
  interview_process: z.string().optional(),
  salary_notes: z.string().optional(),
  tech_stack_notes: z.string().optional(),
});

export type CompanyInput = z.infer<typeof companySchema>;
