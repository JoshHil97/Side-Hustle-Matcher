import type { AppStatus, DocumentCategory, NoteKind, Priority, TemplateType, WorkMode } from "@/types/database";

export const APP_STATUSES: AppStatus[] = [
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
];

export const STATUS_LABELS: Record<AppStatus, string> = {
  draft: "Draft",
  applied: "Applied",
  screening: "Screening",
  interview_1: "Interview 1",
  interview_2: "Interview 2",
  interview_3: "Interview 3",
  task: "Task",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  accepted: "Accepted",
};

export const WORK_MODES: WorkMode[] = ["remote", "hybrid", "onsite"];
export const PRIORITIES: Priority[] = ["low", "medium", "high"];
export const NOTE_KINDS: NoteKind[] = [
  "general",
  "interview_prep",
  "follow_up",
  "company_research",
];
export const DOCUMENT_CATEGORIES: DocumentCategory[] = ["cv", "cover_letter", "portfolio", "other"];
export const TEMPLATE_TYPES: TemplateType[] = [
  "cover_letter_block",
  "interview_answer",
  "follow_up_email",
  "cv_bullet",
  "other",
];

export const STATUS_PIPELINE: AppStatus[] = [
  "draft",
  "applied",
  "screening",
  "interview_1",
  "interview_2",
  "interview_3",
  "task",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
];
