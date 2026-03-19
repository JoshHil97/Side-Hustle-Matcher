import type {
  CallIntensity,
  NormalizedUserProfile,
  RecommendationResult,
  RegulatoryFriction,
  SalesIntensity,
  SideHustle,
  SkillTag,
  StartupCostBand,
} from "@/lib/types";

function titleCase(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatSkillTag(skill: SkillTag) {
  return titleCase(skill);
}

function formatBand(value: StartupCostBand | RegulatoryFriction | CallIntensity | SalesIntensity) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function buildWhyItFits(
  profile: NormalizedUserProfile,
  hustle: SideHustle,
  matchedSkills: SkillTag[],
): string[] {
  const topSkills = matchedSkills.slice(0, 3).map(formatSkillTag);
  const reasons: string[] = [];

  if (topSkills.length > 0) {
    reasons.push(`Your strongest match signals are ${topSkills.join(", ")}.`);
  }

  if (hustle.roleAffinity.includes(profile.roleFamily)) {
    reasons.push("This aligns closely with your current role family, so you can sell existing experience credibly.");
  }

  if (profile.constraints.maxWeeklyHours >= hustle.weeklyHoursMin) {
    reasons.push(`Your available time (${profile.constraints.maxWeeklyHours} hrs/week) covers this hustle's minimum demand.`);
  }

  reasons.push(
    `Friction profile: ${formatBand(hustle.startupCostBand)} startup cost, ${formatBand(hustle.regulatoryFriction)} regulation, ${formatBand(
      hustle.salesIntensity,
    )} sales intensity.`,
  );

  return reasons.slice(0, 4);
}

export function buildConstraintRationale(profile: NormalizedUserProfile, hustle: SideHustle): string[] {
  const lines: string[] = [];

  lines.push(`Budget fit: your budget is ${profile.constraints.startupBudget}, this option is ${hustle.startupCostBand}.`);
  lines.push(`Time fit: you can commit ${profile.constraints.maxWeeklyHours} hrs/week, this usually needs ${hustle.weeklyHoursMin}-${hustle.weeklyHoursMax}.`);

  if (profile.constraints.onlinePreference === "online_only") {
    lines.push(`Delivery fit: you prefer online work and this hustle is ${hustle.onlineOffline}.`);
  } else if (profile.constraints.onlinePreference === "offline_only") {
    lines.push(`Delivery fit: you prefer offline work and this hustle is ${hustle.onlineOffline}.`);
  } else {
    lines.push(`Delivery fit: you're flexible and this hustle supports ${hustle.onlineOffline} delivery.`);
  }

  return lines;
}

export function buildPenaltyReasons(reasons: string[]): string[] {
  if (reasons.length === 0) {
    return ["No major friction penalties were triggered."];
  }

  return reasons;
}

export function startupDifficulty(hustle: SideHustle): RecommendationResult["startupDifficulty"] {
  const highSignals = [hustle.startupCostBand, hustle.regulatoryFriction].filter((signal) => signal === "high").length;

  if (highSignals >= 1) return "High";
  if (hustle.startupCostBand === "medium" || hustle.regulatoryFriction === "medium") return "Medium";
  return "Low";
}
