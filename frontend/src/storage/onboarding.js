import { ONBOARDING_STORAGE_KEY } from "../content/constants.js";
import { loadJSON, saveJSON } from "./base.js";

const DEFAULT_ONBOARDING = {
  step: 1,
  region: "",
  familySize: "1",
  hasChildren: "no",
  hasElderly: "no",
  completed: false
};

function normalizeOnboarding(parsed) {
  return {
    step: Number(parsed.step) || 1,
    region: parsed.region || "",
    familySize: parsed.familySize || "1",
    hasChildren: parsed.hasChildren || "no",
    hasElderly: parsed.hasElderly || "no",
    completed: Boolean(parsed.completed)
  };
}

export function loadOnboardingState() {
  const parsed = loadJSON(ONBOARDING_STORAGE_KEY, null);
  if (parsed === null || typeof parsed !== "object") {
    return { ...DEFAULT_ONBOARDING };
  }
  return normalizeOnboarding(parsed);
}

export function saveOnboardingState(onboardingState) {
  saveJSON(ONBOARDING_STORAGE_KEY, onboardingState);
}
