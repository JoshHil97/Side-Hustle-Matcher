import { exampleUserAnswers } from "@/data/exampleUser";
import { roleFamilyById } from "@/data/roleFamilies";
import { sideHustles } from "@/data/sideHustles";
import {
  buildConstraintRationale,
  buildPenaltyReasons,
  buildWhyItFits,
  startupDifficulty,
} from "@/lib/recommendation-explanations";
import type {
  GoalPreference,
  NormalizedUserProfile,
  RecommendationBundle,
  RecommendationResult,
  RoleFamilyId,
  ScoreBreakdown,
  SideHustle,
  SkillTag,
  StartupCostBand,
  TimeToFirstIncome,
  QuizAnswers,
} from "@/lib/types";

const TASK_TO_SKILLS: Record<string, SkillTag[]> = {
  client_communication: ["communication", "stakeholder_management", "relationship_building"],
  calendar_scheduling: ["scheduling", "organisation", "time_management"],
  docs_sop: ["documentation", "admin_systems", "process_improvement"],
  research_synthesis: ["research", "analytical_thinking", "writing"],
  content_creation: ["writing", "content_strategy", "creativity"],
  editing_quality: ["editing", "quality_assurance", "documentation"],
  ticket_troubleshooting: ["troubleshooting", "customer_support", "problem_solving"],
  data_reporting: ["data_analysis", "dashboarding", "presentation"],
  spreadsheet_work: ["spreadsheet_management", "analytical_thinking", "organisation"],
  crm_pipeline: ["crm_usage", "lead_generation", "sales_outreach"],
  project_delivery: ["project_coordination", "stakeholder_management", "organisation"],
  process_design: ["process_improvement", "operations", "analytical_thinking"],
  bookkeeping_tasks: ["bookkeeping_basics", "compliance_mindset", "documentation"],
  design_assets: ["design", "creativity", "communication"],
  video_post: ["video_editing", "editing", "content_strategy"],
  coding_building: ["coding", "web_development", "problem_solving"],
  automation_workflows: ["automation", "process_improvement", "operations"],
  training_teaching: ["teaching", "coaching", "presentation"],
  sales_outreach: ["sales_outreach", "persuasion", "relationship_building"],
  vendor_coordination: ["vendor_management", "project_coordination", "operations"],
};

const TOOL_TO_SKILLS: Record<string, SkillTag[]> = {
  google_workspace: ["admin_systems", "documentation", "organisation"],
  spreadsheets: ["spreadsheet_management", "data_analysis", "analytical_thinking"],
  crm_tools: ["crm_usage", "sales_outreach", "relationship_building"],
  ticketing_tools: ["customer_support", "quality_assurance", "documentation"],
  pm_tools: ["project_coordination", "organisation", "stakeholder_management"],
  bi_tools: ["dashboarding", "data_analysis", "presentation"],
  accounting_tools: ["bookkeeping_basics", "compliance_mindset", "spreadsheet_management"],
  design_tools: ["design", "creativity", "editing"],
  video_tools: ["video_editing", "editing", "content_strategy"],
  cms_tools: ["web_development", "content_strategy", "digital_marketing"],
  dev_tools: ["coding", "web_development", "troubleshooting"],
  automation_tools: ["automation", "process_improvement", "operations"],
  ads_tools: ["digital_marketing", "data_analysis", "persuasion"],
  email_marketing: ["digital_marketing", "writing", "content_strategy"],
  lms_tools: ["teaching", "coaching", "documentation"],
};

const OUTPUT_TO_SKILLS: Record<string, SkillTag[]> = {
  managed_inbox_calendar: ["admin_systems", "scheduling", "organisation"],
  knowledge_base: ["documentation", "customer_support", "quality_assurance"],
  sales_sequences: ["sales_outreach", "persuasion", "crm_usage"],
  campaign_assets: ["digital_marketing", "content_strategy", "editing"],
  financial_records: ["bookkeeping_basics", "spreadsheet_management", "compliance_mindset"],
  ops_playbooks: ["operations", "process_improvement", "documentation"],
  project_launches: ["project_coordination", "stakeholder_management", "organisation"],
  websites_shipped: ["web_development", "coding", "problem_solving"],
  dashboards_built: ["dashboarding", "data_analysis", "presentation"],
  it_setups: ["troubleshooting", "operations", "documentation"],
  brand_design: ["design", "creativity", "communication"],
  video_content: ["video_editing", "editing", "content_strategy"],
  training_curriculum: ["teaching", "coaching", "presentation"],
  client_portfolio: ["communication", "persuasion", "relationship_building"],
};

