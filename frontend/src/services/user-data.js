import { BAG_DEFAULT_ITEMS } from "../content/bag-items.js";
import { calculateReadinessScore } from "../core/score-engine.js";
import { request } from "../ui/api-client.js";
import {
  bagItemsFromApi,
  bagItemsToApi,
  familyMembersFromApi,
  onboardingFromApi,
  onboardingToApi,
  sosContactsFromApi,
  sosContactsToApi
} from "./mappers.js";

export async function trackEvent(eventName, payload = {}) {
  try {
    await request("/analytics/events", {
      method: "POST",
      body: JSON.stringify({ event_name: eventName, payload })
    });
  } catch (_error) {
    // Analytics must not block user flows.
  }
}

export async function fetchOnboarding() {
  const data = await request("/onboarding");
  return onboardingFromApi(data);
}

export async function saveOnboarding(onboarding) {
  const data = await request("/onboarding", {
    method: "PUT",
    body: JSON.stringify(onboardingToApi(onboarding))
  });
  return onboardingFromApi(data);
}

export async function fetchBagItems() {
  const data = await request("/bag/items");
  return bagItemsFromApi(data.items, BAG_DEFAULT_ITEMS);
}

export async function saveBagItems(items) {
  const data = await request("/bag/items", {
    method: "PUT",
    body: JSON.stringify({ items: bagItemsToApi(items) })
  });
  return bagItemsFromApi(data.items, BAG_DEFAULT_ITEMS);
}

export async function fetchScore() {
  return request("/score");
}

export async function saveScore(totalScore, breakdown) {
  return request("/score", {
    method: "PUT",
    body: JSON.stringify({ total_score: totalScore, breakdown })
  });
}

export async function syncScore(state) {
  const computed = calculateReadinessScore({
    onboarding: state.onboarding,
    bagItems: state.bagItems,
    tasks: state.tasks,
    familyMembers: state.family.members,
    familyGroup: state.familyGroup
  });
  const data = await saveScore(computed.total_score, computed.breakdown);
  state.score = {
    total_score: data.total_score,
    breakdown: data.breakdown,
    updated_at: data.updated_at
  };
  return data;
}

export async function fetchFamilyMembers() {
  const data = await request("/family/members");
  return familyMembersFromApi(data.items);
}

export async function createFamilyMember(payload) {
  const data = await request("/family/members", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return {
    id: data.id,
    name: data.name,
    role: data.role,
    score: data.score
  };
}

export async function deleteFamilyMember(memberId) {
  await request(`/family/members/${memberId}`, { method: "DELETE" });
}

export async function fetchFamilyGroup() {
  try {
    return await request("/family/group");
  } catch (error) {
    if (String(error.message).includes("404")) {
      return null;
    }
    throw error;
  }
}

export async function createFamilyGroup() {
  return request("/family/group", { method: "POST" });
}

export async function joinFamilyGroup(code) {
  return request("/family/group/join", {
    method: "POST",
    body: JSON.stringify({ code })
  });
}

export async function leaveFamilyGroup() {
  await request("/family/group/leave", { method: "DELETE" });
}

export async function fetchSosContacts() {
  const data = await request("/emergency/contacts");
  return sosContactsFromApi(data);
}

export async function saveSosContacts(contacts) {
  const data = await request("/emergency/contacts", {
    method: "PUT",
    body: JSON.stringify({ contacts: sosContactsToApi(contacts) })
  });
  return sosContactsFromApi(data);
}

export async function triggerSos(latitude, longitude) {
  return request("/emergency/sos", {
    method: "POST",
    body: JSON.stringify({ latitude, longitude })
  });
}

export async function fetchSosLogs() {
  return request("/emergency/sos/logs");
}

export async function loadUserData(state) {
  const [
    onboarding,
    bagItems,
    score,
    familyMembers,
    familyGroup,
    sosContacts,
    tasksData
  ] = await Promise.all([
    fetchOnboarding(),
    fetchBagItems(),
    fetchScore(),
    fetchFamilyMembers(),
    fetchFamilyGroup(),
    fetchSosContacts(),
    request("/tasks")
  ]);

  state.onboarding = onboarding;
  state.bagItems = bagItems;
  state.score = {
    total_score: score.total_score,
    breakdown: score.breakdown,
    updated_at: score.updated_at
  };
  state.family = { members: familyMembers };
  state.familyGroup = familyGroup;
  state.emergency = {
    ...state.emergency,
    sosContacts
  };
  state.tasks = Array.isArray(tasksData.items) ? tasksData.items : [];
  state.lastUpdated = new Date().toLocaleTimeString();
}
