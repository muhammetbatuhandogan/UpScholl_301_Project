import { ApiError, request } from './api-client';
import { BAG_DEFAULT_ITEMS, type BagItem } from './content';
import {
  bagItemsFromApi,
  bagItemsToApi,
  familyMembersFromApi,
  onboardingFromApi,
  onboardingToApi,
  sosContactsFromApi,
  sosContactsToApi,
  type SosContact,
} from './mappers';
import {
  calculateReadinessScore,
  type FamilyGroup,
  type FamilyMember,
  type Onboarding,
  type ScoreBreakdown,
  type Task,
} from './score-engine';

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: { id: number; username: string; phone: string | null; created_at: string };
};

export type ScoreState = {
  total_score: number;
  breakdown: ScoreBreakdown | null;
  updated_at: string | null;
};

export async function trackEvent(eventName: string, payload: Record<string, unknown> = {}) {
  try {
    await request('/analytics/events', {
      method: 'POST',
      body: JSON.stringify({ event_name: eventName, payload }),
    });
  } catch {
    // analytics must not block user flows
  }
}

export async function loginWithPassword(username: string, password: string) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function requestOtp(phone: string) {
  return request<{ debug_code?: string | null }>('/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export async function verifyOtp(phone: string, code: string) {
  return request<LoginResponse>('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
}

export async function fetchMe() {
  return request<{ id: number; username: string; phone: string | null }>('/auth/me');
}

export async function logout() {
  try {
    await request('/auth/logout', { method: 'POST' });
  } catch {
    // token may already be invalid
  }
}

export async function fetchOnboarding(): Promise<Onboarding> {
  return onboardingFromApi(await request('/onboarding'));
}

export async function saveOnboarding(onboarding: Onboarding): Promise<Onboarding> {
  const data = await request('/onboarding', {
    method: 'PUT',
    body: JSON.stringify(onboardingToApi(onboarding)),
  });
  return onboardingFromApi(data);
}

export async function fetchBagItems(): Promise<BagItem[]> {
  const data = await request<{ items: { item_key: string; checked: boolean }[] }>('/bag/items');
  return bagItemsFromApi(data.items, BAG_DEFAULT_ITEMS);
}

export async function saveBagItems(items: BagItem[]): Promise<BagItem[]> {
  const data = await request<{ items: { item_key: string; checked: boolean }[] }>('/bag/items', {
    method: 'PUT',
    body: JSON.stringify({ items: bagItemsToApi(items) }),
  });
  return bagItemsFromApi(data.items, BAG_DEFAULT_ITEMS);
}

export async function fetchScore(): Promise<ScoreState> {
  return request<ScoreState>('/score');
}

export async function saveScore(totalScore: number, breakdown: ScoreBreakdown) {
  return request<ScoreState>('/score', {
    method: 'PUT',
    body: JSON.stringify({ total_score: totalScore, breakdown }),
  });
}

export async function fetchFamilyMembers(): Promise<FamilyMember[]> {
  const data = await request<{ items: any[] }>('/family/members');
  return familyMembersFromApi(data.items);
}

export async function createFamilyMember(payload: { name: string; role: string; score: number }) {
  return request<FamilyMember>('/family/members', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteFamilyMember(memberId: number) {
  await request(`/family/members/${memberId}`, { method: 'DELETE' });
}

export async function fetchFamilyGroup(): Promise<any | null> {
  try {
    return await request('/family/group');
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createFamilyGroup() {
  return request('/family/group', { method: 'POST' });
}

export async function joinFamilyGroup(code: string) {
  return request('/family/group/join', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function leaveFamilyGroup() {
  await request('/family/group/leave', { method: 'DELETE' });
}

export async function fetchSosContacts(): Promise<SosContact[]> {
  return sosContactsFromApi(await request('/emergency/contacts'));
}

export async function saveSosContacts(contacts: SosContact[]): Promise<SosContact[]> {
  const data = await request('/emergency/contacts', {
    method: 'PUT',
    body: JSON.stringify({ contacts: sosContactsToApi(contacts) }),
  });
  return sosContactsFromApi(data as any[]);
}

export async function triggerSos(latitude: number | null, longitude: number | null) {
  return request('/emergency/sos', {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude }),
  });
}

export async function fetchTasks(): Promise<Task[]> {
  const data = await request<{ items: Task[] }>('/tasks');
  return Array.isArray(data.items) ? data.items : [];
}

export async function createTask(title: string, status = 'todo'): Promise<Task> {
  return request<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify({ title, status }),
  });
}

export async function updateTask(id: number, title: string, status: string): Promise<Task> {
  return request<Task>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ title, status }),
  });
}

export async function registerPushDevice(token: string, platform: string) {
  return request('/notifications/devices', {
    method: 'POST',
    body: JSON.stringify({ token, platform }),
  });
}

export type UserData = {
  onboarding: Onboarding;
  bagItems: BagItem[];
  score: ScoreState;
  familyMembers: FamilyMember[];
  familyGroup: FamilyGroup;
  sosContacts: SosContact[];
  tasks: Task[];
};

export async function loadUserData(): Promise<UserData> {
  const [onboarding, bagItems, score, familyMembers, familyGroup, sosContacts, tasks] =
    await Promise.all([
      fetchOnboarding(),
      fetchBagItems(),
      fetchScore(),
      fetchFamilyMembers(),
      fetchFamilyGroup(),
      fetchSosContacts(),
      fetchTasks(),
    ]);
  return { onboarding, bagItems, score, familyMembers, familyGroup, sosContacts, tasks };
}

export async function syncScore(data: {
  onboarding: Onboarding;
  bagItems: BagItem[];
  tasks: Task[];
  familyMembers: FamilyMember[];
  familyGroup: FamilyGroup;
}): Promise<ScoreState> {
  const computed = calculateReadinessScore(data);
  return saveScore(computed.total_score, computed.breakdown);
}