const COST_RANK: Record<StartupCostBand, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const GOAL_SCALABILITY_PREF: Record<GoalPreference, number> = {
  fast_cash: 0.7,
  predictable_income: 0.85,
  portfolio_building: 0.75,
  scalable_business: 1,
};

const GOAL_SPEED_PREF: Record<GoalPreference, number> = {
  fast_cash: 1,
  predictable_income: 0.85,
  portfolio_building: 0.65,
  scalable_business: 0.5,
};

const SCALE_TO_SCORE = {
  low: 45,
  medium: 70,
  high: 90,
};

const TIME_TO_CASH_SCORE: Record<TimeToFirstIncome, number> = {
  fast: 90,
  moderate: 65,
  slow: 38,
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function toArray(value: string[] | string | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function dedupe<T>(items: T[]) {
  return Array.from(new Set(items));
}

function roleFamilyFromAnswers(answers: QuizAnswers): RoleFamilyId {
  const role = answers.roleFamily;
  if (!role || Array.isArray(role) || !roleFamilyById[role]) {
    return "admin_office_support";
  }

  return role as RoleFamilyId;
}

function inferSkillMaturity(answers: QuizAnswers, outputCount: number): NormalizedUserProfile["skillMaturity"] {
  const raw = answers.experienceLevel;

  if (typeof raw === "string" && (raw === "foundation" || raw === "applied" || raw === "advanced")) {
    return raw;
  }

  if (outputCount >= 4) return "advanced";
  if (outputCount >= 2) return "applied";
  return "foundation";
}

export function normalizeAnswers(answers: QuizAnswers): NormalizedUserProfile {
  const roleFamily = roleFamilyFromAnswers(answers);
  const roleDefaults = roleFamilyById[roleFamily].defaultSkillTags;
  const taskSignatures = toArray(answers.weeklyTasks);
  const tools = toArray(answers.toolsUsed);
  const outputs = toArray(answers.outputsOwned);

  const inferredSkills = dedupe(
    [
      ...roleDefaults,
      ...taskSignatures.flatMap((task) => TASK_TO_SKILLS[task] ?? []),
      ...tools.flatMap((tool) => TOOL_TO_SKILLS[tool] ?? []),
      ...outputs.flatMap((output) => OUTPUT_TO_SKILLS[output] ?? []),
    ] as SkillTag[],
  );

  return {
    roleFamily,
    industry: (typeof answers.industry === "string" ? answers.industry : "other") as NormalizedUserProfile["industry"],
    taskSignatures,
    tools,
    outputs,
    skillTags: inferredSkills,
    skillMaturity: inferSkillMaturity(answers, outputs.length),
    constraints: {
      maxWeeklyHours: Number(answers.hoursPerWeek ?? "3"),
      callsAvailable: (typeof answers.callsAvailable === "string" ? answers.callsAvailable : "limited") as NormalizedUserProfile["constraints"]["callsAvailable"],
      startupBudget: (typeof answers.startupBudget === "string" ? answers.startupBudget : "low") as StartupCostBand,
      salesComfort: (typeof answers.salesComfort === "string" ? answers.salesComfort : "medium") as NormalizedUserProfile["constraints"]["salesComfort"],
      onlinePreference: (typeof answers.onlinePreference === "string"
        ? answers.onlinePreference
        : "either") as NormalizedUserProfile["constraints"]["onlinePreference"],
      regulatoryTolerance: (typeof answers.regulatoryTolerance === "string"
        ? answers.regulatoryTolerance
        : "low") as NormalizedUserProfile["constraints"]["regulatoryTolerance"],
      employerConflict: (typeof answers.employerConflict === "string"
        ? answers.employerConflict
        : "unsure") as NormalizedUserProfile["constraints"]["employerConflict"],
    },
    preferenceStyle: {
      workStyle: (typeof answers.workStyle === "string" ? answers.workStyle : "balanced") as NormalizedUserProfile["preferenceStyle"]["workStyle"],
      goal: (typeof answers.goal === "string" ? answers.goal : "predictable_income") as GoalPreference,
    },
  };
}

function hardConstraintFailures(profile: NormalizedUserProfile, hustle: SideHustle): string[] {
  const failures: string[] = [];

  if (COST_RANK[profile.constraints.startupBudget] < COST_RANK[hustle.startupCostBand]) {
    failures.push("Startup cost exceeds your stated budget.");
  }

  if (profile.constraints.maxWeeklyHours < hustle.weeklyHoursMin) {
    failures.push("Weekly time available is below this hustle's minimum requirement.");
  }

  if (profile.constraints.callsAvailable === "no" && hustle.callIntensity === "high") {
    failures.push("This option is call-heavy and conflicts with your async-only preference.");
  }

  if (profile.constraints.onlinePreference === "online_only" && hustle.onlineOffline === "offline") {
    failures.push("This option is offline while you asked for online-only work.");
  }

  if (profile.constraints.onlinePreference === "offline_only" && hustle.onlineOffline === "online") {
    failures.push("This option is online while you asked for offline-only work.");
  }

  if (profile.constraints.regulatoryTolerance === "low" && hustle.regulatoryFriction === "high") {
    failures.push("Regulatory requirements are higher than your tolerance.");
  }

  return failures;
}

function scoreSkillMatch(profile: NormalizedUserProfile, hustle: SideHustle) {
  const matchedRequired = hustle.requiredSkills.filter((skill) => profile.skillTags.includes(skill));
  const matchedPreferred = hustle.preferredSkills.filter((skill) => profile.skillTags.includes(skill));

  const requiredRatio = hustle.requiredSkills.length > 0 ? matchedRequired.length / hustle.requiredSkills.length : 0;
  const preferredRatio = hustle.preferredSkills.length > 0 ? matchedPreferred.length / hustle.preferredSkills.length : 0;

  let score = requiredRatio * 70 + preferredRatio * 20;

  if (hustle.roleAffinity.includes(profile.roleFamily)) {
    score += 10;
  }

  if (profile.skillMaturity === "advanced" && hustle.beginnerFriendly <= 6) {
    score += 4;
  }

  if (profile.skillMaturity === "foundation" && hustle.beginnerFriendly <= 5) {
    score -= 10;
  }

  return {
    score: clamp(score),
    matchedSkills: dedupe([...matchedRequired, ...matchedPreferred]),
  };
}

function scorePreferenceFit(profile: NormalizedUserProfile, hustle: SideHustle) {
  let score = 45;

  const { workStyle, goal } = profile.preferenceStyle;

  if (workStyle === "solo_async") {
    if (hustle.callIntensity === "low") score += 20;
    if (hustle.salesIntensity === "low") score += 10;
  }

  if (workStyle === "people_heavy") {
    if (hustle.callIntensity === "high") score += 20;
    if (hustle.salesIntensity !== "low") score += 8;
  }

  if (workStyle === "balanced") {
    if (hustle.callIntensity === "medium") score += 14;
    if (hustle.salesIntensity === "medium") score += 8;
  }

  if (goal === "fast_cash" && hustle.timeToFirstIncome === "fast") score += 18;
  if (goal === "predictable_income" && hustle.weeklyHoursMax <= 16) score += 12;
  if (goal === "portfolio_building" && hustle.scalability !== "low") score += 12;
  if (goal === "scalable_business" && hustle.scalability === "high") score += 18;

  return clamp(score);
}

function scoreConstraintFit(profile: NormalizedUserProfile, hustle: SideHustle) {
  let score = 95;

  if (profile.constraints.maxWeeklyHours < hustle.weeklyHoursMin + 2) score -= 12;
  if (profile.constraints.callsAvailable === "limited" && hustle.callIntensity === "high") score -= 10;
  if (profile.constraints.salesComfort === "low" && hustle.salesIntensity === "high") score -= 16;
  if (profile.constraints.salesComfort === "medium" && hustle.salesIntensity === "high") score -= 8;
  if (profile.constraints.regulatoryTolerance === "medium" && hustle.regulatoryFriction === "high") score -= 12;
  if (profile.constraints.employerConflict === "avoid_same_industry" && hustle.sameIndustryRisk === "high") score -= 14;
  if (profile.constraints.employerConflict === "unsure" && hustle.sameIndustryRisk !== "low") score -= 8;

  return clamp(score);
}

function frictionPenalty(profile: NormalizedUserProfile, hustle: SideHustle) {
  let penalty = 0;
  const reasons: string[] = [];

  if (COST_RANK[profile.constraints.startupBudget] < COST_RANK[hustle.startupCostBand]) {
    penalty += 18;
    reasons.push("Cost mismatch: startup cost is above your budget band.");
  }

  if (profile.constraints.maxWeeklyHours < hustle.weeklyHoursMin) {
    penalty += 18;
    reasons.push("Schedule mismatch: minimum weekly time is above your available hours.");
  }

  if (profile.constraints.regulatoryTolerance === "low" && hustle.regulatoryFriction === "high") {
    penalty += 18;
    reasons.push("Regulation mismatch: this option needs higher compliance tolerance.");
  }

  if (profile.constraints.salesComfort === "low" && hustle.salesIntensity === "high") {
    penalty += 12;
    reasons.push("Sales mismatch: this option needs active pitching.");
  }

  if (profile.constraints.callsAvailable === "no" && hustle.callIntensity === "high") {
    penalty += 12;
    reasons.push("Call mismatch: this option depends heavily on calls.");
  }

  if (profile.constraints.onlinePreference === "online_only" && hustle.onlineOffline === "offline") {
    penalty += 12;
    reasons.push("Mode mismatch: this is mainly offline work.");
  }

  if (profile.constraints.onlinePreference === "offline_only" && hustle.onlineOffline === "online") {
    penalty += 12;
    reasons.push("Mode mismatch: this is mainly online work.");
  }

  if (profile.constraints.employerConflict === "avoid_same_industry" && hustle.sameIndustryRisk === "high") {
    penalty += 10;
    reasons.push("Employer conflict risk: likely overlap with your current industry.");
  }

  return { penalty, reasons };
}

function computeBreakdown(profile: NormalizedUserProfile, hustle: SideHustle): {
  breakdown: ScoreBreakdown;
  matchedSkills: SkillTag[];
  totalScore: number;
  penalties: string[];
} {
  const skills = scoreSkillMatch(profile, hustle);
  const preferenceFit = scorePreferenceFit(profile, hustle);
  const constraintFit = scoreConstraintFit(profile, hustle);
  const scalabilityFit = SCALE_TO_SCORE[hustle.scalability] * GOAL_SCALABILITY_PREF[profile.preferenceStyle.goal];
  const speedToCashFit = TIME_TO_CASH_SCORE[hustle.timeToFirstIncome] * GOAL_SPEED_PREF[profile.preferenceStyle.goal];

  const friction = frictionPenalty(profile, hustle);

  // Weighted sum intentionally separated to keep scoring easy to tune later.
  const weightedBase =
    skills.score * 0.4 +
    preferenceFit * 0.2 +
    constraintFit * 0.22 +
    scalabilityFit * 0.1 +
    speedToCashFit * 0.08;

  // Friction penalties subtract from the weighted base to suppress impractical options.
  const totalScore = clamp(Math.round(weightedBase - friction.penalty));

  return {
    breakdown: {
      skillMatch: Math.round(skills.score),
      preferenceFit: Math.round(preferenceFit),
      constraintFit: Math.round(constraintFit),
      scalabilityFit: Math.round(scalabilityFit),
      speedToCashFit: Math.round(speedToCashFit),
      frictionPenalty: friction.penalty,
    },
    matchedSkills: skills.matchedSkills,
    totalScore,
    penalties: friction.reasons,
  };
}

function fitLabel(score: number): RecommendationResult["fitLabel"] {
  if (score >= 78) return "High Fit";
  if (score >= 60) return "Solid Fit";
  return "Stretch";
}

function evaluateHustle(profile: NormalizedUserProfile, hustle: SideHustle): RecommendationResult {
  const { breakdown, matchedSkills, penalties, totalScore } = computeBreakdown(profile, hustle);

  return {
    sideHustle: hustle,
    fitLabel: fitLabel(totalScore),
    totalScore,
    breakdown,
    matchedSkills,
    whyItFits: buildWhyItFits(profile, hustle, matchedSkills),
    constraintRationale: buildConstraintRationale(profile, hustle),
    penaltyReasons: buildPenaltyReasons(penalties),
    startupDifficulty: startupDifficulty(hustle),
  };
}

export function getRecommendations(answers: QuizAnswers): RecommendationBundle {
  const normalized = normalizeAnswers(answers);

  const evaluated = sideHustles.map((hustle) => evaluateHustle(normalized, hustle));
  const eligible = evaluated
    .filter((result) => hardConstraintFailures(normalized, result.sideHustle).length === 0)
    .sort((a, b) => b.totalScore - a.totalScore);

  const ineligible = evaluated
    .filter((result) => hardConstraintFailures(normalized, result.sideHustle).length > 0)
    .sort((a, b) => b.totalScore - a.totalScore);

  const topMatches = eligible.slice(0, 3);
  const alternatives = eligible.slice(3, 5);

  // Poor fit is intentionally selected from ineligible options so the user sees what to avoid.
  const poorFit = ineligible[0] ?? null;

  return {
    normalized,
    topMatches,
    alternatives,
    poorFit,
    allEvaluated: [...eligible, ...ineligible],
  };
}

export function scoreExampleScenario() {
  const recommendations = getRecommendations(exampleUserAnswers);

  return {
    answers: exampleUserAnswers,
    normalized: recommendations.normalized,
    top5: recommendations.allEvaluated.slice(0, 5).map((result) => ({
      sideHustle: result.sideHustle.name,
      score: result.totalScore,
      fitLabel: result.fitLabel,
      breakdown: result.breakdown,
    })),
  };
}
