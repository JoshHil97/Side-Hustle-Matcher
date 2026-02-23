import { z } from "zod";

export const templateSchema = z.object({
  title: z.string().trim().min(1, "Template title is required"),
  type: z
    .enum(["cover_letter_block", "interview_answer", "follow_up_email", "cv_bullet", "other"])
    .default("other"),
  tags: z.string().optional(),
  content: z.string().trim().min(1, "Template content is required"),
});

export type TemplateInput = z.infer<typeof templateSchema>;
