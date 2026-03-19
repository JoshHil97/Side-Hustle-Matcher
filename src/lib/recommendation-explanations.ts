import type {
  CallIntensity,
  CommercialAngle,
  NormalizedUserProfile,
  RecommendationEvidence,
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

function formatBand(value: StartupCostBand | RegulatoryFriction | CallIntensity | SalesIntensity) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function roundToNearest25(value: number) {
  return Math.round(value / 25) * 25;
}

function estimateStarterPrice(profile: NormalizedUserProfile, hustle: SideHustle) {
  const hourlyByMaturity = {
    foundation: 30,
    applied: 45,
    advanced: 65,
  } as const;

  const baseHourly = hourlyByMaturity[profile.skillMaturity];
  const complexityMultiplier = clamp((12 - hustle.beginnerFriendly) * 0.06 + 0.9, 0.85, 1.4);
  const workHours = clamp(hustle.weeklyHoursMin + (hustle.callIntensity === "high" ? 2 : 1), 3, 12);

  let min = roundToNearest25(baseHourly * complexityMultiplier * workHours * 0.8);
  let max = roundToNearest25(baseHourly * complexityMultiplier * workHours * 1.5);

  if (hustle.startupCostBand === "medium") {
    min += 50;
    max += 100;
  }

  if (hustle.startupCostBand === "high") {
    min += 100;
    max += 200;
  }

  if (profile.preferenceStyle.goal === "predictable_income") {
    return `£${min}-£${max} pilot, then monthly retainer`;
  }

  return `£${min}-£${max} for a first scoped project`;
}

function industryBuyerHint(industry: string) {
  const hints: Record<string, string> = {
    technology: "founders, SaaS teams, and online service businesses",
    finance: "consultancies, advisors, and growing local firms",
    healthcare: "clinics, health practitioners, and care providers",
    education: "coaches, tutors, and learning businesses",
    retail_hospitality: "local owner-led retail and hospitality businesses",
    professional_services: "agencies, consultants, and small service firms",
    manufacturing_logistics: "operations-led SMEs and logistics providers",
    government_public_sector: "mission-led organisations and community groups",
    media_creative: "creators, studios, and creative brands",
    other: "small businesses with operational bottlenecks",
  };

  return hints[industry] ?? hints.other;
}

function topEvidencePhrase(evidence: RecommendationEvidence) {
  const all = [...evidence.tasks, ...evidence.outputs, ...evidence.tools].slice(0, 2);
  if (all.length === 0) return "the workflows you already manage";
  if (all.length === 1) return all[0].toLowerCase();
  return `${all[0].toLowerCase()} and ${all[1].toLowerCase()}`;
}

export function formatSkillTag(skill: SkillTag) {
  return titleCase(skill);
}

export function buildPersonalizedSummary(
  profile: NormalizedUserProfile,
  hustle: SideHustle,
  evidence: RecommendationEvidence,
): string {
  const goalText = profile.preferenceStyle.goal.replaceAll("_", " ");
  const evidencePhrase = topEvidencePhrase(evidence);

  return `${hustle.name} fits because your ${profile.roleFamilyLabel.toLowerCase()} background already covers ${evidencePhrase}, and it supports your ${goalText} goal with realistic weekly effort.`;
}

export function buildCommercialAngle(
  profile: NormalizedUserProfile,
  hustle: SideHustle,
  evidence: RecommendationEvidence,
): CommercialAngle {
  const idealBuyer = industryBuyerHint(profile.industry);
  const proofSignal = topEvidencePhrase(evidence);
  const starterPrice = estimateStarterPrice(profile, hustle);

  return {
    idealBuyer: `Best first buyer: ${idealBuyer}.`,
    offerPositioning: `Position this as a fixed-scope outcome built on your experience with ${proofSignal}.`,
    suggestedStarterPrice: starterPrice,
    outreachStarter: `Hi - I help ${idealBuyer} improve ${proofSignal}. I can deliver a fixed-scope ${hustle.name.toLowerCase()} sprint in 7 days. Open to a quick fit check?`,
    conversionCTA: "Offer a low-risk pilot with a clear deliverable, deadline, and one measurable outcome.",
  };
}

export function buildWhyItFits(
  profile: NormalizedUserProfile,
  hustle: SideHustle,
  matchedSkills: SkillTag[],
  evidence: RecommendationEvidence,
  commercialFit: number,
  confidenceFit: number,
): string[] {
  const topSkills = matchedSkills.slice(0, 3).map(formatSkillTag);
  const reasons: string[] = [];

  if (evidence.tasks.length > 0) {
    reasons.push(`You selected weekly tasks like ${evidence.tasks.slice(0, 2).join(" and ")}, which map directly to this hustle.`);
  }

  if (evidence.tools.length > 0) {
    reasons.push(`Your tool confidence (${evidence.tools.slice(0, 2).join(", ")}) reduces setup friction and speeds delivery.`);
  }

  if (evidence.outputs.length > 0) {
    reasons.push(`You already produced outputs such as ${evidence.outputs.slice(0, 2).join(" and ")}, giving you proof to sell from day one.`);
  }

  if (topSkills.length > 0) {
    reasons.push(`Core matching skills: ${topSkills.join(", ")}.`);
  }

  reasons.push(
    `Commercial fit ${commercialFit}/100 and execution confidence ${confidenceFit}/100 based on your time, budget, and work-style constraints.`,
  );

  reasons.push(
    `Friction profile: ${formatBand(hustle.startupCostBand)} startup cost, ${formatBand(hustle.regulatoryFriction)} regulation, ${formatBand(
      hustle.salesIntensity,
    )} sales intensity.`,
  );

  return reasons.slice(0, 5);
}

export function buildConstraintRationale(profile: NormalizedUserProfile, hustle: SideHustle): string[] {
  const lines: string[] = [];

  lines.push(`Budget fit: your budget is ${profile.constraints.startupBudget}, this option is ${hustle.startupCostBand}.`);
  lines.push(`Time fit: you can commit ${profile.constraints.maxWeeklyHours} hrs/week, this usually needs ${hustle.weeklyHoursMin}-${hustle.weeklyHoursMax}.`);

  if (profile.constraints.callsAvailable === "no") {
    lines.push(`Calls fit: you prefer no calls, and this hustle has ${hustle.callIntensity} call intensity.`);
  } else if (profile.constraints.callsAvailable === "limited") {
    lines.push(`Calls fit: you allow limited calls, and this hustle is ${hustle.callIntensity} call intensity.`);
  } else {
    lines.push(`Calls fit: you are call-available, so ${hustle.callIntensity} call intensity is manageable.`);
  }

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
