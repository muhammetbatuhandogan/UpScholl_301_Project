import type { BagItem } from './content';

export type Onboarding = {
  step: number;
  region: string;
  familySize: string;
  hasChildren: string;
  hasElderly: string;
  completed: boolean;
};

export type Task = { id: number; title: string; status: string };

export type FamilyMember = { id: number; name: string; role: string; score: number };

export type FamilyGroup = { family_average_score: number } | null;

export type ScoreBreakdown = {
  bagScore: number;
  taskScore: number;
  baseScore: number;
  familyScore: number;
};

export function calculateInitialScore({
  region,
  familySize,
  hasChildren,
  hasElderly,
}: Partial<Onboarding>): number {
  let score = 20;
  if (region) score += 20;
  if (Number(familySize) >= 3 || familySize === '5+') score += 15;
  if (hasChildren === 'yes') score += 10;
  if (hasElderly === 'yes') score += 10;
  return Math.min(score, 75);
}

export function calculateFamilyScore(members: FamilyMember[]): number {
  if (!members.length) return 0;
  const totalScore = members.reduce((sum, member) => sum + member.score, 0);
  return Math.round(totalScore / members.length);
}

export function calculateReadinessScore({
  onboarding,
  bagItems,
  tasks,
  familyMembers,
  familyGroup,
}: {
  onboarding: Onboarding;
  bagItems: BagItem[];
  tasks: Task[];
  familyMembers: FamilyMember[];
  familyGroup: FamilyGroup;
}): { total_score: number; breakdown: ScoreBreakdown } {
  const bagTotal = bagItems.length || 1;
  const bagChecked = bagItems.filter((item) => item.checked).length;
  const bagScore = Math.round((bagChecked / bagTotal) * 100);

  const taskTotal = tasks.length || 1;
  const doneTasks = tasks.filter((task) => task.status === 'done').length;
  const taskScore = tasks.length ? Math.round((doneTasks / taskTotal) * 100) : 0;

  const baseScore = calculateInitialScore(onboarding || {});

  const familyScore = familyGroup
    ? Math.round(familyGroup.family_average_score)
    : calculateFamilyScore(familyMembers || []);

  const total = Math.round(
    bagScore * 0.3 + taskScore * 0.25 + baseScore * 0.25 + familyScore * 0.2,
  );

  return {
    total_score: Math.min(100, Math.max(0, total)),
    breakdown: { bagScore, taskScore, baseScore, familyScore },
  };
}

export function scoreColor(total: number): string {
  if (total <= 40) return '#dc2626';
  if (total <= 70) return '#d97706';
  return '#16a34a';
}
