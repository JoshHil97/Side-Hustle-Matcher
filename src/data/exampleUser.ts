import type { QuizAnswers } from "@/lib/types";

export const exampleUserAnswers: QuizAnswers = {
  roleFamily: "project_management",
  industry: "technology",
  weeklyTasks: [
    "project_delivery",
    "docs_sop",
    "process_design",
    "client_communication",
    "calendar_scheduling",
    "automation_workflows",
  ],
  toolsUsed: ["pm_tools", "google_workspace", "spreadsheets", "automation_tools", "crm_tools"],
  outputsOwned: ["ops_playbooks", "project_launches", "managed_inbox_calendar", "client_portfolio"],
  experienceLevel: "applied",
  workStyle: "balanced",
  hoursPerWeek: "7",
  callsAvailable: "limited",
  startupBudget: "low",
  salesComfort: "medium",
  onlinePreference: "online_only",
  regulatoryTolerance: "low",
  employerConflict: "avoid_same_industry",
  goal: "predictable_income",
};
