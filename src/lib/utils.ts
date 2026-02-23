import { STATUS_LABELS } from "@/lib/constants";
import type { AppStatus, Priority } from "@/types/database";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(input?: string | null) {
  if (!input) return "-";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(input?: string | null) {
  if (!input) return "-";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function statusLabel(status: AppStatus) {
  return STATUS_LABELS[status] ?? status;
}

export function statusClass(status: AppStatus) {
  switch (status) {
    case "accepted":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "offer":
      return "bg-green-100 text-green-800 border-green-200";
    case "rejected":
    case "withdrawn":
      return "bg-rose-100 text-rose-800 border-rose-200";
    case "screening":
    case "interview_1":
    case "interview_2":
    case "interview_3":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "task":
      return "bg-stone-100 text-stone-800 border-stone-200";
    case "applied":
      return "bg-stone-100 text-stone-700 border-stone-200";
    case "draft":
    default:
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }
}

export function priorityClass(priority: Priority) {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800 border-red-200";
    case "medium":
      return "bg-stone-100 text-stone-800 border-stone-200";
    case "low":
    default:
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }
}

export function toSlugId(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseCsvTags(input: string) {
  return input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function daysBetween(start: string, end: string) {
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

export function toInputDate(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export function toInputDateTime(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function todayPlusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function companyResearchToNotes(fields: {
  general?: string;
  values?: string;
  interview_process?: string;
  salary_notes?: string;
  tech_stack_notes?: string;
}) {
  return JSON.stringify(
    {
      general: fields.general ?? "",
      values: fields.values ?? "",
      interview_process: fields.interview_process ?? "",
      salary_notes: fields.salary_notes ?? "",
      tech_stack_notes: fields.tech_stack_notes ?? "",
    },
    null,
    0,
  );
}

export function notesToCompanyResearch(notes?: string | null) {
  if (!notes) {
    return {
      general: "",
      values: "",
      interview_process: "",
      salary_notes: "",
      tech_stack_notes: "",
    };
  }

  try {
    const parsed = JSON.parse(notes) as Record<string, string>;
    return {
      general: parsed.general ?? "",
      values: parsed.values ?? "",
      interview_process: parsed.interview_process ?? "",
      salary_notes: parsed.salary_notes ?? "",
      tech_stack_notes: parsed.tech_stack_notes ?? "",
    };
  } catch {
    return {
      general: notes,
      values: "",
      interview_process: "",
      salary_notes: "",
      tech_stack_notes: "",
    };
  }
}
