import { EMERGENCY_STORAGE_KEY } from "../content/constants.js";
import { loadJSON, saveJSON } from "./base.js";

const DEFAULT_EMERGENCY = {
  sosContacts: [],
  selectedGuide: "during",
  lastSosAt: ""
};

export function loadEmergencyState() {
  const parsed = loadJSON(EMERGENCY_STORAGE_KEY, null);
  if (parsed === null || typeof parsed !== "object") {
    return { ...DEFAULT_EMERGENCY };
  }
  const contacts = Array.isArray(parsed.sosContacts) ? parsed.sosContacts : [];
  return {
    sosContacts: contacts
      .filter((contact) => contact && contact.id && contact.name && contact.phone)
      .map((contact) => ({
        id: String(contact.id),
        name: String(contact.name),
        phone: String(contact.phone)
      })),
    selectedGuide: String(parsed.selectedGuide || "during"),
    lastSosAt: String(parsed.lastSosAt || "")
  };
}

export function saveEmergencyState(emergencyState) {
  saveJSON(EMERGENCY_STORAGE_KEY, emergencyState);
}
