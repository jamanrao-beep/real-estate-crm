export interface FunnelStageOption {
  value: string;
  label: string;
}

export const CATEGORY_OPTIONS = [
  { value: "CALL_PICKED", label: "Call Picked" },
  { value: "CALL_NOT_PICKED", label: "Call Not Picked" },
] as const;

export const STAGES_CALL_PICKED = [
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "INTERESTED", label: "Interested" },
  { value: "NOT_INTERESTED", label: "Not Interested" },
  { value: "DETAILS_SHARED", label: "Details Shared" },
  { value: "SITE_VISIT_DONE", label: "Site Visit Done" },
  { value: "OFFICE_VISIT_DONE", label: "Office Visit Done" },
  { value: "BOOKING_DONE", label: "Booking Done" },
  { value: "DEAL_CLOSED", label: "Deal Closed" },
] as const;

export const STAGES_CALL_NOT_PICKED = [
  { value: "CALLBACK", label: "Callback" },
] as const;

export const ALL_FUNNEL_STAGES = [
  ...STAGES_CALL_NOT_PICKED,
  ...STAGES_CALL_PICKED,
] as const;

/**
 * Returns strictly allowed stages for a given category.
 * If category is "CALL_NOT_PICKED", returns ONLY Callback.
 * If category is "CALL_PICKED", returns ONLY the 8 Call Picked stages.
 */
export function getStagesForCategory(
  category?: string | null,
  currentStage?: string | null
): readonly FunnelStageOption[] {
  const baseStages: FunnelStageOption[] = category === "CALL_NOT_PICKED" ? [...STAGES_CALL_NOT_PICKED] : [...STAGES_CALL_PICKED];
  if (currentStage && !baseStages.some((s) => s.value === currentStage)) {
    const found = ALL_FUNNEL_STAGES.find((s) => s.value === currentStage);
    if (found) {
      baseStages.unshift(found);
    }
  }
  return baseStages;
}

/**
 * Validates whether a stage belongs to a category.
 */
export function isStageValidForCategory(
  stage: string | null | undefined,
  category: string | null | undefined
): boolean {
  if (!stage) return true;
  if (category === "CALL_NOT_PICKED") {
    return stage === "CALLBACK" || stage === "CALL_NOT_PICKED";
  }
  return stage !== "CALLBACK" && stage !== "CALL_NOT_PICKED";
}

/**
 * Formats stage value to readable string label.
 */
export function formatStageLabel(stage?: string | null): string {
  if (!stage) return "";
  const found = ALL_FUNNEL_STAGES.find((s) => s.value === stage);
  if (found) return found.label;
  if (stage === "CALL_NOT_PICKED") return "Callback";
  if (stage === "LOST") return "Lost";
  return stage.replace(/_/g, " ");
}

/**
 * Formats category value to readable string label.
 */
export function formatCategoryLabel(cat?: string | null): string {
  if (!cat) return "";
  if (cat === "CALL_PICKED") return "Call Picked";
  if (cat === "CALL_NOT_PICKED") return "Call Not Picked";
  if (cat === "HOT") return "Call Picked";
  if (cat === "WARM") return "Call Picked";
  if (cat === "COLD") return "Call Not Picked";
  return cat.replace(/_/g, " ");
}
