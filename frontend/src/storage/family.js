import { FAMILY_STORAGE_KEY } from "../content/constants.js";
import { loadJSON, saveJSON } from "./base.js";

export function loadFamilyState() {
  const parsed = loadJSON(FAMILY_STORAGE_KEY, {});
  const rawMembers =
    typeof parsed === "object" && parsed !== null && Array.isArray(parsed.members)
      ? parsed.members
      : [];
  const cleanedMembers = rawMembers
    .filter((member) => member && member.id && member.name)
    .map((member) => ({
      id: String(member.id),
      name: String(member.name),
      role: String(member.role || "Member"),
      score: Number(member.score) || 0
    }));
  return { members: cleanedMembers };
}

export function saveFamilyState(familyState) {
  saveJSON(FAMILY_STORAGE_KEY, familyState);
}
