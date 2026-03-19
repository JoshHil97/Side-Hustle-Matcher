export const SKILL_TAGS = [
  "communication",
  "persuasion",
  "relationship_building",
  "admin_systems",
  "scheduling",
  "documentation",
  "research",
  "writing",
  "editing",
  "customer_support",
  "teaching",
  "coaching",
  "troubleshooting",
  "data_analysis",
  "dashboarding",
  "spreadsheet_management",
  "crm_usage",
  "project_coordination",
  "process_improvement",
  "operations",
  "bookkeeping_basics",
  "design",
  "video_editing",
  "coding",
  "web_development",
  "automation",
  "vendor_management",
  "compliance_mindset",
  "organisation",
  "analytical_thinking",
  "creativity",
  "stakeholder_management",
  "quality_assurance",
  "content_strategy",
  "digital_marketing",
  "lead_generation",
  "sales_outreach",
  "presentation",
  "time_management",
  "problem_solving",
] as const;

export type SkillTag = (typeof SKILL_TAGS)[number];

export type RoleFamilyId =
  | "admin_office_support"
  | "customer_support_operations"
  | "sales_account_management"
  | "marketing"
  | "finance_bookkeeping"
  | "compliance_risk_governance"
  | "operations_supply_chain"
  | "project_management"
  | "software_engineering_webdev"
  | "data_bi_analysis"
  | "it_support_systems"
  | "design"
  | "writing_editing"
  | "education_training"
  | "healthcare_allied_health"
  | "skilled_trades_field_services"
  | "retail_hospitality_management";

export type IndustryId =
  | "technology"
  | "finance"
  | "healthcare"
  | "education"
  | "retail_hospitality"
  | "professional_services"
  | "manufacturing_logistics"
  | "government_public_sector"
  | "media_creative"
  | "other";

export type SkillMaturity = "foundation" | "applied" | "advanced";
export type StartupCostBand = "low" | "medium" | "high";
export type OnlineOffline = "online" | "offline" | "hybrid";
export type CallIntensity = "low" | "medium" | "high";
export type SalesIntensity = "low" | "medium" | "high";
export type RegulatoryFriction = "low" | "medium" | "high";
export type Scalability = "low" | "medium" | "high";
export type TimeToFirstIncome = "fast" | "moderate" | "slow";
export type GoalPreference = "fast_cash" | "predictable_income" | "portfolio_building" | "scalable_business";

export interface RoleFamily {
  id: RoleFamilyId;
  label: string;
  description: string;
  defaultSkillTags: SkillTag[];
}

export interface QuizOption {
  value: string;
  label: string;
  description?: string;
}

export interface QuizQuestion {
  id:
    | "roleFamily"
    | "industry"
    | "weeklyTasks"
    | "toolsUsed"
    | "outputsOwned"
    | "experienceLevel"
    | "workStyle"
    | "hoursPerWeek"
    | "callsAvailable"
    | "startupBudget"
    | "salesComfort"
    | "onlinePreference"
    | "regulatoryTolerance"
    | "employerConflict"
    | "goal";
  groupLabel: string;
  prompt: string;
  helperText?: string;
  type: "single" | "multi";
  options: QuizOption[];
  minSelections?: number;
  maxSelections?: number;
}

export type QuizAnswers = {
  [K in QuizQuestion["id"]]?: K extends "weeklyTasks" | "toolsUsed" | "outputsOwned" ? string[] : string;
};

export interface SideHustle {
  id: string;
  name: string;
  shortDescription: string;
  category: string;
  requiredSkills: SkillTag[];
  preferredSkills: SkillTag[];
  roleAffinity: RoleFamilyId[];
  beginnerFriendly: number;
  startupCostBand: StartupCostBand;
  weeklyHoursMin: number;
  weeklyHoursMax: number;
  onlineOffline: OnlineOffline;
  callIntensity: CallIntensity;
  salesIntensity: SalesIntensity;
  regulatoryFriction: RegulatoryFriction;
  scalability: Scalability;
  timeToFirstIncome: TimeToFirstIncome;
  reasonsToRecommend: string[];
  firstOfferExamples: string[];
  firstWeekSteps: string[];
  bestForYouIf: string[];
  watchOutFor: string[];
  sameIndustryRisk: "low" | "medium" | "high";
}

export interface UserConstraints {
  maxWeeklyHours: number;
  callsAvailable: "yes" | "no" | "limited";
  startupBudget: StartupCostBand;
  salesComfort: "low" | "medium" | "high";
  onlinePreference: "online_only" | "offline_only" | "either";
  regulatoryTolerance: RegulatoryFriction;
  employerConflict: "avoid_same_industry" | "no_restriction" | "unsure";
}

export interface PreferenceStyle {
  workStyle: "solo_async" | "balanced" | "people_heavy";
  goal: GoalPreference;
}

export interface NormalizedUserProfile {
  roleFamily: RoleFamilyId;
  roleFamilyLabel: string;
  industry: IndustryId;
  industryLabel: string;
  taskSignatures: string[];
  taskLabels: string[];
  tools: string[];
  toolLabels: string[];
  outputs: string[];
  outputLabels: string[];
  skillTags: SkillTag[];
  skillMaturity: SkillMaturity;
  constraints: UserConstraints;
  preferenceStyle: PreferenceStyle;
}

export interface ScoreBreakdown {
  skillMatch: number;
  preferenceFit: number;
  constraintFit: number;
  commercialFit: number;
  confidenceFit: number;
  scalabilityFit: number;
  speedToCashFit: number;
  frictionPenalty: number;
}

export interface RecommendationEvidence {
  tasks: string[];
  tools: string[];
  outputs: string[];
}

export interface CommercialAngle {
  idealBuyer: string;
  offerPositioning: string;
  suggestedStarterPrice: string;
  outreachStarter: string;
  conversionCTA: string;
}

export interface RecommendationResult {
  sideHustle: SideHustle;
  fitLabel: "High Fit" | "Solid Fit" | "Stretch";
  totalScore: number;
  breakdown: ScoreBreakdown;
  matchedSkills: SkillTag[];
  personalizedSummary: string;
  evidence: RecommendationEvidence;
  commercialAngle: CommercialAngle;
  whyItFits: string[];
  constraintRationale: string[];
  penaltyReasons: string[];
  confidenceScore: number;
  startupDifficulty: "Low" | "Medium" | "High";
}

export interface RecommendationBundle {
  normalized: NormalizedUserProfile;
  topMatches: RecommendationResult[];
  alternatives: RecommendationResult[];
  poorFit: RecommendationResult | null;
  allEvaluated: RecommendationResult[];
}
