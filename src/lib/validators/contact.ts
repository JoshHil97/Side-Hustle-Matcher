import { z } from "zod";

export const contactSchema = z.object({
  company_id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email("Use a valid email").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  role: z.string().trim().optional(),
  linkedin_url: z.string().url("Use a valid URL").optional().or(z.literal("")),
  notes: z.string().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
